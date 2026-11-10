import { siteUrl } from './site';

export const teachlyBrand = {
  name: 'Teachly Ecosystem',
  alternateNames: ['Teachly', 'Teachly educational ecosystem'],
  description: 'Образовательные модули для существующих LMS, онлайн-школ и EdTech-продуктов: задания, тренажёр и прогресс через согласованную интеграцию.',
} as const;

export function structuredDataForSite(baseUrl: URL = siteUrl) {
  const homeUrl = new URL('/', baseUrl).toString();
  const websiteId = new URL('/#website', baseUrl).toString();
  const organizationId = new URL('/#organization', baseUrl).toString();

  return {
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': websiteId,
      name: teachlyBrand.name,
      alternateName: teachlyBrand.alternateNames,
      url: homeUrl,
      inLanguage: ['ru', 'en'],
      publisher: { '@id': organizationId },
    },
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Teachly',
      alternateName: teachlyBrand.name,
      description: teachlyBrand.description,
      url: homeUrl,
      sameAs: ['https://github.com/AlekseyBulgarin/Teachly-2.0'],
    },
  } as const;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
