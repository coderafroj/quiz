"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Save, ListChecks, Gamepad2, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToOwnerQuizzes } from "@/lib/quizzes";
import Navbar from "@/components/Navbar";
import type { Quiz } from "@/lib/types";

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill once the profile resolves
    if (profile?.displayName) setName(profile.displayName);
  }, [profile?.displayName]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToOwnerQuizzes(user.uid, setMyQuizzes);
    return unsubscribe;
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateDisplayName(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading…
      </div>
    );
  }

  const totalPlays = myQuizzes.reduce((sum, q) => sum + q.playCount, 0);
  const approvedCount = myQuizzes.filter((q) => q.status === "approved").length;
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-full bg-fg text-bg flex items-center justify-center font-display font-bold text-xl flex-shrink-0">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-2xl text-fg truncate">
                {profile.displayName}
              </h1>
              <p className="font-mono text-xs text-muted truncate">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-10">
            <div className="card-frame p-4 text-center">
              <ListChecks size={18} className="mx-auto mb-2" />
              <div className="font-display font-bold text-xl text-fg">{myQuizzes.length}</div>
              <div className="font-mono text-[10px] text-muted uppercase">Quizzes</div>
            </div>
            <div className="card-frame p-4 text-center">
              <Gamepad2 size={18} className="mx-auto mb-2" />
              <div className="font-display font-bold text-xl text-fg">{totalPlays}</div>
              <div className="font-mono text-[10px] text-muted uppercase">Total Plays</div>
            </div>
            <div className="card-frame p-4 text-center">
              <Calendar size={18} className="mx-auto mb-2" />
              <div className="font-display font-bold text-xl text-fg">{approvedCount}</div>
              <div className="font-mono text-[10px] text-muted uppercase">Published</div>
            </div>
          </div>

          <form onSubmit={handleSave} className="card-frame p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
              <UserIcon size={14} /> Edit Profile
            </h2>
            <label className="block font-mono text-xs text-muted uppercase mb-1">
              Display Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-border px-3 py-2.5 text-sm mb-4 focus:border-fg outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-60"
            >
              <Save size={14} /> {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
            </button>
          </form>

          <p className="font-mono text-xs text-muted text-center mt-8">
            Member since {memberSince}
          </p>
        </div>
      </main>
    </>
  );
}
