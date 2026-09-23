import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

/** Admin-only spotlight toggle — featured quizzes are pinned to the top of /explore. */
export async function setFeatured(id: string, featured: boolean) {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTION, id), { featured });
}

/**
 * Forks a quiz into a brand-new copy owned by someone else — GitHub-style
 * remixing. Questions are deep-copied with fresh IDs so editing the remix
 * never touches the original. The new copy always starts private+pending
 * (the remixer decides if/when to publish their own version), and the
 * original's `remixCount` ticks up for social proof.
 */
export async function remixQuiz(
  original: Quiz,
  newOwnerId: string,
  newOwnerName: string,
  isAdminAuthor: boolean
): Promise<string> {
  const db = requireDb();
  const copiedQuestions = original.questions.map((q) => ({
    ...q,
    id: crypto.randomUUID(),
  }));

  const newId = await createQuiz(
    {
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      title: `${original.title} (Remix)`,
      description: original.description,
      language: original.language,
      category: original.category,
      difficulty: original.difficulty,
      questions: copiedQuestions,
      visibility: "unlisted",
      remixedFrom: original.id,
      remixedFromTitle: original.title,
    },
    isAdminAuthor
  );

  await updateDoc(doc(db, COLLECTION, original.id), { remixCount: increment(1) });
  return newId;
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
      const quizzes = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Quiz, "id">) }))
        .filter((quiz) => quiz.questions?.length > 0)
        .sort((a, b) => {
          if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
          return b.createdAt - a.createdAt;
        });
      onChange(quizzes);
    },
    (err) => onError?.(err as Error)
  );
}

/** One-time fetch of approved+public quizzes — used to deterministically pick "today's quiz" without keeping a live listener open on the home page. */
export async function getApprovedQuizzesOnce(): Promise<Quiz[]> {
  const db = requireDb();
  const q = query(
    collection(db, COLLECTION),
    where("visibility", "==", "public"),
    where("status", "==", "approved")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Quiz, "id">) }))
    .filter((quiz) => quiz.questions?.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id)); // stable order so the same day always resolves to the same quiz
}
