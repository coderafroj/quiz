"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createQuiz } from "@/lib/quizzes";
import { SEED_QUIZZES } from "@/lib/seedQuizzes";
import Navbar from "@/components/Navbar";

export default function ImportQuizzesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [importing, setImporting] = useState<Record<number, "pending" | "done" | "error">>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, profile, router]);

  async function importOne(index: number) {
    if (!user || !profile) return;
    setImporting((s) => ({ ...s, [index]: "pending" }));
    try {
      await createQuiz(
        { ...SEED_QUIZZES[index], ownerId: user.uid, ownerName: profile.displayName },
        true
      );
      setImporting((s) => ({ ...s, [index]: "done" }));
    } catch {
      setImporting((s) => ({ ...s, [index]: "error" }));
    }
  }

  async function importAll() {
    setBusy(true);
    for (let i = 0; i < SEED_QUIZZES.length; i++) {
      if (importing[i] === "done") continue;
      await importOne(i);
    }
    setBusy(false);
  }

  if (loading || !user || profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading…
      </div>
    );
  }

  const doneCount = Object.values(importing).filter((v) => v === "done").length;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted hover:text-fg text-sm font-mono mb-8">
            <ArrowLeft size={14} /> Back to Admin
          </Link>

          <span className="font-mono text-xs tracking-widest text-muted uppercase block mb-2">
            Ready-Made Content
          </span>
          <h1 className="font-display font-extrabold text-3xl text-fg mb-3">
            Import starter quizzes.
          </h1>
          <p className="text-fg-dim mb-10">
            Hand-written questions across Python, C, C++, Java, and General Knowledge — no AI
            quota needed. Each one is created under your account, auto-approved, and public
            immediately.
          </p>

          <button
            onClick={importAll}
            disabled={busy || doneCount === SEED_QUIZZES.length}
            className="w-full flex items-center justify-center gap-2 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-50 mb-8"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {doneCount === SEED_QUIZZES.length ? "All Imported" : `Import All (${SEED_QUIZZES.length})`}
          </button>

          <div className="space-y-3">
            {SEED_QUIZZES.map((quiz, i) => {
              const status = importing[i];
              return (
                <div key={quiz.title} className="card-frame p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-fg font-medium truncate">{quiz.title}</p>
                    <p className="text-muted text-xs font-mono truncate">
                      {quiz.category} · {quiz.difficulty} · {quiz.questions.length} questions
                    </p>
                  </div>
                  <button
                    onClick={() => importOne(i)}
                    disabled={status === "pending" || status === "done"}
                    className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-mono uppercase hover:border-fg transition-colors disabled:opacity-60 flex-shrink-0"
                  >
                    {status === "pending" && <Loader2 size={13} className="animate-spin" />}
                    {status === "done" && <Check size={13} />}
                    {status === "done" ? "Imported" : status === "pending" ? "Importing…" : status === "error" ? "Retry" : "Import"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
