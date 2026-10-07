import type { MetadataRoute } from 'next';
import { showcaseRoutes, siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return showcaseRoutes.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === '/ecosystem' ? 'weekly' : 'monthly',
    priority: path === '/ecosystem' ? 1 : 0.7,
  }));
}
