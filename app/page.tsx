import Link from "next/link";
import { ArrowRight, Zap, Globe2, Users, BookOpen, Code2, GraduationCap, TrendingUp, Shuffle, ShieldCheck, Laptop, Cpu } from "lucide-react";
import { SiPython, SiCplusplus, SiOpenjdk } from "@icons-pack/react-simple-icons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DailyQuizBanner from "@/components/DailyQuizBanner";
import { O_LEVEL_PAPERS, paperTotals, totalOLevelQuestions } from "@/lib/olevel";

const TOPICS = [
  { name: "O Level", icon: GraduationCap },
  { name: "Python", icon: SiPython },
  { name: "C", icon: Code2 },
  { name: "C++", icon: SiCplusplus },
  { name: "Java", icon: SiOpenjdk },
  { name: "General Knowledge", icon: BookOpen },
];

const PAPER_ICONS = { m1: Laptop, m2: Globe2, m3: Code2, m4: Cpu } as const;

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Progress that follows you",
    description: "Best scores, attempts and a readiness meter for every paper — saved to your account and synced on every device.",
  },
  {
    icon: Shuffle,
    title: "Shuffled & timed",
    description: "Options reshuffle on every attempt and each question is timed, so you learn the answer instead of its position.",
  },
  {
    icon: Zap,
    title: "Live or Solo",
    description: "Host a real-time game with a join code, or share a link people play anytime, at their own pace.",
  },
  {
    icon: ShieldCheck,
    title: "Fair play",
    description: "Copy, text-selection and tab-switching are discouraged and flagged, so scores actually mean something.",
  },
  {
    icon: Globe2,
    title: "Any language",
    description: "Build quizzes in whatever language your audience speaks — no restrictions.",
  },
  {
    icon: Users,
    title: "You own every quiz",
    description: "Create a quiz and it's yours — edit it, share it, or delete it anytime.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-24 sm:pt-32 pb-24 px-4 sm:px-5 md:px-8">
        <section className="max-w-5xl mx-auto text-center mb-14 sm:mb-20">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs tracking-widest uppercase border border-border px-3 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-correct animate-pulse" />
            NIELIT O Level · {totalOLevelQuestions()} questions · Free
          </span>
          <h1 className="font-display font-extrabold text-[2.6rem] leading-[1] sm:text-6xl md:text-7xl tracking-tight text-fg mb-6">
            Crack the O Level.
            <br />
            <span className="italic font-light">One unit</span> at a time.
          </h1>
          <p className="text-fg-dim text-base md:text-lg max-w-2xl mx-auto mb-9 leading-relaxed">
            Unit-wise MCQs for all four papers — IT Tools, Web Design, Python and IoT — with full mock tests and a
            progress tracker. Plus quizzes on anything, played solo or live with a join code.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
            <Link
              href="/olevel"
              className="group inline-flex items-center justify-center gap-2 px-6 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors"
            >
              Start O Level practice
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 border border-border text-fg font-semibold text-sm uppercase tracking-wide hover:border-fg transition-colors"
            >
              Explore quizzes
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 border border-border text-fg font-semibold text-sm uppercase tracking-wide hover:border-fg transition-colors"
            >
              Join a live game
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mb-16 sm:mb-20" aria-labelledby="papers-heading">
          <div className="flex items-end justify-between gap-4 mb-5">
            <h2 id="papers-heading" className="font-display font-bold text-2xl sm:text-3xl text-fg">
              The four O Level papers
            </h2>
            <Link href="/olevel" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-fg whitespace-nowrap">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {O_LEVEL_PAPERS.map((p) => {
              const Icon = PAPER_ICONS[p.slug];
              const { units, questions } = paperTotals(p);
              return (
                <Link key={p.slug} href={`/olevel/${p.slug}`} className="card-frame p-5 sm:p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[11px] tracking-widest text-muted">{p.code}</span>
                    <Icon size={20} strokeWidth={1.5} className="text-fg-dim group-hover:text-fg transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-fg mb-1.5 leading-snug">{p.short}</h3>
                  <p className="text-fg-dim text-sm mb-4 line-clamp-2">{p.summary}</p>
                  <p className="font-mono text-[11px] text-muted">{units} units · {questions} questions · mock test</p>
                </Link>
              );
            })}
          </div>
        </section>

        <DailyQuizBanner />

        <section className="max-w-3xl mx-auto text-center mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Browse by topic</p>
          <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center">
            {TOPICS.map((t) => (
              <Link
                key={t.name}
                href={`/explore?category=${encodeURIComponent(t.name)}`}
                className="flex items-center gap-2 px-4 py-2.5 border border-border text-fg-dim hover:border-fg hover:text-fg transition-colors text-sm font-medium"
              >
                <t.icon size={16} />
                {t.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-frame p-5 sm:p-6">
              <f.icon size={22} strokeWidth={1.5} className="mb-4" />
              <h3 className="font-display font-bold text-lg text-fg mb-2">{f.title}</h3>
              <p className="text-fg-dim text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </section>

        <section className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl text-fg mb-3">Want to make your own quiz?</h2>
          <p className="text-fg-dim text-sm mb-6">Create it in minutes, even with AI, then share a link or host it live.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 border border-border hover:border-fg text-fg font-semibold text-sm uppercase tracking-wide transition-colors"
          >
            Create a quiz
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
