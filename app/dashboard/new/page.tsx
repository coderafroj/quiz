"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import QuizBuilder from "@/components/dashboard/QuizBuilder";

export default function NewQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

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
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg text-center mb-10">
          Build your quiz.
        </h1>
        <QuizBuilder />
      </main>
    </>
  );
}
