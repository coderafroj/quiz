"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, Loader2, ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createQuizWithId, subscribeToAllQuizzes } from "@/lib/quizzes";
import { GENERAL_SEEDS } from "@/lib/seedQuizzes";
import { buildOLevelSeeds, type SeedQuiz } from "@/lib/olevel";
import { norm } from "@/lib/dedupe";
import type { Quiz } from "@/lib/types";
import Navbar from "@/components/Navbar";

type Seed = SeedQuiz;
type Status = "missing" | "imported" | "legacy";

export default function ImportQuizzesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [existing, setExisting] = useState<Quiz[]>([]);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const seeds: Seed[] = useMemo(() => [...buildOLevelSeeds(), ...(GENERAL_SEEDS as Seed[])], []);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    return subscribeToAllQuizzes(setExisting);
  }, [profile?.role]);

  const statusOf = useMemo(() => {
    const ids = new Set(existing.map((q) => q.id));
    const titles = new Set(existing.map((q) => `${norm(q.title)}::${norm(q.category)}`));
    return (s: Seed): Status => {
      if (ids.has(s.seedId)) return "imported";
      if (titles.has(`${norm(s.title)}::${norm(s.category)}`)) return "legacy"; // an older copy already exists
      return "missing";
    };
  }, [existing]);

  async function importOne(s: Seed) {
    if (!user || !profile) return;
    setPending((p) => ({ ...p, [s.seedId]: true }));
    setFailed((f) => ({ ...f, [s.seedId]: false }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { seedId, group, ...quiz } = s;
      await createQuizWithId(seedId, { ...quiz, ownerId: user.uid, ownerName: profile.displayName }, true);
    } catch {
      setFailed((f) => ({ ...f, [s.seedId]: true }));
    } finally {
      setPending((p) => ({ ...p, [s.seedId]: false }));
    }
  }

  const missing = seeds.filter((s) => statusOf(s) === "missing");

  async function importAll() {
    setBusy(true);
    for (const s of missing) await importOne(s);
    setBusy(false);
  }

  if (loading || !user || profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">Loading…</div>
    );
  }

  const groups = seeds.reduce<Record<string, Seed[]>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-24 px-4 sm:px-6 md:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted hover:text-fg text-sm font-mono mb-6">
            <ArrowLeft size={14} /> Back to Admin
          </Link>

          <h1 className="font-display font-extrabold text-3xl text-fg mb-3">Import quizzes.</h1>
          <p className="text-fg-dim mb-6 text-sm leading-relaxed">
            NIELIT O Level practice sets (all 4 papers) and the starter quizzes. Each one has a fixed ID, so
            importing again <strong>never creates a duplicate</strong> — anything already in your database is
            detected and skipped.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={importAll}
              disabled={busy || missing.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {missing.length === 0 ? "Everything is imported" : `Import ${missing.length} missing`}
            </button>
            <Link
              href="/admin/duplicates"
              className="flex items-center justify-center gap-2 px-5 py-4 border border-border hover:border-fg text-sm font-mono uppercase transition-colors"
            >
              <Copy size={14} /> Clean duplicates
            </Link>
          </div>

          <div className="space-y-8">
            {Object.entries(groups).map(([group, list]) => (
              <section key={group}>
                <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">{group}</h2>
                <div className="space-y-2">
                  {list.map((s) => {
                    const status = statusOf(s);
                    const isPending = pending[s.seedId];
                    return (
                      <div key={s.seedId} className="card-frame p-3 sm:p-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-fg text-sm font-medium truncate">{s.title}</p>
                          <p className="text-muted text-[11px] font-mono truncate">
                            {s.questions.length} questions · {s.difficulty}
                            {status === "legacy" && " · older copy already exists"}
                          </p>
                        </div>
                        <button
                          onClick={() => importOne(s)}
                          disabled={isPending || status !== "missing"}
                          className="flex items-center gap-1.5 px-3 py-2 border border-border text-[11px] font-mono uppercase hover:border-fg transition-colors disabled:opacity-60 flex-shrink-0"
                        >
                          {isPending && <Loader2 size={12} className="animate-spin" />}
                          {status !== "missing" && !isPending && <Check size={12} />}
                          {isPending
                            ? "Importing…"
                            : status === "imported"
                              ? "Imported"
                              : status === "legacy"
                                ? "Exists"
                                : failed[s.seedId]
                                  ? "Retry"
                                  : "Import"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
