import { collection, collectionGroup, doc, getDocs, limit, onSnapshot, query, setDoc } from "firebase/firestore";
import { requireDb } from "./firebase";

export interface QuizProgress {
  quizId: string;
  uid?: string;
  userName?: string;
  title?: string;
  best: number; // best score
  total: number;
  attempts: number;
  lastScore: number;
  lastAt: number;
}

const LS_KEY = "cp_progress_v1";

export const pct = (p: Pick<QuizProgress, "best" | "total">) => (p.total ? Math.round((p.best / p.total) * 100) : 0);

function readLocal(): Record<string, QuizProgress> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, QuizProgress>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable (private mode) — Firestore copy still works
  }
}

export function getLocalProgress(): Record<string, QuizProgress> {
  return readLocal();
}

/** Saves a finished attempt: keeps best score, attempt count and last result — locally and in Firestore. */
export async function saveProgress(
  uid: string | null,
  userName: string,
  quizId: string,
  title: string,
  score: number,
  total: number
) {
  const map = readLocal();
  const prev = map[quizId];
  const next: QuizProgress = {
    quizId,
    uid: uid || undefined,
    userName,
    title,
    best: Math.max(prev?.best ?? 0, score),
    total,
    attempts: (prev?.attempts ?? 0) + 1,
    lastScore: score,
    lastAt: Date.now(),
  };
  map[quizId] = next;
  writeLocal(map);

  if (!uid) return;
  try {
    const db = requireDb();
    await setDoc(doc(db, "users", uid, "progress", quizId), JSON.parse(JSON.stringify(next)), { merge: true });
  } catch {
    // offline / rules — local copy is already saved
  }
}

/** Live progress for the signed-in user (merged with anything saved locally). */
export function subscribeToProgress(uid: string, onChange: (map: Record<string, QuizProgress>) => void) {
  const db = requireDb();
  return onSnapshot(
    collection(db, "users", uid, "progress"),
    (snap) => {
      const merged = { ...readLocal() };
      snap.docs.forEach((d) => {
        merged[d.id] = { quizId: d.id, ...(d.data() as Omit<QuizProgress, "quizId">) };
      });
      onChange(merged);
    },
    () => onChange(readLocal())
  );
}

/** Admin-only: every learner's progress docs (needs the collection-group read rule). */
export async function fetchAllProgress(max = 2000): Promise<QuizProgress[]> {
  const db = requireDb();
  const snap = await getDocs(query(collectionGroup(db, "progress"), limit(max)));
  return snap.docs.map((d) => ({ quizId: d.id, ...(d.data() as Omit<QuizProgress, "quizId">) }));
}
