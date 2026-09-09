"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { joinSession } from "@/lib/sessions";
import Navbar from "@/components/Navbar";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setJoining(true);
    try {
      const cleanCode = code.trim();
      const playerId = await joinSession(cleanCode, name.trim());
      sessionStorage.setItem(`quizplay_player_${cleanCode}`, playerId);
      sessionStorage.setItem(`quizplay_name_${cleanCode}`, name.trim());
      router.push(`/live/${cleanCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join that game.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-5">
        <form onSubmit={handleSubmit} className="card-frame p-8 w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-6 text-fg">
            <Radio size={18} />
            <span className="font-mono text-xs uppercase tracking-widest">Join a Game</span>
          </div>

          <input
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            className="w-full bg-transparent border border-border px-3 py-3 text-center text-2xl font-mono tracking-[0.3em] mb-4 focus:border-fg outline-none"
          />
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your nickname"
            className="w-full bg-transparent border border-border px-3 py-3 text-sm text-center mb-6 focus:border-fg outline-none"
          />

          {error && <p className="text-fg-dim text-xs font-mono mb-4">{error}</p>}

          <button
            type="submit"
            disabled={joining}
            className="w-full py-3 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-60"
          >
            {joining ? "Joining…" : "Join Game"}
          </button>
        </form>
      </div>
    </>
  );
}
