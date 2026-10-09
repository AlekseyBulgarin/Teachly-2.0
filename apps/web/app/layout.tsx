import type { Metadata } from 'next';
import './globals.css';
import { siteUrl } from '@/lib/site';
import { serializeJsonLd, structuredDataForSite, teachlyBrand } from '@/lib/seo';

const structuredData = structuredDataForSite();
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'Teachly Ecosystem — образовательные модули для бизнеса', template: '%s | Teachly' },
  description: teachlyBrand.description,
  applicationName: teachlyBrand.name,
  creator: 'Teachly',
  publisher: 'Teachly',
  category: 'education',
  keywords: ['Teachly', 'Teachly Ecosystem', 'образовательная платформа', 'EdTech API', 'аналитика обучения', 'AI для обучения'],
  alternates: { canonical: '/ecosystem' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/ecosystem',
    siteName: teachlyBrand.name,
    title: 'Teachly Ecosystem — образовательные модули для бизнеса',
    description: teachlyBrand.description,
    locale: 'ru_RU',
    alternateLocale: ['en_US'],
  },
  twitter: { card: 'summary', title: teachlyBrand.name, description: teachlyBrand.description },
  verification: googleSiteVerification ? { google: googleSiteVerification } : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <script
          id="teachly-website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData.website) }}
        />
        <script
          id="teachly-organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData.organization) }}
        />
        {children}
      </body>
    </html>
  );
}
