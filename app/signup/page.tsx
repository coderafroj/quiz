"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { user, loading, signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await signup(name, email, password);
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("email-already-in-use")
          ? "An account with that email already exists."
          : "Couldn't create your account — try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="card-frame p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 text-fg">
          <UserPlus size={18} />
          <span className="font-mono text-xs uppercase tracking-widest">Create Account</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-fg mb-6">Start building quizzes</h1>

        <label className="block font-mono text-xs text-muted uppercase mb-1">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border border-border px-3 py-2.5 mb-4 text-sm focus:border-fg outline-none"
        />

        <label className="block font-mono text-xs text-muted uppercase mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent border border-border px-3 py-2.5 mb-4 text-sm focus:border-fg outline-none"
        />

        <label className="block font-mono text-xs text-muted uppercase mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent border border-border px-3 py-2.5 mb-6 text-sm focus:border-fg outline-none"
        />

        {error && <p className="text-fg-dim text-xs font-mono mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create Account"}
        </button>

        <p className="text-center mt-5 font-mono text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-fg hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
