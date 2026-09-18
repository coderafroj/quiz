import type { MetadataRoute } from "next";
import { listApprovedQuizzesServerSide } from "@/lib/firestoreRest";

const SITE_URL = "https://play.coderafroj.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const quizzes = await listApprovedQuizzesServerSide();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
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

  return [...staticRoutes, ...quizRoutes];
}
