import type { Metadata } from 'next';
import './globals.css';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'Teachly — образовательные модули для вашего продукта', template: '%s | Teachly' },
  description: 'Единое ядро. Связанные образовательные модули. Одна интеграция.',
  applicationName: 'Teachly',
  keywords: ['образовательная платформа', 'EdTech API', 'аналитика обучения', 'AI для обучения', 'Teachly'],
  alternates: { canonical: '/ecosystem' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: '/ecosystem',
    siteName: 'Teachly',
    title: 'Teachly — образовательные модули для вашего продукта',
    description: 'Единое ядро. Связанные образовательные модули. Одна интеграция.',
  },
  twitter: { card: 'summary', title: 'Teachly Ecosystem', description: 'Образовательные модули и аналитика для существующего продукта.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
