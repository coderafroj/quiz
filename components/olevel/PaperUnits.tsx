"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Play, Trophy } from "lucide-react";
import { useProgress } from "@/components/useProgress";
import { pct } from "@/lib/progress";

export interface UnitCardData {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  questions: number;
}

export default function PaperUnits({
  units,
  mockId,
  mockQuestions,
}: {
  units: UnitCardData[];
  mockId: string;
  mockQuestions: number;
}) {
  const progress = useProgress();
  const nextIndex = units.findIndex((u) => !(progress[u.id]?.attempts > 0));
  const allDone = nextIndex === -1;

  return (
    <div className="space-y-3">
      {units.map((u, i) => {
        const p = progress[u.id];
        const tried = (p?.attempts ?? 0) > 0;
        const isNext = i === nextIndex;
        const score = p ? pct(p) : 0;
        return (
          <div key={u.id} className={`card-frame p-4 sm:p-5 ${isNext ? "!border-border-strong" : ""}`}>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="mt-0.5 flex-shrink-0">
                {tried ? (
                  <CheckCircle2 size={20} className={score >= 70 ? "text-correct" : "text-fg-dim"} />
                ) : (
                  <Circle size={20} className="text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-fg text-base sm:text-lg leading-snug">
                    Unit {i + 1}: {u.title}
                  </h3>
                  {isNext && !allDone && (
                    <span className="font-mono text-[10px] uppercase tracking-widest bg-fg text-bg px-1.5 py-0.5">Next up</span>
                  )}
                </div>
                <p className="text-fg-dim text-sm mb-3">{u.summary}</p>
                <ul className="flex flex-wrap gap-1.5 mb-4">
                  {u.topics.map((t) => (
                    <li key={t} className="font-mono text-[11px] text-muted border border-border px-2 py-0.5">{t}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/play/${u.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors"
                  >
                    <Play size={13} /> {tried ? "Practice again" : "Start quiz"}
                  </Link>
                  <span className="font-mono text-[11px] text-muted">
                    {u.questions} questions
                    {tried && ` · best ${p.best}/${p.total} (${score}%) · ${p.attempts} attempt${p.attempts > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className={`card-frame p-5 ${allDone ? "!border-border-strong" : ""}`}>
        <div className="flex flex-wrap items-center gap-4">
          <Trophy size={22} strokeWidth={1.5} className="text-fg-dim" />
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-display font-bold text-fg text-lg">Full mock test</h3>
            <p className="text-fg-dim text-sm">
              {mockQuestions} mixed questions from every unit. Take it once you have tried each unit.
              {progress[mockId] && ` Your best: ${pct(progress[mockId])}%.`}
            </p>
          </div>
          <Link
            href={`/play/${mockId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border hover:border-fg transition-colors font-semibold text-xs uppercase tracking-wide"
          >
            Take mock test
          </Link>
        </div>
      </div>
    </div>
  );
}
