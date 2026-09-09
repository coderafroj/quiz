"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getQuiz } from "@/lib/quizzes";
import Navbar from "@/components/Navbar";
import QuizBuilder from "@/components/dashboard/QuizBuilder";
import type { Quiz } from "@/lib/types";

export default function EditQuizPage() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  const params = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    getQuiz(params.quizId).then(setQuiz);
  }, [params.quizId]);

  if (loading || !user || quiz === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Quiz not found.
      </div>
    );
  }

  const canEdit = quiz.ownerId === user.uid || profile?.role === "admin";
  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        You don&apos;t have permission to edit this quiz.
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg text-center mb-10">
          Edit quiz.
        </h1>
        <QuizBuilder existingQuiz={quiz} />
      </main>
    </>
  );
}
