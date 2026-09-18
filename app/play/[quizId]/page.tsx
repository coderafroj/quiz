import type { Metadata } from "next";
import { getQuizServerSide } from "@/lib/firestoreRest";
import SoloPlayClient from "@/components/play/SoloPlayClient";

const SITE_URL = "https://play.coderafroj.me";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ quizId: string }>;
}): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = await getQuizServerSide(quizId);

  if (!quiz) {
    return { title: "Quiz not found | Codarafroj Play" };
  }

  const title = `${quiz.title} — ${quiz.category} Quiz | Codarafroj Play`;
  const description =
    quiz.description ||
    `Play "${quiz.title}", a free ${quiz.difficulty?.toLowerCase() || ""} ${quiz.category} quiz with ${quiz.questions?.length || 0} questions in ${quiz.language}. No signup needed to play.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/play/${quizId}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/play/${quizId}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots:
      quiz.status === "approved" && quiz.visibility === "public"
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function SoloPlayPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const quiz = await getQuizServerSide(quizId);

  const jsonLd = quiz
    ? {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: quiz.title,
        description: quiz.description || `A ${quiz.category} quiz on Codarafroj Play.`,
        learningResourceType: "Quiz",
        educationalLevel: quiz.difficulty,
        about: quiz.category,
        inLanguage: quiz.language,
        provider: {
          "@type": "Organization",
          name: "Codarafroj Play",
          url: SITE_URL,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SoloPlayClient quizId={quizId} initialQuiz={quiz} />
    </>
  );
}
