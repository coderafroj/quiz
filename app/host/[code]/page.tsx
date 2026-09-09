"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Users, Play, ArrowRight, Eye, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getQuiz } from "@/lib/quizzes";
import {
  subscribeToSession,
  subscribeToPlayers,
  subscribeToAnswers,
  startSession,
  revealAnswer,
  nextQuestion,
} from "@/lib/sessions";
import type { Quiz, LiveSession, LivePlayer, LiveAnswer } from "@/lib/types";

export default function HostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [answers, setAnswers] = useState<LiveAnswer[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const unsubscribe = subscribeToSession(params.code, setSession);
    return unsubscribe;
  }, [params.code]);

  useEffect(() => {
    if (!session) return;
    getQuiz(session.quizId).then(setQuiz);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on quizId only, not the whole session object
  }, [session?.quizId]);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers(params.code, setPlayers);
    return unsubscribe;
  }, [params.code]);

  useEffect(() => {
    if (!session || session.currentQuestionIndex < 0) return;
    const unsubscribe = subscribeToAnswers(params.code, session.currentQuestionIndex, setAnswers);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on the question index only
  }, [params.code, session?.currentQuestionIndex]);

  if (loading || !user || !session || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading session…
      </div>
    );
  }

  const question = quiz.questions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex === quiz.questions.length - 1;

  function handleCopyCode() {
    navigator.clipboard.writeText(params.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // ---- LOBBY ----
  if (session.status === "lobby") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
        <span className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
          {quiz.title}
        </span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-3 mb-2 group"
        >
          <span className="font-display font-extrabold text-6xl md:text-8xl tracking-widest text-fg">
            {params.code}
          </span>
          {copied ? <Check size={24} /> : <Copy size={24} className="text-muted group-hover:text-fg" />}
        </button>
        <p className="font-mono text-xs text-muted mb-12">
          Players go to <span className="text-fg">play.coderafroj.me/join</span> and enter this code
        </p>

        <div className="flex items-center gap-2 mb-6 text-fg">
          <Users size={18} />
          <span className="font-mono text-sm">{players.length} joined</span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mb-12">
          {players.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-2 border border-border font-medium text-sm"
            >
              {p.name}
            </motion.span>
          ))}
        </div>

        <button
          onClick={() => startSession(params.code)}
          disabled={players.length === 0}
          className="flex items-center gap-2 px-8 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-40"
        >
          <Play size={16} /> Start Game
        </button>
      </div>
    );
  }

  // ---- QUESTION (live, players answering) ----
  if (session.status === "question") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          Question {session.currentQuestionIndex + 1} / {quiz.questions.length}
        </span>
        <h1 className="font-display font-extrabold text-3xl md:text-5xl text-fg max-w-3xl mb-12">
          {question.text}
        </h1>

        <div className="grid sm:grid-cols-2 gap-3 max-w-2xl w-full mb-12">
          {question.options.map((opt, idx) => (
            <div key={idx} className="card-frame px-5 py-4 text-fg-dim font-medium">
              {opt}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-8 text-fg">
          <Users size={16} />
          <span className="font-mono text-sm">
            {answers.length} / {players.length} answered
          </span>
        </div>

        <button
          onClick={() => revealAnswer(params.code)}
          className="flex items-center gap-2 px-8 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors"
        >
          <Eye size={16} /> Reveal Answer
        </button>
      </div>
    );
  }

  // ---- REVEAL (show correct answer, per-option breakdown, leaderboard) ----
  if (session.status === "reveal") {
    const maxCount = Math.max(1, ...question.options.map((_, idx) => answers.filter((a) => a.selectedIndex === idx).length));

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-fg mb-8 text-center max-w-2xl">
          {question.text}
        </h1>

        <div className="w-full max-w-2xl space-y-3 mb-10">
          {question.options.map((opt, idx) => {
            const count = answers.filter((a) => a.selectedIndex === idx).length;
            const isCorrect = idx === question.correctIndex;
            const widthPct = (count / maxCount) * 100;
            return (
              <div key={idx} className="relative border border-border overflow-hidden">
                <motion.div
                  className={isCorrect ? "absolute inset-y-0 left-0 bg-fg" : "absolute inset-y-0 left-0 bg-surface-raised"}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <div
                  className={`relative flex items-center justify-between px-4 py-3 font-medium ${isCorrect ? "text-bg" : "text-fg-dim"}`}
                >
                  <span>{opt}</span>
                  <span className="font-mono text-xs">{count}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-md mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <Trophy size={14} /> Leaderboard
          </p>
          <div className="card-frame divide-y divide-border">
            {players.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-xs text-muted w-5">{i + 1}</span>
                <span className="flex-1 text-fg text-sm font-medium">{p.name}</span>
                <span className="font-mono text-xs text-fg-dim">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => nextQuestion(params.code, session, quiz.questions.length)}
          className="flex items-center gap-2 px-8 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors"
        >
          {isLastQuestion ? "See Final Results" : "Next Question"} <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ---- ENDED (final podium) ----
  const podium = players.slice(0, 3);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center">
      <Trophy size={40} className="text-fg mb-4" />
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg mb-10">
        Game Over
      </h1>

      <div className="flex items-end gap-4 mb-12">
        {podium.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center">
            <span className="font-medium text-fg mb-2">{p.name}</span>
            <div
              className="card-frame w-24 flex items-center justify-center font-display font-bold text-2xl"
              style={{ height: i === 0 ? 120 : i === 1 ? 90 : 70 }}
            >
              {i + 1}
            </div>
            <span className="font-mono text-xs text-muted mt-2">{p.score} pts</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="px-8 py-4 border border-border text-fg font-semibold text-sm uppercase tracking-wide hover:border-fg transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
