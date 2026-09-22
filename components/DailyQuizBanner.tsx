"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Play } from "lucide-react";
import { getApprovedQuizzesOnce } from "@/lib/quizzes";
import { pickTodaysQuiz, getDailyStreak, hasPlayedTodaysQuiz } from "@/lib/dailyQuiz";
import type { Quiz } from "@/lib/types";

export default function DailyQuizBanner() {
  const [todaysQuiz, setTodaysQuiz] = useState<Quiz | null>(null);
  const [streak, setStreak] = useState(0);
  const [playedToday, setPlayedToday] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getApprovedQuizzesOnce()
      .then((quizzes) => {
        setTodaysQuiz(pickTodaysQuiz(quizzes));
        setStreak(getDailyStreak());
        setPlayedToday(hasPlayedTodaysQuiz());
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !todaysQuiz) return null;

  return (
    <div className="card-frame p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto mb-12">
      <div className="flex-1 text-center sm:text-left">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted block mb-1">
          Quiz of the Day · {todaysQuiz.category}
        </span>
        <h3 className="font-display font-bold text-lg text-fg">{todaysQuiz.title}</h3>
        {streak > 0 && (
          <p className="font-mono text-xs text-fg mt-1 flex items-center justify-center sm:justify-start gap-1">
            <Flame size={12} /> {streak}-day streak{playedToday ? " · played today" : ""}
          </p>
        )}
      </div>
      <Link
        href={`/play/${todaysQuiz.id}`}
        className="flex items-center gap-2 px-5 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors whitespace-nowrap"
      >
        <Play size={13} /> {playedToday ? "Play Again" : "Play Today's Quiz"}
      </Link>
    </div>
  );
}
