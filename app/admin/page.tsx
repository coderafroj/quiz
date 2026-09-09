"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Users, ListChecks, Gamepad2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToAllUsers } from "@/lib/users";
import { subscribeToAllQuizzes, deleteQuiz } from "@/lib/quizzes";
import Navbar from "@/components/Navbar";
import type { UserProfile, Quiz } from "@/lib/types";

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      if (!loading && user && profile && profile.role !== "admin") router.replace("/dashboard");
      if (!loading && !user) router.replace("/login");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    const u1 = subscribeToAllUsers(setUsers);
    const u2 = subscribeToAllQuizzes(setQuizzes);
    return () => {
      u1();
      u2();
    };
  }, [profile?.role]);

  if (loading || !user || profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted">
        Loading…
      </div>
    );
  }

  const totalPlays = quizzes.reduce((sum, q) => sum + q.playCount, 0);

  async function handleDeleteQuiz(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This affects the owner's quiz too.`)) return;
    await deleteQuiz(id);
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs tracking-widest text-muted uppercase block mb-2">
            Platform Admin
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-fg mb-10">
            Everything, in one place.
          </h1>

          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <div className="card-frame p-6 flex items-center gap-4">
              <Users size={22} />
              <div>
                <div className="font-display font-bold text-2xl text-fg">{users.length}</div>
                <div className="text-xs text-muted font-mono uppercase">Users</div>
              </div>
            </div>
            <div className="card-frame p-6 flex items-center gap-4">
              <ListChecks size={22} />
              <div>
                <div className="font-display font-bold text-2xl text-fg">{quizzes.length}</div>
                <div className="text-xs text-muted font-mono uppercase">Quizzes</div>
              </div>
            </div>
            <div className="card-frame p-6 flex items-center gap-4">
              <Gamepad2 size={22} />
              <div>
                <div className="font-display font-bold text-2xl text-fg">{totalPlays}</div>
                <div className="text-xs text-muted font-mono uppercase">Total Plays</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
                All Quizzes
              </h2>
              <div className="card-frame divide-y divide-border max-h-[520px] overflow-y-auto">
                {quizzes.map((q) => (
                  <div key={q.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-fg text-sm font-medium truncate">{q.title}</p>
                      <p className="text-muted text-xs font-mono truncate">
                        by {q.ownerName} · {q.questions.length} Q · {q.playCount} plays
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuiz(q.id, q.title)}
                      className="p-2 border border-border hover:invert-hover transition-colors flex-shrink-0"
                      aria-label="Delete quiz"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {quizzes.length === 0 && (
                  <p className="text-muted text-sm font-mono p-4">No quizzes yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
                All Users
              </h2>
              <div className="card-frame divide-y divide-border max-h-[520px] overflow-y-auto">
                {users.map((u) => (
                  <div key={u.uid} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-fg text-sm font-medium truncate">{u.displayName}</p>
                      <p className="text-muted text-xs font-mono truncate">{u.email}</p>
                    </div>
                    {u.role === "admin" && (
                      <span className="text-[10px] font-mono border border-border-strong px-1.5 py-0.5">
                        ADMIN
                      </span>
                    )}
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-muted text-sm font-mono p-4">No users yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
