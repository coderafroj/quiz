import { collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { requireDb } from "./firebase";
import type { SoloAttempt } from "./types";

function attemptsRef(quizId: string) {
  const db = requireDb();
  return collection(db, "quizzes", quizId, "attempts");
}

export async function recordAttempt(
  quizId: string,
  playerName: string,
  score: number,
  total: number
) {
  await addDoc(attemptsRef(quizId), {
    playerName,
    score,
    total,
    completedAt: Date.now(),
  });
}

export function subscribeToLeaderboard(
  quizId: string,
  onChange: (attempts: SoloAttempt[]) => void
) {
  const q = query(attemptsRef(quizId), orderBy("score", "desc"), limit(10));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SoloAttempt, "id">) })));
  });
}
