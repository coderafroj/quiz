"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Play, Radio } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribeToPublicQuizzes } from "@/lib/quizzes";
import type { Quiz } from "@/lib/types";

export default function ExplorePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    const unsub = subscribeToPublicQuizzes(
      (list) => {
        setQuizzes(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.category?.trim()) set.add(q.category.trim());
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [quizzes]);

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesCategory = activeCategory === "All" || q.category === activeCategory;
      const matchesSearch =
        !search.trim() ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase()) ||
        q.category.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [quizzes, activeCategory, search]);

  // Group filtered quizzes by category for section headers when "All" is active.
  const grouped = useMemo(() => {
    if (activeCategory !== "All") return { [activeCategory]: filtered };
    const map: Record<string, Quiz[]> = {};
    filtered.forEach((q) => {
      const cat = q.category?.trim() || "Uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(q);
    });
    return map;
  }, [filtered, activeCategory]);

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-5 md:px-8 min-h-screen max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-fg mb-3">
            Explore Quizzes.
          </h1>
          <p className="text-fg-dim text-sm md:text-base max-w-xl mx-auto">
            Public quizzes from every topic — pick one and jump straight in. No account needed
            to play.
          </p>
        </div>

        <div className="relative max-w-md mx-auto mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes… e.g. Python, Cricket, History"
            className="w-full bg-transparent border border-border pl-9 pr-3 py-2.5 text-sm focus:border-fg outline-none"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide border transition-colors ${
                  activeCategory === cat
                    ? "bg-fg text-bg border-fg"
                    : "border-border text-muted hover:border-fg hover:text-fg"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted font-mono text-sm">Loading quizzes…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted font-mono text-sm">
            {quizzes.length === 0
              ? "No public quizzes yet — be the first to create one!"
              : "No quizzes match your search."}
          </p>
        ) : (
          <div className="space-y-12">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                {activeCategory === "All" && (
                  <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4 border-b border-border pb-2">
                    {category}
                  </h2>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((quiz) => (
                    <div key={quiz.id} className="card-frame p-5 flex flex-col gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 font-mono text-[11px] text-muted uppercase">
                          <span>{quiz.language}</span>
                          <span>·</span>
                          <span>{quiz.questions.length} questions</span>
                          <span>·</span>
                          <span>{quiz.playCount} plays</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-fg">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-fg-dim text-sm mt-1 line-clamp-2">
                            {quiz.description}
                          </p>
                        )}
                        <p className="text-muted text-xs mt-2 font-mono">by {quiz.ownerName}</p>
                      </div>
                      <Link
                        href={`/play/${quiz.id}`}
                        className="mt-auto flex items-center justify-center gap-2 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors"
                      >
                        <Play size={13} /> Play Now
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="text-center mt-16 pt-10 border-t border-border">
          <p className="text-fg-dim text-sm mb-4">Want to see your quiz here?</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border text-fg font-semibold text-sm uppercase tracking-wide hover:border-fg transition-colors"
          >
            <Radio size={16} /> Create a Public Quiz
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
