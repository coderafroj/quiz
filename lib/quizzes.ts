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

/**
 * Creates a quiz. Admin-authored quizzes are auto-approved (they're the
 * platform owner's own content); everyone else's quizzes start "pending"
 * and only appear on /explore once an admin approves them. Direct links
 * (solo play / live hosting) work immediately regardless of status — the
 * approval gate only controls public discoverability.
 */
export async function createQuiz(input: QuizInput, isAdminAuthor: boolean): Promise<string> {
  const db = requireDb();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    status: isAdminAuthor ? "approved" : "pending",
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

export async function approveQuiz(id: string) {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTION, id), { status: "approved", updatedAt: Date.now() });
}

export async function rejectQuiz(id: string) {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTION, id), { status: "rejected", updatedAt: Date.now() });
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

/** Quizzes awaiting admin review — powers the admin approval queue. */
export function subscribeToPendingQuizzes(
  onChange: (quizzes: Quiz[]) => void,
  onError?: (err: Error) => void
) {
  const db = requireDb();
  const q = query(collection(db, COLLECTION), where("status", "==", "pending"));
  return onSnapshot(
    q,
    (snapshot) => {
      const quizzes = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Quiz, "id">) }))
        .sort((a, b) => a.createdAt - b.createdAt);
      onChange(quizzes);
    },
    (err) => onError?.(err as Error)
  );
}

// Public, playable quizzes only — used by the /explore page so anyone
// (signed in or not) can browse quizzes grouped by topic/category. Only
// approved quizzes are discoverable this way; unapproved ones still work
// via direct link, they just don't show up here or in the sitemap.
export function subscribeToPublicQuizzes(
  onChange: (quizzes: Quiz[]) => void,
  onError?: (err: Error) => void
) {
  const db = requireDb();
  const q = query(
    collection(db, COLLECTION),
    where("visibility", "==", "public"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(
        snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Quiz, "id">) }))
          .filter((quiz) => quiz.questions?.length > 0)
      );
    },
    (err) => onError?.(err as Error)
  );
}
