"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToOwnerQuizzes } from "@/lib/quizzes";
import QuizCard from "@/components/dashboard/QuizCard";
import Navbar from "@/components/Navbar";
import type { Quiz } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToOwnerQuizzes(user.uid, setQuizzes);
    return unsubscribe;
  }, [user]);

  if (loading || !user) {
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="font-mono text-xs tracking-widest text-muted uppercase block mb-2">
                My Quizzes
              </span>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg">
                Your quiz library.
              </h1>
            </div>
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors"
            >
              <Plus size={14} /> New Quiz
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <div className="card-frame p-10 text-center">
              <p className="text-fg-dim mb-4">You haven&apos;t created a quiz yet.</p>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors"
              >
                <Plus size={14} /> Create Your First Quiz
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} ownerId={user.uid} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
