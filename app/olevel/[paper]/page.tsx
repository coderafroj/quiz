import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaperUnits from "@/components/olevel/PaperUnits";
import { O_LEVEL_PAPERS, getPaper, mockQuizId, paperTotals, unitQuizId } from "@/lib/olevel";

const SITE_URL = "https://play.coderafroj.me";

export function generateStaticParams() {
  return O_LEVEL_PAPERS.map((p) => ({ paper: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ paper: string }> }): Promise<Metadata> {
  const { paper: slug } = await params;
  const paper = getPaper(slug);
  if (!paper) return { title: "Paper not found" };
  const { questions, units } = paperTotals(paper);
  const title = `NIELIT O Level ${paper.code} ${paper.short} MCQs — ${questions} Practice Questions & Mock Test`;
  const description = `Free ${paper.code} (${paper.title}) practice for NIELIT O Level: ${units} unit quizzes, ${questions} MCQs and a full mock test. ${paper.summary}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/olevel/${paper.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/olevel/${paper.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PaperPage({ params }: { params: Promise<{ paper: string }> }) {
  const { paper: slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  const { questions, units } = paperTotals(paper);
  const idx = O_LEVEL_PAPERS.findIndex((p) => p.slug === paper.slug);
  const prev = O_LEVEL_PAPERS[idx - 1];
  const next = O_LEVEL_PAPERS[idx + 1];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: `${paper.code} ${paper.title} — NIELIT O Level practice`,
      description: paper.summary,
      provider: { "@type": "Organization", name: "Codarafroj Play", url: SITE_URL },
      educationalLevel: "Beginner",
      inLanguage: "en",
      isAccessibleForFree: true,
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "O Level", item: `${SITE_URL}/olevel` },
        { "@type": "ListItem", position: 3, name: paper.code, item: `${SITE_URL}/olevel/${paper.slug}` },
      ],
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-24 sm:pt-28 pb-28 md:pb-20 px-4 sm:px-6 md:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] text-muted mb-6">
            <Link href="/" className="hover:text-fg">Home</Link> /{" "}
            <Link href="/olevel" className="hover:text-fg">O Level</Link> /{" "}
            <span className="text-fg-dim">{paper.code}</span>
          </nav>

          <header className="mb-8">
            <span className="inline-block font-mono text-[11px] tracking-widest uppercase border border-border px-2.5 py-1 mb-4">
              {paper.code} · Semester {paper.semester}
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight text-fg mb-4">
              {paper.title}
            </h1>
            <p className="text-fg-dim text-base leading-relaxed mb-5">{paper.summary}</p>
            <ul className="flex flex-wrap gap-2 mb-4">
              {paper.skills.map((s) => (
                <li key={s} className="font-mono text-[11px] text-fg-dim border border-border px-2.5 py-1">{s}</li>
              ))}
            </ul>
            <p className="font-mono text-xs text-muted">{units} units · {questions} questions · 1 full mock test</p>
          </header>

          <PaperUnits
            units={paper.units.map((u) => ({
              id: unitQuizId(paper.slug, u.slug),
              title: u.title,
              summary: u.summary,
              topics: u.topics,
              questions: u.qs.length,
            }))}
            mockId={mockQuizId(paper.slug)}
            mockQuestions={Math.min(30, questions)}
          />

          <nav className="mt-10 flex justify-between gap-4 font-mono text-xs uppercase tracking-wide">
            {prev ? (
              <Link href={`/olevel/${prev.slug}`} className="text-fg-dim hover:text-fg">← {prev.code}</Link>
            ) : <span />}
            {next ? (
              <Link href={`/olevel/${next.slug}`} className="text-fg-dim hover:text-fg">{next.code} →</Link>
            ) : <span />}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
