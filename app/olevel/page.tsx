import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OLevelHub, { type PaperCardData } from "@/components/olevel/OLevelHub";
import { O_LEVEL_PAPERS, paperTotals, totalOLevelQuestions } from "@/lib/olevel";

const SITE_URL = "https://play.coderafroj.me";
const TITLE = "NIELIT O Level Practice Tests — M1, M2, M3 Python & M4 IoT MCQs (Free)";
const DESCRIPTION =
  "Free NIELIT O Level (IT) MCQ practice for all four papers: IT Tools & Network Basics, Web Designing & Publishing, Python Programming and Internet of Things. Unit-wise quizzes, full mock tests and progress tracking.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "NIELIT O Level mock test", "O Level MCQ", "O Level M1 R5", "O Level M2 R5 web designing", "O Level Python M3 R5",
    "O Level IoT M4 R5", "O Level practice questions", "DOEACC O Level quiz", "O Level online test free",
  ],
  alternates: { canonical: `${SITE_URL}/olevel` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/olevel`, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ = [
  {
    q: "What is the NIELIT O Level (IT) course?",
    a: "O Level is a foundation-level IT course under the NIELIT (formerly DOEACC) scheme. It has four compulsory theory modules, a practical exam based on those modules, and a project.",
  },
  {
    q: "Which papers does this practice cover?",
    a: "All four theory modules: M1 Information Technology Tools and Network Basics, M2 Web Designing and Publishing, M3 Programming and Problem Solving through Python, and M4 Internet of Things and its Applications.",
  },
  {
    q: "Is the practice free?",
    a: "Yes. Every unit quiz and mock test is free. Sign in with an email or Google account so your scores and progress are saved across devices.",
  },
  {
    q: "Which paper should I start with?",
    a: "Follow the order of the course: M1 and M2 first, then M3 Python and M4 IoT. Take each unit quiz, review what you missed, then attempt the full mock test for that paper.",
  },
  {
    q: "Are these the official exam questions?",
    a: "No. These are original practice questions written to match the syllabus topics. Always check the latest syllabus on nielit.gov.in.",
  },
];

export default function OLevelPage() {
  const papers: PaperCardData[] = O_LEVEL_PAPERS.map((p) => ({
    slug: p.slug,
    code: p.code,
    title: p.title,
    short: p.short,
    summary: p.summary,
    semester: p.semester,
    unitSlugs: p.units.map((u) => u.slug),
    questions: paperTotals(p).questions,
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "NIELIT O Level practice papers",
      itemListElement: O_LEVEL_PAPERS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${p.code} ${p.title}`,
        url: `${SITE_URL}/olevel/${p.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-24 sm:pt-28 pb-28 md:pb-20 px-4 sm:px-6 md:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="max-w-5xl mx-auto">
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] text-muted mb-6">
            <Link href="/" className="hover:text-fg">Home</Link> / <span className="text-fg-dim">O Level</span>
          </nav>

          <header className="mb-10 max-w-3xl">
            <span className="inline-block font-mono text-[11px] tracking-widest uppercase border border-border px-2.5 py-1 mb-5">
              NIELIT · DOEACC · Revision 5.1
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-tight text-fg mb-5">
              O Level practice, paper by paper.
            </h1>
            <p className="text-fg-dim text-base md:text-lg leading-relaxed">
              {totalOLevelQuestions()} original MCQs across all four papers — unit-wise quizzes, a full mock test for
              each paper, and a readiness score that tracks where you are.
            </p>
          </header>

          <OLevelHub papers={papers} />

          <section className="mt-14 max-w-3xl">
            <h2 className="font-display font-bold text-2xl text-fg mb-5">How to use this</h2>
            <ol className="space-y-3 text-fg-dim text-sm sm:text-base leading-relaxed list-decimal pl-5">
              <li>Pick a paper and work through its units in order — each one is a short quiz.</li>
              <li>Options are shuffled every time, so you learn the answer, not the position.</li>
              <li>Finish every unit, then take the full mock test for that paper.</li>
              <li>Come back to weak units until your readiness bar turns green.</li>
            </ol>
          </section>

          <section className="mt-14 max-w-3xl">
            <h2 className="font-display font-bold text-2xl text-fg mb-5">Frequently asked questions</h2>
            <div className="space-y-5">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <h3 className="font-semibold text-fg mb-1">{f.q}</h3>
                  <p className="text-fg-dim text-sm sm:text-base leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
