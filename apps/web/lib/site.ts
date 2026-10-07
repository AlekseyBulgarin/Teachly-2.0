import type { Metadata } from 'next';

export const siteUrl = new URL(process.env.TEACHLY_SITE_URL ?? 'https://teachly-tau.vercel.app');

export const showcaseRoutes = [
  '/ecosystem', '/platform', '/tasks', '/variants', '/theory', '/trainer', '/whiteboard',
  '/learning', '/ai', '/student-profile', '/progress', '/teacher', '/analytics', '/knowledge', '/integrations',
] as const;

export function showcaseMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'website' },
  };
}
