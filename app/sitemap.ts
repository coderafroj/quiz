import { MetadataRoute } from 'next';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { requireDb } from '@/lib/firebase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://play.coderafroj.me';
  
  // Core static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  try {
    const db = requireDb();
    const q = query(collection(db, "quizzes"), where("visibility", "==", "public"));
    const snap = await getDocs(q);
    
    const quizRoutes = snap.docs.map(doc => {
      const data = doc.data();
      return {
        url: `${baseUrl}/play/${doc.id}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });

    return [...routes, ...quizRoutes];
  } catch (err) {
    console.error("Failed to fetch quizzes for sitemap:", err);
    return routes;
  }
}
