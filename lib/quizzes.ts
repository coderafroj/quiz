import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  increment,
} from "firebase/firestore";
import { requireDb } from "./firebase";
import type { Quiz, QuizInput } from "./types";

const COLLECTION = "quizzes";

export async function createQuiz(input: QuizInput): Promise<string> {
  const db = requireDb();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playCount: 0,
  });
  return ref.id;
}

export async function updateQuiz(id: string, input: Partial<QuizInput>) {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTION, id), { ...input, updatedAt: Date.now() });
}

export async function deleteQuiz(id: string) {
  const db = requireDb();
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function incrementPlayCount(id: string) {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTION, id), { playCount: increment(1) });
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  const db = requireDb();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Quiz, "id">) };
}

export function subscribeToOwnerQuizzes(
  ownerId: string,
  onChange: (quizzes: Quiz[]) => void,
  onError?: (err: Error) => void
) {
  const db = requireDb();
  const q = query(collection(db, COLLECTION), where("ownerId", "==", ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const quizzes = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Quiz, "id">) }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      onChange(quizzes);
    },
    (err) => onError?.(err as Error)
  );
}

export function subscribeToAllQuizzes(
  onChange: (quizzes: Quiz[]) => void,
  onError?: (err: Error) => void
) {
  const db = requireDb();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quiz, "id">) })));
    },
    (err) => onError?.(err as Error)
  );
}
