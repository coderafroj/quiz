"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getQuiz } from "@/lib/quizzes";
import { subscribeToLeaderboard } from "@/lib/attempts";
import Navbar from "@/components/Navbar";
import type { Quiz, SoloAttempt } from "@/lib/types";

export default function QuizResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);
  const [attempts, setAttempts] = useState<SoloAttempt[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    getQuiz(params.quizId).then(setQuiz);
  }, [params.quizId]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(params.quizId, setAttempts);
    return unsubscribe;
  }, [params.quizId]);

  if (loading || !user || quiz === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted hover:text-fg text-sm font-mono mb-8">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <h1 className="font-display font-extrabold text-3xl text-fg mb-2">
            {quiz?.title || "Quiz"} — Solo Results
          </h1>
          <p className="text-fg-dim mb-10">Top scores from people who played this quiz solo.</p>

          {attempts.length === 0 ? (
            <div className="card-frame p-10 text-center text-fg-dim">
              No one has played this quiz solo yet. Share the link to get started.
            </div>
          ) : (
            <div className="card-frame divide-y divide-border">
              {attempts.map((a, i) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="font-mono text-sm text-muted w-6">
                    {i === 0 ? <Trophy size={16} className="text-fg" /> : `#${i + 1}`}
                  </span>
                  <span className="flex-1 font-semibold text-fg">{a.playerName}</span>
                  <span className="font-mono text-sm text-fg-dim">
                    {a.score} / {a.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
