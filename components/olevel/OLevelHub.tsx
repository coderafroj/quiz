"use client";

import Link from "next/link";
import { ArrowRight, Globe, Code2, Cpu, Laptop } from "lucide-react";
import { useProgress } from "@/components/useProgress";
import { pct } from "@/lib/progress";
import { mockQuizId, unitQuizId, type PaperDef } from "@/lib/olevel";

const ICONS = { m1: Laptop, m2: Globe, m3: Code2, m4: Cpu } as const;

export interface PaperCardData {
  slug: PaperDef["slug"];
  code: string;
  title: string;
  short: string;
  summary: string;
  semester: 1 | 2;
  unitSlugs: string[];
  questions: number;
}

export default function OLevelHub({ papers }: { papers: PaperCardData[] }) {
  const progress = useProgress();

  const rows = papers.map((p) => {
    const ids = p.unitSlugs.map((u) => unitQuizId(p.slug, u));
    const done = ids.filter((id) => (progress[id]?.attempts ?? 0) > 0).length;
    const readiness = Math.round(ids.reduce((n, id) => n + (progress[id] ? pct(progress[id]) : 0), 0) / ids.length);
    const mock = progress[mockQuizId(p.slug)];
    return { p, done, total: ids.length, readiness, mock };
  });

  const overall = Math.round(rows.reduce((n, r) => n + r.readiness, 0) / rows.length);
  const started = rows.some((r) => r.done > 0);

  return (
    <div>
      <div className="card-frame p-5 sm:p-6 mb-5 flex items-center gap-5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--mono-border)" strokeWidth="9" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="var(--accent-correct)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - overall / 100)}
              style={{ transition: "stroke-dashoffset .8s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-fg">{overall}%</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-fg text-lg leading-tight">Your O Level readiness</p>
          <p className="text-fg-dim text-sm">
            {started
              ? "Average of your best scores across all units. Keep going until every paper is green."
              : "Take your first unit quiz and your progress will be tracked here — on every device once you sign in."}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {rows.map(({ p, done, total, readiness, mock }) => {
          const Icon = ICONS[p.slug];
          return (
            <Link
              key={p.slug}
              href={`/olevel/${p.slug}`}
              className="card-frame p-5 sm:p-6 group flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted border border-border px-2 py-1">
                  {p.code} · SEM {p.semester}
                </span>
                <Icon size={22} strokeWidth={1.5} className="text-fg-dim group-hover:text-fg transition-colors" />
              </div>
              <h3 className="font-display font-bold text-xl text-fg mb-2 leading-snug">{p.title}</h3>
              <p className="text-fg-dim text-sm leading-relaxed mb-5 flex-1">{p.summary}</p>

              <div className="h-1.5 bg-border mb-2 overflow-hidden">
                <div className="h-full bg-correct" style={{ width: `${(done / total) * 100}%`, transition: "width .6s ease" }} />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-muted mb-4">
                <span>{done}/{total} units tried</span>
                <span>
                  {total} units · {p.questions} questions
                  {mock ? ` · mock ${pct(mock)}%` : ""}
                </span>
              </div>
              <span className="inline-flex items-center gap-2 text-fg text-sm font-semibold uppercase tracking-wide">
                {done === 0 ? "Start paper" : readiness >= 80 ? "Review paper" : "Continue"}
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
