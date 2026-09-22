"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, RotateCcw, Clock, Share2, Brain, Loader2 } from "lucide-react";
import { getQuiz, incrementPlayCount } from "@/lib/quizzes";
import { recordAttempt } from "@/lib/attempts";
import { recordAnswerOutcome, getDueQuestionIds } from "@/lib/reviewQueue";
import { generateScoreCard, shareScoreCard } from "@/lib/scoreCard";
import { pickTodaysQuiz, recordDailyCompletion } from "@/lib/dailyQuiz";
import { getApprovedQuizzesOnce } from "@/lib/quizzes";
import type { Quiz, QuizQuestionItem, QuestionDifficulty } from "@/lib/types";

type Stage = "loading" | "not-found" | "name" | "playing" | "finished";
type Tier = QuestionDifficulty;

const TIER_UP: Record<Tier, Tier> = { easy: "medium", medium: "hard", hard: "hard" };
const TIER_DOWN: Record<Tier, Tier> = { hard: "medium", medium: "easy", easy: "easy" };
const TIER_SEARCH_ORDER: Record<Tier, Tier[]> = {
  easy: ["easy", "medium", "hard"],
  medium: ["medium", "easy", "hard"],
  hard: ["hard", "medium", "easy"],
};

function questionTier(q: QuizQuestionItem): Tier {
  return q.difficulty || "medium";
}

export default function SoloPlayClient({
  quizId,
  initialQuiz,
}: {
  quizId: string;
  initialQuiz: Quiz | null;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz);
  const [stage, setStage] = useState<Stage>(initialQuiz ? "name" : "loading");
  const [playerName, setPlayerName] = useState("");
  const [practiceMode, setPracticeMode] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  // Adaptive engine state — the play order is built one question at a time
  // based on how the player is doing, not fixed up front.
  const [askedQuestions, setAskedQuestions] = useState<QuizQuestionItem[]>([]);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const tierRef = useRef<Tier>("medium");
  const streakRef = useRef(0); // positive = correct streak, negative = wrong streak
  const [totalToAsk, setTotalToAsk] = useState(0);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [wasAdaptiveUsed, setWasAdaptiveUsed] = useState(false);

  const [dailyStreak, setDailyStreak] = useState<number | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [generatingCard, setGeneratingCard] = useState(false);

  useEffect(() => {
    if (initialQuiz) return;
    getQuiz(quizId).then((q) => {
      setQuiz(q);
      setStage(q ? "name" : "not-found");
    });
  }, [quizId, initialQuiz]);

  useEffect(() => {
    if (!quiz) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived once from the freshly-loaded quiz, not a render loop
    setDueCount(getDueQuestionIds(quiz.id).length);
  }, [quiz]);

  function pickFromPools(pools: Record<Tier, QuizQuestionItem[]>, tier: Tier): QuizQuestionItem | null {
    for (const t of TIER_SEARCH_ORDER[tier]) {
      const candidates = pools[t].filter((q) => !usedIdsRef.current.has(q.id));
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
    return null;
  }

  function buildPools(questions: QuizQuestionItem[]): Record<Tier, QuizQuestionItem[]> {
    const pools: Record<Tier, QuizQuestionItem[]> = { easy: [], medium: [], hard: [] };
    for (const q of questions) pools[questionTier(q)].push(q);
    return pools;
  }

  const question = askedQuestions[current];

  function startPlay(usePractice: boolean) {
    if (!quiz) return;
    setPracticeMode(usePractice);

    let pool = quiz.questions;
    if (usePractice) {
      const due = new Set(getDueQuestionIds(quiz.id));
      pool = quiz.questions.filter((q) => due.has(q.id));
      if (pool.length === 0) pool = quiz.questions; // safety fallback
    }

    usedIdsRef.current = new Set();
    tierRef.current = "medium";
    streakRef.current = 0;
    setTotalToAsk(pool.length);

    if (usePractice) {
      // Practice mode: just work through the due set directly, no adaptive reshuffling needed.
      setAskedQuestions(pool);
      pool.forEach((q) => usedIdsRef.current.add(q.id));
      setWasAdaptiveUsed(false);
    } else {
      const pools = buildPools(pool);
      const first = pickFromPools(pools, "medium") || pool[0];
      usedIdsRef.current.add(first.id);
      setAskedQuestions([first]);
      // Adaptive only matters if there's more than one difficulty tier present.
      setWasAdaptiveUsed(new Set(pool.map(questionTier)).size > 1);
    }

    setCurrent(0);
    setSelected(null);
    setScore(0);
    setStage("playing");
  }

  const handleNext = useCallback(() => {
    if (!quiz) return;
    const isLast = current + 1 >= totalToAsk;

    if (isLast) {
      setStage("finished");
      incrementPlayCount(quiz.id).catch(() => {});
      recordAttempt(quiz.id, playerName, score, totalToAsk).catch(() => {});

      getApprovedQuizzesOnce().then((quizzes) => {
        const todays = pickTodaysQuiz(quizzes);
        if (todays?.id === quiz.id) {
          setDailyStreak(recordDailyCompletion());
        }
      });
      return;
    }

    if (!practiceMode) {
      const pools = buildPools(quiz.questions);
      const next = pickFromPools(pools, tierRef.current);
      if (next) {
        usedIdsRef.current.add(next.id);
        setAskedQuestions((prev) => [...prev, next]);
      }
    }
    setCurrent((c) => c + 1);
    setSelected(null);
  }, [quiz, current, playerName, score, practiceMode, totalToAsk]);

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
    if (selected !== null || !question || !quiz) return;
    setSelected(idx);
    const isCorrect = idx === question.correctIndex;
    if (isCorrect) setScore((s) => s + 1);

    recordAnswerOutcome(quiz.id, question.id, isCorrect);

    // Adjust the adaptive tier based on a streak of 2 in the same direction.
    streakRef.current = isCorrect ? Math.max(1, streakRef.current + 1) : Math.min(-1, streakRef.current - 1);
    if (streakRef.current >= 2) {
      tierRef.current = TIER_UP[tierRef.current];
      streakRef.current = 0;
    } else if (streakRef.current <= -2) {
      tierRef.current = TIER_DOWN[tierRef.current];
      streakRef.current = 0;
    }

    setTimeout(handleNext, 900);
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    startPlay(false);
  }

  function handleRestart() {
    setCardDataUrl(null);
    setDailyStreak(null);
    startPlay(false);
  }

  async function handleShare() {
    if (!quiz) return;
    setGeneratingCard(true);
    try {
      const url = await generateScoreCard({
        quizTitle: quiz.title,
        playerName: playerName || "Player",
        score,
        total: totalToAsk,
        quizId: quiz.id,
      });
      setCardDataUrl(url);
      await shareScoreCard(url, quiz.title);
    } catch {
      // Silently ignore — sharing is a nice-to-have, never block the results screen on it.
    } finally {
      setGeneratingCard(false);
    }
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
            {quiz?.category} · {quiz?.difficulty} · {quiz?.questions.length} Questions
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
          {dueCount > 0 && (
            <button
              type="button"
              onClick={() => playerName.trim() && startPlay(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-border hover:border-fg transition-colors text-xs font-mono uppercase"
            >
              <Brain size={13} /> Practice {dueCount} Weak Spot{dueCount > 1 ? "s" : ""}
            </button>
          )}
        </form>
      </div>
    );
  }

  if (stage === "finished" && quiz) {
    const pct = totalToAsk > 0 ? Math.round((score / totalToAsk) * 100) : 0;
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
            {score} / {totalToAsk}
          </h2>
          <p className="text-fg-dim mb-1">Nice work, {playerName}.</p>
          {wasAdaptiveUsed && (
            <p className="font-mono text-[11px] text-muted mb-4">
              Adaptive mode adjusted question difficulty as you played.
            </p>
          )}
          {dailyStreak !== null && (
            <p className="font-mono text-xs text-fg mb-4">
              🔥 Daily streak: {dailyStreak} day{dailyStreak > 1 ? "s" : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-fg transition-colors font-semibold text-sm uppercase tracking-wide"
            >
              <RotateCcw size={14} /> Play Again
            </button>
            <button
              onClick={handleShare}
              disabled={generatingCard}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-fg text-bg hover:bg-fg-dim transition-colors font-semibold text-sm uppercase tracking-wide disabled:opacity-60"
            >
              {generatingCard ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              Share Score
            </button>
          </div>
          {cardDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardDataUrl} alt="Your score card" className="mt-6 w-full border border-border" />
          )}
        </div>
      </div>
    );
  }

  if (!question) return null;

  const progressPct = ((current + (selected !== null ? 1 : 0)) / totalToAsk) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-2xl">
        <div className="h-1 bg-border mb-8 relative overflow-hidden">
          <motion.div className="h-full bg-fg" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
        </div>

        <div className="flex items-center justify-between mb-6 font-mono text-xs text-muted">
          <span>
            Question {current + 1} / {totalToAsk}
            {practiceMode && " · Practice"}
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
