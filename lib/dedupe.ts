import type { Quiz, QuizQuestionItem } from "./types";

/** Lower-case, strip punctuation/extra spaces so "Python Basics " == "python basics". */
export function norm(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/\(remix\)/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export interface DuplicateGroup {
  key: string;
  keeper: Quiz;
  duplicates: Quiz[];
}

/** Stable ids written by the importer ("olevel-…", "seed-…") are always preferred as the copy to keep. */
function keeperScore(q: Quiz): number {
  const stable = /^(olevel|seed)-/.test(q.id) ? 1_000_000_000 : 0;
  return stable + (q.playCount || 0) * 1000 - q.createdAt / 1e10;
}

/** Groups quizzes that have the same title + category (case/punctuation insensitive). */
export function findDuplicateQuizGroups(quizzes: Quiz[]): DuplicateGroup[] {
  const buckets = new Map<string, Quiz[]>();
  for (const q of quizzes) {
    if (q.remixedFrom) continue; // a remix is intentionally a copy
    const key = `${norm(q.title)}::${norm(q.category)}::${q.ownerId}`;
    buckets.set(key, [...(buckets.get(key) || []), q]);
  }
  const groups: DuplicateGroup[] = [];
  for (const [key, list] of buckets) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => keeperScore(b) - keeperScore(a));
    groups.push({ key, keeper: sorted[0], duplicates: sorted.slice(1) });
  }
  return groups.sort((a, b) => b.duplicates.length - a.duplicates.length);
}

const questionKey = (q: QuizQuestionItem) => norm(q.text);

/** Removes repeated questions inside a single quiz (same normalised text). */
export function dedupeQuestions(questions: QuizQuestionItem[]): { unique: QuizQuestionItem[]; removed: number } {
  const seen = new Set<string>();
  const unique: QuizQuestionItem[] = [];
  for (const q of questions) {
    const k = questionKey(q);
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(q);
  }
  return { unique, removed: questions.length - unique.length };
}

export interface NearDuplicate {
  a: Quiz;
  b: Quiz;
  shared: number;
  similarity: number; // 0..1 of the smaller quiz
}

/** "Diff check": finds different-titled quizzes whose question sets overlap heavily. */
export function findNearDuplicates(quizzes: Quiz[], threshold = 0.6): NearDuplicate[] {
  const sets = quizzes.map((q) => ({ q, keys: new Set((q.questions || []).map(questionKey)) }));
  const out: NearDuplicate[] = [];
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const A = sets[i];
      const B = sets[j];
      if (A.keys.size === 0 || B.keys.size === 0) continue;
      if (norm(A.q.title) === norm(B.q.title)) continue; // already caught as exact duplicates
      let shared = 0;
      for (const k of A.keys) if (B.keys.has(k)) shared++;
      const similarity = shared / Math.min(A.keys.size, B.keys.size);
      if (shared >= 3 && similarity >= threshold) out.push({ a: A.q, b: B.q, shared, similarity });
    }
  }
  return out.sort((x, y) => y.similarity - x.similarity);
}
