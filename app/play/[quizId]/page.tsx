"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, RotateCcw, Clock } from "lucide-react";
import { getQuiz } from "@/lib/quizzes";
import { incrementPlayCount } from "@/lib/quizzes";
import { recordAttempt } from "@/lib/attempts";
import type { Quiz } from "@/lib/types";

type Stage = "loading" | "not-found" | "name" | "playing" | "finished";

export default function SoloPlayPage() {
  const params = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [playerName, setPlayerName] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    getQuiz(params.quizId).then((q) => {
      setQuiz(q);
      setStage(q ? "name" : "not-found");
    });
  }, [params.quizId]);

  const question = quiz?.questions[current];

  const handleNext = useCallback(() => {
    if (!quiz) return;
    if (current + 1 >= quiz.questions.length) {
      setStage("finished");
      incrementPlayCount(quiz.id).catch(() => {});
      recordAttempt(quiz.id, playerName, score, quiz.questions.length).catch(() => {});
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [quiz, current, playerName, score]);

  useEffect(() => {
    if (stage !== "playing" || !question) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializes the countdown when a new question mounts
    setTimeLeft(question.timeLimit);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, question, current]);

  useEffect(() => {
    if (stage === "playing" && timeLeft === 0 && selected === null) {
      const t = setTimeout(handleNext, 900);
      return () => clearTimeout(t);
    }
  }, [timeLeft, stage, selected, handleNext]);

  function handleSelect(idx: number) {
    if (selected !== null || !question) return;
    setSelected(idx);
    if (idx === question.correctIndex) setScore((s) => s + 1);
    setTimeout(handleNext, 900);
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setStage("playing");
  }

  function handleRestart() {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setStage("playing");
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading quiz…
      </div>
    );
  }

  if (stage === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        This quiz doesn&apos;t exist or was deleted.
      </div>
    );
  }

  if (stage === "name") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <form onSubmit={handleStart} className="card-frame p-8 w-full max-w-sm text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-muted block mb-2">
            {quiz?.language} · {quiz?.questions.length} Questions
          </span>
          <h1 className="font-display font-extrabold text-2xl text-fg mb-2">{quiz?.title}</h1>
          {quiz?.description && <p className="text-fg-dim text-sm mb-6">{quiz.description}</p>}
          <input
            required
            autoFocus
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-transparent border border-border px-3 py-3 text-sm text-center mb-4 focus:border-fg outline-none"
          />
          <button
            type="submit"
            className="w-full py-3 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors"
          >
            Start Quiz
          </button>
        </form>
      </div>
    );
  }

  if (stage === "finished" && quiz) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="card-frame p-10 w-full max-w-md text-center">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--mono-border)" strokeWidth="6" />
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="var(--mono-fg)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy size={30} className="text-fg" />
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl text-fg mb-1">
            {score} / {quiz.questions.length}
          </h2>
          <p className="text-fg-dim mb-8">Nice work, {playerName}.</p>
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-fg transition-colors font-semibold text-sm uppercase tracking-wide"
          >
            <RotateCcw size={14} /> Play Again
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const progressPct = ((current + (selected !== null ? 1 : 0)) / quiz!.questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-2xl">
        <div className="h-1 bg-border mb-8 relative overflow-hidden">
          <motion.div className="h-full bg-fg" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
        </div>

        <div className="flex items-center justify-between mb-6 font-mono text-xs text-muted">
          <span>
            Question {current + 1} / {quiz!.questions.length}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {timeLeft}s
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-display font-bold text-2xl md:text-3xl text-fg mb-8">
              {question.text}
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {question.options.map((opt, idx) => {
                const isCorrect = idx === question.correctIndex;
                const isSelected = idx === selected;
                let stateClass = "border-border hover:border-fg";
                if (selected !== null || timeLeft === 0) {
                  if (isCorrect) stateClass = "border-fg bg-fg text-bg";
                  else if (isSelected) stateClass = "border-border opacity-40";
                  else stateClass = "border-border opacity-40";
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={selected !== null || timeLeft === 0}
                    className={`text-left px-5 py-4 border font-medium flex items-center justify-between transition-colors ${stateClass}`}
                  >
                    {opt}
                    {(selected !== null || timeLeft === 0) && isCorrect && <Check size={16} />}
                    {selected !== null && isSelected && !isCorrect && <X size={16} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
