"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { fetchAllProgress, pct, type QuizProgress } from "@/lib/progress";
import { O_LEVEL_PAPERS, mockQuizId, unitQuizId } from "@/lib/olevel";

const ago = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function InsightsPanel() {
  const [rows, setRows] = useState<QuizProgress[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchAllProgress());
    } catch {
      setError("Couldn't load learner progress. Deploy the latest firestore.rules, then refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  const stats = useMemo(() => {
    const list = rows || [];
    const byQuiz = new Map<string, QuizProgress[]>();
    list.forEach((r) => byQuiz.set(r.quizId, [...(byQuiz.get(r.quizId) || []), r]));
    const learners = new Set(list.map((r) => r.uid).filter(Boolean)).size;
    const attempts = list.reduce((n, r) => n + (r.attempts || 0), 0);
    const avg = list.length ? Math.round(list.reduce((n, r) => n + pct(r), 0) / list.length) : 0;
    const recent = [...list].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)).slice(0, 10);
    return { byQuiz, learners, attempts, avg, recent };
  }, [rows]);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Learner insights</h2>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-fg text-[11px] font-mono uppercase disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Refresh
        </button>
      </div>

      {error && <p className="text-xs font-mono text-wrong mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ["Active learners", stats.learners],
          ["Quiz attempts", stats.attempts],
          ["Avg best score", `${stats.avg}%`],
        ].map(([label, value]) => (
          <div key={label as string} className="card-frame p-4">
            <div className="font-display font-bold text-xl sm:text-2xl text-fg">{value}</div>
            <div className="text-[10px] sm:text-xs text-muted font-mono uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {O_LEVEL_PAPERS.map((paper) => {
            const ids = [
              ...paper.units.map((u) => ({ id: unitQuizId(paper.slug, u.slug), label: u.title })),
              { id: mockQuizId(paper.slug), label: "Full mock test" },
            ];
            const maxLearners = Math.max(1, ...ids.map(({ id }) => stats.byQuiz.get(id)?.length || 0));
            return (
              <div key={paper.slug} className="card-frame p-4">
                <p className="text-fg text-sm font-semibold mb-3">
                  {paper.code} <span className="text-muted font-normal">· {paper.short}</span>
                </p>
                <div className="space-y-2">
                  {ids.map(({ id, label }) => {
                    const list = stats.byQuiz.get(id) || [];
                    const avg = list.length ? Math.round(list.reduce((n, r) => n + pct(r), 0) / list.length) : 0;
                    return (
                      <div key={id}>
                        <div className="flex justify-between gap-3 text-[11px] font-mono text-fg-dim mb-0.5">
                          <span className="truncate">{label}</span>
                          <span className="flex-shrink-0 text-muted">
                            {list.length} learner{list.length === 1 ? "" : "s"}
                            {list.length > 0 && ` · avg ${avg}%`}
                          </span>
                        </div>
                        <div className="h-1 bg-border">
                          <div className="h-full bg-fg-dim" style={{ width: `${(list.length / maxLearners) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Recent activity</p>
          <div className="card-frame divide-y divide-border">
            {stats.recent.length === 0 && <p className="text-muted text-sm font-mono p-4">No activity yet.</p>}
            {stats.recent.map((r) => (
              <div key={`${r.uid}-${r.quizId}`} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-fg text-sm truncate">{r.userName || "Learner"}</p>
                  <p className="text-muted text-[11px] font-mono truncate">{r.title || r.quizId}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xs text-fg">{r.lastScore}/{r.total}</p>
                  <p className="font-mono text-[10px] text-muted">{ago(r.lastAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
