import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { requireDb } from "./firebase";
import type { LiveSession, LivePlayer, LiveAnswer, Quiz, QuizQuestionItem } from "./types";

const SESSIONS = "sessions";
const PLAYERS = "players";
const ANSWERS = "answers";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Creates a new live session for a quiz, retrying on rare code collisions. */
export async function createSession(quiz: Quiz, hostId: string): Promise<string> {
  const db = requireDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const ref = doc(db, SESSIONS, code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    const session: LiveSession = {
      code,
      quizId: quiz.id,
      quizTitle: quiz.title,
      hostId,
      status: "lobby",
      mode: "classic",
      currentQuestionIndex: -1,
      questionStartedAt: null,
      createdAt: Date.now(),
    };
    await setDoc(ref, session);
    return code;
  }
  throw new Error("Could not allocate a session code — please try again.");
}

/** Host-only, lobby-only: switches between Classic and Elimination before starting. */
export async function setSessionMode(code: string, mode: "classic" | "elimination") {
  const db = requireDb();
  await updateDoc(doc(db, SESSIONS, code), { mode });
}

export function subscribeToSession(
  code: string,
  onChange: (session: LiveSession | null) => void
) {
  const db = requireDb();
  return onSnapshot(doc(db, SESSIONS, code), (snap) => {
    onChange(snap.exists() ? (snap.data() as LiveSession) : null);
  });
}

export function subscribeToPlayers(code: string, onChange: (players: LivePlayer[]) => void) {
  const db = requireDb();
  return onSnapshot(collection(db, SESSIONS, code, PLAYERS), (snapshot) => {
    const players = snapshot.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<LivePlayer, "id">) }))
      .sort((a, b) => b.score - a.score);
    onChange(players);
  });
}

export function subscribeToAnswers(
  code: string,
  questionIndex: number,
  onChange: (answers: LiveAnswer[]) => void
) {
  const db = requireDb();
  const q = query(collection(db, SESSIONS, code, ANSWERS), where("questionIndex", "==", questionIndex));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LiveAnswer, "id">) })));
  });
}

/** Player joins the lobby with a display name. Returns the new player id. */
export async function joinSession(code: string, name: string): Promise<string> {
  const db = requireDb();
  const sessionSnap = await getDoc(doc(db, SESSIONS, code));
  if (!sessionSnap.exists()) throw new Error("That game code doesn't exist.");

  const ref = await addDoc(collection(db, SESSIONS, code, PLAYERS), {
    name,
    score: 0,
    eliminated: false,
    joinedAt: Date.now(),
  });
  return ref.id;
}

export async function startSession(code: string) {
  const db = requireDb();
  await updateDoc(doc(db, SESSIONS, code), {
    status: "question",
    currentQuestionIndex: 0,
    questionStartedAt: Date.now(),
  });
}

export async function revealAnswer(code: string) {
  const db = requireDb();
  await updateDoc(doc(db, SESSIONS, code), { status: "reveal" });
}

export async function nextQuestion(code: string, session: LiveSession, totalQuestions: number) {
  const db = requireDb();
  const nextIndex = session.currentQuestionIndex + 1;
  if (nextIndex >= totalQuestions) {
    await updateDoc(doc(db, SESSIONS, code), { status: "ended" });
    return;
  }
  await updateDoc(doc(db, SESSIONS, code), {
    status: "question",
    currentQuestionIndex: nextIndex,
    questionStartedAt: Date.now(),
  });
}

export async function endSession(code: string) {
  const db = requireDb();
  await updateDoc(doc(db, SESSIONS, code), { status: "ended" });
}

/**
 * Elimination mode only: called right when the host reveals the answer.
 * Anyone still alive who didn't answer correctly this round is knocked out
 * — they keep watching (and keep their score/rank), they just can't answer
 * future questions. Classic mode never calls this.
 */
export async function applyElimination(
  code: string,
  players: LivePlayer[],
  answers: LiveAnswer[],
  correctIndex: number
) {
  const db = requireDb();
  const answeredMap = new Map(answers.map((a) => [a.playerId, a]));

  const updates = players
    .filter((p) => !p.eliminated)
    .filter((p) => {
      const a = answeredMap.get(p.id);
      return !a || a.selectedIndex !== correctIndex;
    })
    .map((p) => updateDoc(doc(db, SESSIONS, code, PLAYERS, p.id), { eliminated: true }));

  await Promise.all(updates);
}

/** Submits a player's answer, scores it (with a speed bonus), and updates their total. */
export async function submitAnswer(
  code: string,
  playerId: string,
  playerName: string,
  questionIndex: number,
  question: QuizQuestionItem,
  selectedIndex: number,
  questionStartedAt: number
) {
  const db = requireDb();
  const correct = selectedIndex === question.correctIndex;
  const elapsedSeconds = Math.max(0, (Date.now() - questionStartedAt) / 1000);
  const speedRatio = Math.max(0, 1 - elapsedSeconds / Math.max(question.timeLimit, 1));
  const pointsEarned = correct ? Math.round(question.points * (0.5 + 0.5 * speedRatio)) : 0;

  const answerId = `${playerId}_${questionIndex}`;
  await setDoc(doc(db, SESSIONS, code, ANSWERS, answerId), {
    playerId,
    playerName,
    questionIndex,
    selectedIndex,
    correct,
    pointsEarned,
    answeredAt: Date.now(),
    serverTime: serverTimestamp(),
  });

  if (pointsEarned > 0) {
    await updateDoc(doc(db, SESSIONS, code, PLAYERS, playerId), {
      score: increment(pointsEarned),
    });
  }
}
