// A minimal spaced-repetition system stored entirely in the browser — no
// account or backend needed to benefit from it. Every wrong answer schedules
// that question for review roughly a day later; a correct answer during
// review pushes it further out. This turns a one-off quiz into an actual
// study tool instead of a single-play game.

interface ReviewEntry {
  questionId: string;
  nextReviewAt: number; // epoch ms
  timesWrong: number;
}

function storageKey(quizId: string): string {
  return `codarafroj_review_${quizId}`;
}

function loadQueue(quizId: string): ReviewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(quizId));
    return raw ? (JSON.parse(raw) as ReviewEntry[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(quizId: string, entries: ReviewEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(quizId), JSON.stringify(entries));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Call after grading each answer during a solo play-through. */
export function recordAnswerOutcome(quizId: string, questionId: string, wasCorrect: boolean) {
  const queue = loadQueue(quizId);
  const existing = queue.find((e) => e.questionId === questionId);

  if (wasCorrect) {
    // Correct: if it was under review, remove it (mastered); otherwise no-op.
    if (existing) {
      saveQueue(quizId, queue.filter((e) => e.questionId !== questionId));
    }
    return;
  }

  // Wrong: schedule for review, backing off further each time it's missed again.
  if (existing) {
    existing.timesWrong += 1;
    existing.nextReviewAt = Date.now() + DAY_MS * existing.timesWrong;
  } else {
    queue.push({ questionId, nextReviewAt: Date.now() + DAY_MS, timesWrong: 1 });
  }
  saveQueue(quizId, queue);
}

/** Questions due for review right now (nextReviewAt has passed). */
export function getDueQuestionIds(quizId: string): string[] {
  const queue = loadQueue(quizId);
  const now = Date.now();
  return queue.filter((e) => e.nextReviewAt <= now).map((e) => e.questionId);
}

/** Total questions still in the review queue (due or not) — shown as "N weak spots". */
export function getReviewQueueSize(quizId: string): number {
  return loadQueue(quizId).length;
}
