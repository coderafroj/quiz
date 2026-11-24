import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/host/', '/live/'],
    },
    sitemap: 'https://play.coderafroj.me/sitemap.xml',
  };
}
