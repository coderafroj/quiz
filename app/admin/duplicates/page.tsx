"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Loader2, GitCompare, Eraser } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { deleteQuiz, subscribeToAllQuizzes, updateQuiz } from "@/lib/quizzes";
import { dedupeQuestions, findDuplicateQuizGroups, findNearDuplicates } from "@/lib/dedupe";
import type { Quiz } from "@/lib/types";

const fmt = (t: number) => new Date(t).toLocaleDateString();

export default function DuplicatesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    return subscribeToAllQuizzes(setQuizzes);
  }, [profile?.role]);

  const groups = useMemo(() => findDuplicateQuizGroups(quizzes), [quizzes]);
  const near = useMemo(() => findNearDuplicates(quizzes), [quizzes]);
  const withInternalDupes = useMemo(
    () => quizzes.filter((q) => dedupeQuestions(q.questions || []).removed > 0),
    [quizzes]
  );
  const totalExtra = groups.reduce((n, g) => n + g.duplicates.length, 0);

  async function removeGroup(ids: string[], label: string) {
    setBusy(label);
    for (const id of ids) await deleteQuiz(id).catch(() => {});
    setBusy(null);
    setMsg(`Removed ${ids.length} duplicate cop${ids.length > 1 ? "ies" : "y"}.`);
  }

  async function removeAll() {
    if (!window.confirm(`Delete ${totalExtra} duplicate quizzes? The best copy of each is kept.`)) return;
    await removeGroup(groups.flatMap((g) => g.duplicates.map((d) => d.id)), "all");
  }

  async function cleanQuestions(q: Quiz) {
    setBusy(q.id);
    const { unique, removed } = dedupeQuestions(q.questions);
    await updateQuiz(q.id, { questions: unique });
    setBusy(null);
    setMsg(`Removed ${removed} repeated question(s) from "${q.title}".`);
  }

  if (loading || profile?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">Loading…</div>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-24 px-4 sm:px-6 md:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted hover:text-fg text-sm font-mono mb-6">
            <ArrowLeft size={14} /> Back to Admin
          </Link>
          <h1 className="font-display font-extrabold text-3xl text-fg mb-2">Duplicate cleaner</h1>
          <p className="text-fg-dim text-sm mb-6">
            Finds quizzes with the same title and category, repeated questions inside a quiz, and different quizzes
            that share most of their questions. The best copy (stable ID, most plays, oldest) is always kept.
          </p>
          {msg && <p className="mb-4 text-xs font-mono text-correct">{msg}</p>}

          <section className="mb-10">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
                Exact duplicates ({totalExtra} extra)
              </h2>
              {totalExtra > 0 && (
                <button
                  onClick={removeAll}
                  disabled={!!busy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-fg text-bg text-[11px] font-mono uppercase hover:bg-fg-dim disabled:opacity-50"
                >
                  {busy === "all" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete all duplicates
                </button>
              )}
            </div>
            {groups.length === 0 && <p className="text-muted text-sm">No duplicate quizzes. 🎉</p>}
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.key} className="card-frame p-4">
                  <p className="text-fg font-medium text-sm mb-2">{g.keeper.title}</p>
                  <p className="text-[11px] font-mono text-correct mb-1">
                    KEEP · {g.keeper.questions?.length || 0} Q · {g.keeper.playCount || 0} plays · {fmt(g.keeper.createdAt)}
                  </p>
                  {g.duplicates.map((d) => (
                    <p key={d.id} className="text-[11px] font-mono text-muted">
                      remove · {d.questions?.length || 0} Q · {d.playCount || 0} plays · {fmt(d.createdAt)}
                    </p>
                  ))}
                  <button
                    onClick={() => removeGroup(g.duplicates.map((d) => d.id), g.key)}
                    disabled={!!busy}
                    className="mt-3 flex items-center gap-1.5 px-3 py-2 border border-border hover:border-fg text-[11px] font-mono uppercase disabled:opacity-50"
                  >
                    {busy === g.key ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete {g.duplicates.length} duplicate{g.duplicates.length > 1 ? "s" : ""}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
              Repeated questions inside a quiz ({withInternalDupes.length})
            </h2>
            {withInternalDupes.length === 0 && <p className="text-muted text-sm">None found.</p>}
            <div className="space-y-2">
              {withInternalDupes.map((q) => (
                <div key={q.id} className="card-frame p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-fg text-sm truncate">{q.title}</p>
                    <p className="text-[11px] font-mono text-muted">
                      {dedupeQuestions(q.questions).removed} repeated of {q.questions.length}
                    </p>
                  </div>
                  <button
                    onClick={() => cleanQuestions(q)}
                    disabled={!!busy}
                    className="flex items-center gap-1.5 px-3 py-2 border border-border hover:border-fg text-[11px] font-mono uppercase disabled:opacity-50 flex-shrink-0"
                  >
                    {busy === q.id ? <Loader2 size={12} className="animate-spin" /> : <Eraser size={12} />} Clean
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
              <GitCompare size={13} /> Similar quizzes — review manually ({near.length})
            </h2>
            {near.length === 0 && <p className="text-muted text-sm">No heavily overlapping quizzes.</p>}
            <div className="space-y-2">
              {near.slice(0, 30).map((n) => (
                <div key={n.a.id + n.b.id} className="card-frame p-3 text-sm">
                  <p className="text-fg truncate">{n.a.title}</p>
                  <p className="text-fg truncate">{n.b.title}</p>
                  <p className="text-[11px] font-mono text-muted mt-1">
                    {n.shared} shared questions · {Math.round(n.similarity * 100)}% overlap
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
