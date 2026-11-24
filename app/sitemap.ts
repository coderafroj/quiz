import type { MetadataRoute } from "next";
import { listApprovedQuizzesServerSide } from "@/lib/firestoreRest";
import { O_LEVEL_PAPERS, allOLevelQuizIds } from "@/lib/olevel";

const SITE_URL = "https://play.coderafroj.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const quizzes = await listApprovedQuizzesServerSide();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/olevel`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.95 },
    ...O_LEVEL_PAPERS.map((p) => ({
      url: `${SITE_URL}/olevel/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/join`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const quizRoutes: MetadataRoute.Sitemap = quizzes.map((q) => ({
    url: `${SITE_URL}/play/${q.id}`,
    lastModified: new Date(q.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Built-in O Level quizzes are always playable, so they are listed even before import.
  const seen = new Set(quizRoutes.map((r) => r.url));
  const olevelQuizRoutes: MetadataRoute.Sitemap = allOLevelQuizIds()
    .map((id) => `${SITE_URL}/play/${id}`)
    .filter((url) => !seen.has(url))
    .map((url) => ({ url, lastModified: new Date("2026-11-24"), changeFrequency: "monthly" as const, priority: 0.6 }));

  return [...staticRoutes, ...quizRoutes, ...olevelQuizRoutes];
}
