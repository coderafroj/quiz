"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitFork, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { remixQuiz } from "@/lib/quizzes";
import type { Quiz } from "@/lib/types";

export default function RemixButton({ quiz }: { quiz: Quiz }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function handleRemix() {
    if (!user || !profile) {
      router.push(`/login?next=/explore`);
      return;
    }
    setWorking(true);
    try {
      const newId = await remixQuiz(quiz, user.uid, profile.displayName, profile.role === "admin");
      router.push(`/dashboard/${newId}/edit`);
    } finally {
      setWorking(false);
    }
  }

  return (
    <button
      onClick={handleRemix}
      disabled={working}
      title="Make your own editable copy of this quiz"
      className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-border hover:border-fg transition-colors text-xs font-mono uppercase disabled:opacity-60"
    >
      {working ? <Loader2 size={13} className="animate-spin" /> : <GitFork size={13} />}
      Remix
    </button>
  );
}
