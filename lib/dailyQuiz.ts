import type { Quiz } from "./types";

const STREAK_KEY = "codarafroj_daily_streak";
const LAST_PLAYED_KEY = "codarafroj_daily_last_played";

function todayString(): string {
  return new Date().toISOString().slice(0, 10); // "2026-09-18"
}

/** Simple deterministic string hash (djb2) — same date always maps to the same index. */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Picks "today's quiz" from the approved+public pool — no database write,
 * no cron job, no admin action needed. Every visitor on the same calendar
 * day gets the same quiz because the pick is a pure function of the date
 * string and the (stably-sorted) quiz list.
 */
export function pickTodaysQuiz(approvedQuizzes: Quiz[]): Quiz | null {
  if (approvedQuizzes.length === 0) return null;
  const index = hashString(todayString()) % approvedQuizzes.length;
  return approvedQuizzes[index];
}

export function getDailyStreak(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STREAK_KEY) || "0");
}

export function hasPlayedTodaysQuiz(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LAST_PLAYED_KEY) === todayString();
}

/**
 * Call once when the player finishes today's daily quiz. Extends the streak
 * if they played yesterday too, starts a new streak of 1 otherwise, and is
 * a no-op if they already completed today's (avoids double-counting).
 */
export function recordDailyCompletion(): number {
  if (typeof window === "undefined") return 0;
  const today = todayString();
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  if (lastPlayed === today) return getDailyStreak();

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentStreak = getDailyStreak();
  const nextStreak = lastPlayed === yesterday ? currentStreak + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(nextStreak));
  localStorage.setItem(LAST_PLAYED_KEY, today);
  return nextStreak;
}
