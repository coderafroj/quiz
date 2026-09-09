import Link from "next/link";
import { ArrowRight, Zap, Globe2, ShieldCheck, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    icon: Zap,
    title: "Live or Solo",
    description: "Host a real-time game with a join code, or share a link people play anytime, at their own pace.",
  },
  {
    icon: Globe2,
    title: "Any Language",
    description: "Build quizzes in whatever language your audience speaks — no restrictions.",
  },
  {
    icon: Users,
    title: "You Own Every Quiz",
    description: "Sign in, create a quiz, and it's yours — edit it, share it, or delete it anytime.",
  },
  {
    icon: ShieldCheck,
    title: "Built by a Developer",
    description: "No bloated ad-filled quiz maker. Fast, clean, and made by someone who actually codes.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-5 md:px-8">
        <div className="max-w-5xl mx-auto text-center mb-20">
          <span className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase border border-border px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-fg animate-pulse" />
            Free to create · Free to play
          </span>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[0.98] tracking-tight text-fg mb-6">
            Build a quiz.
            <br />
            <span className="italic font-light">Anyone</span> can play it.
          </h1>
          <p className="text-fg-dim text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Create quizzes on anything, in any language. Share a link for people to play solo, or
            host a live game everyone joins with a code — like a classroom quiz night, but yours.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-6 py-3.5 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors"
            >
              Create a Quiz
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-border text-fg font-semibold text-sm uppercase tracking-wide hover:border-fg transition-colors"
            >
              Join a Live Game
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-frame p-6 md:p-7">
              <f.icon size={24} strokeWidth={1.5} className="mb-5" />
              <h3 className="font-display font-bold text-lg text-fg mb-2">{f.title}</h3>
              <p className="text-fg-dim text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
