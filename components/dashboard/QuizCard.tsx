"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Link2, Radio, Check, Users } from "lucide-react";
import { deleteQuiz } from "@/lib/quizzes";
import { createSession } from "@/lib/sessions";
import type { Quiz } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function QuizCard({ quiz, ownerId }: { quiz: Quiz; ownerId: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${quiz.title}"? This can't be undone.`)) return;
    await deleteQuiz(quiz.id);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/play/${quiz.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleHostLive() {
    setStarting(true);
    try {
      const code = await createSession(quiz, ownerId);
      router.push(`/host/${code}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="card-frame p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1 font-mono text-[11px] text-muted uppercase">
          <span>{quiz.language}</span>
          <span>·</span>
          <span>{quiz.questions.length} questions</span>
          <span>·</span>
          <span>{quiz.playCount} plays</span>
        </div>
        <h3 className="font-display font-bold text-lg text-fg">{quiz.title}</h3>
        {quiz.description && <p className="text-fg-dim text-sm mt-1">{quiz.description}</p>}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        <button
          onClick={handleHostLive}
          disabled={starting || quiz.questions.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-fg text-bg text-xs font-mono uppercase font-semibold hover:bg-fg-dim transition-colors disabled:opacity-50"
        >
          <Radio size={13} /> {starting ? "Starting…" : "Host Live"}
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-mono uppercase hover:border-fg transition-colors"
        >
          {copied ? <Check size={13} /> : <Link2 size={13} />}
          {copied ? "Copied" : "Solo Link"}
        </button>
        <Link
          href={`/dashboard/${quiz.id}/edit`}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-mono uppercase hover:border-fg transition-colors"
        >
          <Pencil size={13} /> Edit
        </Link>
        <Link
          href={`/dashboard/${quiz.id}/results`}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-mono uppercase hover:border-fg transition-colors"
        >
          <Users size={13} /> Results
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-mono uppercase hover:invert-hover transition-colors ml-auto"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
