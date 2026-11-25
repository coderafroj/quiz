"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, ShieldAlert, Laptop, Globe, Code2, Cpu, Trophy, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuizBuilder from "@/components/dashboard/QuizBuilder";
import type { Quiz } from "@/lib/types";

const SAMPLE_QUIZ: Quiz = {
  id: "sample-preview",
  ownerId: "user-1",
  ownerName: "Codarafroj",
  title: "Python Data Structures & OOP",
  description: "Lists, tuples, dictionaries, decorators, classes and generator functions.",
  language: "English",
  category: "Python",
  difficulty: "Intermediate",
  visibility: "public",
  status: "approved",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  playCount: 142,
  questions: [
    {
      id: "q1",
      text: "Which of the following creates a generator in Python, not a list?",
      options: [
        "[x for x in range(10)]",
        "(x for x in range(10))",
        "{x for x in range(10)}",
        "list(range(10))",
      ],
      correctIndex: 1,
      timeLimit: 20,
      points: 1000,
      difficulty: "medium",
    },
    {
      id: "q2",
      text: "What does the @property decorator do on a Python class method?",
      options: [
        "Makes the method private",
        "Allows accessing a method like an attribute",
        "Caches the method return value",
        "Makes the class static",
      ],
      correctIndex: 1,
      timeLimit: 30,
      points: 1000,
      difficulty: "hard",
    },
  ],
};

function LiveGamePreview() {
  const SHAPES = ["▲", "◆", "●", "■"];
  const options = ["TCP (Transmission Control)", "IP (Internet Protocol)", "HTTP (HyperText Transfer)", "Ethernet (IEEE 802.3)"];

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between p-6 md:p-10 font-body">
      {/* Top HUD */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">GAME PIN: <span className="text-fg font-bold">482 910</span></span>
          <span className="text-muted font-mono">·</span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">M1-R5.1 Networking</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase text-fg font-bold flex items-center gap-1.5">
            <Trophy size={14} className="text-accent-correct" /> 2,450 pts (Rank #1)
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-raised border border-border-strong font-mono text-xs text-fg">
            <Clock size={13} className="text-accent-correct animate-pulse" /> 14s
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="max-w-2xl mx-auto w-full text-center my-auto py-8">
        <span className="font-mono text-xs uppercase tracking-widest text-muted block mb-3">
          Question 4 of 10
        </span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-fg mb-10 leading-tight">
          Which protocol operates at the Transport Layer of the OSI model?
        </h1>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {options.map((opt, idx) => (
            <button
              key={idx}
              className={`card-frame p-6 flex flex-col items-center justify-center gap-3 text-center transition-transform hover:scale-[1.02] ${
                idx === 0 ? "border-fg bg-surface-raised ring-1 ring-fg" : ""
              }`}
            >
              <span className={`text-3xl ${idx === 0 ? "text-accent-correct" : "text-fg-dim"}`}>
                {SHAPES[idx]}
              </span>
              <span className="text-sm font-medium text-fg">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-muted">
        <span>Playing as <strong className="text-fg">Afroj (Host Game)</strong></span>
        <span>18 players answered</span>
      </div>
    </div>
  );
}

function ProgressPreview() {
  const readiness = 78;
  const papers = [
    {
      code: "M1-R5.1",
      short: "IT Tools & Basics",
      title: "Information Technology Tools and Network Basics",
      icon: Laptop,
      unitsDone: 6,
      unitsTotal: 6,
      readiness: 88,
      mockScore: "28/30",
    },
    {
      code: "M2-R5.1",
      short: "Web Designing",
      title: "Web Designing and Publishing (HTML, CSS, JS)",
      icon: Globe,
      unitsDone: 5,
      unitsTotal: 5,
      readiness: 82,
      mockScore: "26/30",
    },
    {
      code: "M3-R5.1",
      short: "Python",
      title: "Programming and Problem Solving through Python",
      icon: Code2,
      unitsDone: 5,
      unitsTotal: 6,
      readiness: 76,
      mockScore: "24/30",
    },
    {
      code: "M4-R5.1",
      short: "IoT",
      title: "Internet of Things and its Applications",
      icon: Cpu,
      unitsDone: 4,
      unitsTotal: 6,
      readiness: 66,
      mockScore: "Pending",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 max-w-5xl mx-auto font-body">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted block mb-2">
            Learner Dashboard
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg mb-3">
            Your O Level Progress & Readiness
          </h1>
          <p className="text-fg-dim text-sm max-w-xl">
            Live accuracy tracking across all 4 NIELIT papers. Syllabi completion, unit mock results, and readiness scores.
          </p>
        </div>

        {/* Readiness Meter Card */}
        <div className="card-frame p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--mono-border)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--accent-correct)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - readiness / 100)}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-2xl text-fg">
              {readiness}%
            </span>
          </div>
          <div className="min-w-0 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="font-display font-bold text-xl text-fg">Overall Exam Readiness</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-accent-correct/10 text-accent-correct border border-accent-correct/30 font-semibold">
                Exam Ready
              </span>
            </div>
            <p className="text-fg-dim text-sm leading-relaxed mb-3">
              Average score across 20 completed unit quizzes. 3 of 4 papers have reached green passing grade (70%+).
            </p>
            <div className="flex flex-wrap gap-4 font-mono text-xs text-muted">
              <span>Completed Units: <strong className="text-fg">20 / 23</strong></span>
              <span>Total Attempts: <strong className="text-fg">48</strong></span>
              <span>Best Streak: <strong className="text-fg">7 days</strong></span>
            </div>
          </div>
        </div>

        {/* Paper Cards Breakdown */}
        <div className="grid md:grid-cols-2 gap-4">
          {papers.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.code} className="card-frame p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Icon size={14} /> {p.code}
                    </span>
                    <span className="font-mono text-xs font-bold text-accent-correct">
                      {p.readiness}% readiness
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-base text-fg mb-1">{p.title}</h4>
                  <p className="font-mono text-xs text-fg-dim">{p.short}</p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-xs text-muted">
                  <span className="flex items-center gap-1 text-fg">
                    <CheckCircle2 size={13} className="text-accent-correct" />
                    {p.unitsDone}/{p.unitsTotal} units done
                  </span>
                  <span>Mock Score: <strong className="text-fg">{p.mockScore}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

function PreviewRouter() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "builder";

  if (view === "live") return <LiveGamePreview />;
  if (view === "progress") return <ProgressPreview />;

  // Default: builder
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg text-center mb-10">
          Build your quiz.
        </h1>
        <QuizBuilder existingQuiz={SAMPLE_QUIZ} />
      </main>
    </>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg text-muted flex items-center justify-center font-mono">Loading preview…</div>}>
      <PreviewRouter />
    </Suspense>
  );
}
