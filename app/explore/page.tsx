"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Play, Radio, Star, Code2, BookOpen } from "lucide-react";
import { SiPython, SiCplusplus, SiOpenjdk, SiJavascript } from "@icons-pack/react-simple-icons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RemixButton from "@/components/RemixButton";
import { useAuth } from "@/context/AuthContext";
import { subscribeToPublicQuizzes, setFeatured } from "@/lib/quizzes";
import type { Quiz } from "@/lib/types";

const TOPIC_ICONS: Record<string, React.ElementType> = {
  python: SiPython,
  "c++": SiCplusplus,
  cpp: SiCplusplus,
  java: SiOpenjdk,
  javascript: SiJavascript,
  js: SiJavascript,
};

function TopicIcon({ category, size = 14 }: { category: string; size?: number }) {
  const key = category.trim().toLowerCase();
  if (key === "general knowledge") return <BookOpen size={size} />;
  const Icon = TOPIC_ICONS[key];
  return Icon ? <Icon size={size} /> : <Code2 size={size} />;
}

function ExploreContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = profile?.role === "admin";
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

  useEffect(() => {
    const fromUrl = searchParams.get("category");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time preselect from a shared/linked URL, not a render loop
    if (fromUrl) setActiveCategory(fromUrl);
  }, [searchParams]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quizzes.forEach((q) => {
      const cat = q.category?.trim();
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [quizzes]);

  const categories = useMemo(() => {
    return ["All", ...Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b))];
  }, [categoryCounts]);

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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wide border transition-colors ${
                  activeCategory === cat
                    ? "bg-fg text-bg border-fg"
                    : "border-border text-muted hover:border-fg hover:text-fg"
                }`}
              >
                {cat !== "All" && <TopicIcon category={cat} size={13} />}
                {cat}
                {cat !== "All" && (
                  <span className={activeCategory === cat ? "text-bg/60" : "text-muted"}>
                    {categoryCounts[cat]}
                  </span>
                )}
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
                  <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted mb-4 border-b border-border pb-2">
                    <TopicIcon category={category} />
                    {category}
                    <span className="text-muted/60">({items.length})</span>
                  </h2>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((quiz) => (
                    <div key={quiz.id} className="card-frame p-5 flex flex-col gap-3 relative">
                      {isAdmin ? (
                        <button
                          onClick={() => setFeatured(quiz.id, !quiz.featured)}
                          title={quiz.featured ? "Unfeature this quiz" : "Feature this quiz"}
                          className={`absolute top-3 right-3 p-1.5 transition-colors ${
                            quiz.featured ? "text-fg" : "text-muted hover:text-fg"
                          }`}
                        >
                          <Star size={16} fill={quiz.featured ? "currentColor" : "none"} />
                        </button>
                      ) : (
                        quiz.featured && (
                          <span className="absolute top-3 right-3 text-fg">
                            <Star size={16} fill="currentColor" />
                          </span>
                        )
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1 font-mono text-[11px] text-muted uppercase">
                          <span>{quiz.language}</span>
                          <span>·</span>
                          <span>{quiz.difficulty}</span>
                          <span>·</span>
                          <span>{quiz.questions.length} questions</span>
                          <span>·</span>
                          <span>{quiz.playCount} plays</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-fg pr-6">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-fg-dim text-sm mt-1 line-clamp-2">
                            {quiz.description}
                          </p>
                        )}
                        <p className="text-muted text-xs mt-2 font-mono">
                          by {quiz.ownerName}
                          {!!quiz.remixCount && quiz.remixCount > 0 && (
                            <> · 🔀 {quiz.remixCount} remix{quiz.remixCount > 1 ? "es" : ""}</>
                          )}
                        </p>
                      </div>
                      <div className="mt-auto flex gap-2">
                        <Link
                          href={`/play/${quiz.id}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-fg text-bg font-semibold text-xs uppercase tracking-wide hover:bg-fg-dim transition-colors"
                        >
                          <Play size={13} /> Play Now
                        </Link>
                        <RemixButton quiz={quiz} />
                      </div>
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

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreContent />
    </Suspense>
  );
}
