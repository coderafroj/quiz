"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage("Check your inbox for a password reset link.");
    } catch {
      setError("Couldn't send reset link. Check the email address.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="card-frame p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 text-fg">
          <KeyRound size={18} />
          <span className="font-mono text-xs uppercase tracking-widest">Reset Password</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-fg mb-6">Forgot your password?</h1>

        <label className="block font-mono text-xs text-muted uppercase mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent border border-border px-3 py-2.5 mb-6 text-sm focus:border-fg outline-none"
        />

        {error && <p className="text-fg-dim text-xs font-mono mb-4">{error}</p>}
        {message && <p className="text-green-500 text-xs font-mono mb-4">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-60"
        >
          {submitting ? "Sending link…" : "Send Reset Link"}
        </button>

        <p className="text-center mt-6 font-mono text-xs text-muted">
          Remembered it?{" "}
          <Link href="/login" className="text-fg hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
