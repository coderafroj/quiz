"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, Trophy, Users } from "lucide-react";
import { getQuiz } from "@/lib/quizzes";
import { subscribeToSession, subscribeToPlayers, submitAnswer } from "@/lib/sessions";
import type { Quiz, LiveSession, LivePlayer } from "@/lib/types";

const SHAPES = ["▲", "◆", "●", "■"];

export default function LivePlayerPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [session, setSession] = useState<LiveSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const [answeredForQuestion, setAnsweredForQuestion] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const id = sessionStorage.getItem(`quizplay_player_${params.code}`);
    const name = sessionStorage.getItem(`quizplay_name_${params.code}`);
    if (!id || !name) {
      router.replace("/join");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from sessionStorage on mount
    setPlayerId(id);
    setPlayerName(name);
  }, [params.code, router]);

  useEffect(() => {
    const unsubscribe = subscribeToSession(params.code, setSession);
    return unsubscribe;
  }, [params.code]);

  useEffect(() => {
    if (!session) return;
    getQuiz(session.quizId).then(setQuiz);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on quizId only
  }, [session?.quizId]);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers(params.code, setPlayers);
    return unsubscribe;
  }, [params.code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets per-question local answer state when a new question starts
    if (session?.status === "question") setAnsweredIndex(null);
  }, [session?.currentQuestionIndex, session?.status]);

  useEffect(() => {
    if (session?.status !== "question" || !session.questionStartedAt || !quiz) return;
    const question = quiz.questions[session.currentQuestionIndex];
    const tick = () => {
      const elapsed = (Date.now() - session.questionStartedAt!) / 1000;
      setTimeLeft(Math.max(0, Math.ceil(question.timeLimit - elapsed)));
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [session?.status, session?.questionStartedAt, session?.currentQuestionIndex, quiz]);

  if (!playerId || !session || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Connecting…
      </div>
    );
  }

  const question = quiz.questions[session.currentQuestionIndex];
  const myPlayer = players.find((p) => p.id === playerId);
  const myRank = players.findIndex((p) => p.id === playerId) + 1;

  async function handleAnswer(idx: number) {
    if (answeredIndex !== null || !session?.questionStartedAt) return;
    setAnsweredIndex(idx);
    setAnsweredForQuestion(session.currentQuestionIndex);
    await submitAnswer(
      params.code,
      playerId!,
      playerName,
      session.currentQuestionIndex,
      question,
      idx,
      session.questionStartedAt
    );
  }

  if (session.status === "lobby") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <Users size={28} className="text-fg mb-4" />
        <h1 className="font-display font-bold text-2xl text-fg mb-2">You&apos;re in, {playerName}!</h1>
        <p className="text-fg-dim font-mono text-sm">Waiting for the host to start…</p>
      </div>
    );
  }

  if (session.status === "question") {
    const hasAnswered = answeredIndex !== null && answeredForQuestion === session.currentQuestionIndex;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
        {!hasAnswered ? (
          <>
            <div className="flex items-center gap-2 mb-8 font-mono text-sm text-fg">
              <Clock size={14} /> {timeLeft}s
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="card-frame invert-hover aspect-square flex flex-col items-center justify-center gap-2 p-4 text-center"
                >
                  <span className="text-2xl">{SHAPES[idx]}</span>
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center">
            <Check size={32} className="text-fg mx-auto mb-4" />
            <p className="font-mono text-sm text-muted">Answer locked in — waiting for others…</p>
          </div>
        )}
      </div>
    );
  }

  if (session.status === "reveal") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Your Score</p>
        <h1 className="font-display font-extrabold text-5xl text-fg mb-2">{myPlayer?.score ?? 0}</h1>
        <p className="font-mono text-sm text-muted mb-8">
          Rank #{myRank || "—"} of {players.length}
        </p>
        <p className="font-mono text-xs text-muted">Waiting for the next question…</p>
      </div>
    );
  }

  // ended
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <Trophy size={36} className="text-fg mb-4" />
      <h1 className="font-display font-extrabold text-3xl text-fg mb-2">Game Over</h1>
      <p className="text-fg-dim mb-8">
        You finished #{myRank || "—"} with {myPlayer?.score ?? 0} points.
      </p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
        <div className="card-frame divide-y divide-border">
          {players.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${p.id === playerId ? "bg-surface-raised" : ""}`}>
              <span className="font-mono text-xs text-muted w-5">{i + 1}</span>
              <span className="flex-1 text-fg text-sm font-medium">{p.name}</span>
              <span className="font-mono text-xs text-fg-dim">{p.score}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
