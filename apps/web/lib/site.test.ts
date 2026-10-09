import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeJsonLd, structuredDataForSite } from './seo';
import { metadataForShowcaseRoute, showcaseMetadataCatalog, showcaseRoutes, siteUrl } from './site';

test('every Showcase route has unique complete metadata', () => {
  const catalogRoutes = Object.keys(showcaseMetadataCatalog);
  assert.deepEqual(catalogRoutes.toSorted(), [...showcaseRoutes].toSorted());

  const titles = new Set<string>();
  for (const route of showcaseRoutes) {
    const definition = showcaseMetadataCatalog[route];
    assert.ok(definition.title.length >= 12, `${route} needs a useful title`);
    assert.ok(definition.description.length >= 50, `${route} needs a useful description`);
    assert.ok(!titles.has(definition.title), `${route} repeats the title ${definition.title}`);
    titles.add(definition.title);

    const metadata = metadataForShowcaseRoute(route);
    if (route === '/ecosystem') assert.deepEqual(metadata.title, { absolute: definition.title });
    else assert.equal(metadata.title, definition.title);
    assert.equal(metadata.description, definition.description);
    assert.equal(metadata.alternates?.canonical, route);
    assert.equal(metadata.openGraph?.url, route);
    assert.equal(metadata.twitter?.title, definition.title);
  }
});

test('brand structured data uses the canonical origin and safe JSON-LD serialization', () => {
  const canonicalOrigin = new URL('https://teachly.example');
  const { website, organization } = structuredDataForSite(canonicalOrigin);

  assert.equal(website.name, 'Teachly Ecosystem');
  assert.deepEqual(website.alternateName, ['Teachly', 'Teachly educational ecosystem']);
  assert.equal(website.url, 'https://teachly.example/');
  assert.equal(organization.name, 'Teachly');
  assert.equal(organization.url, website.url);
  assert.equal(website.publisher['@id'], organization['@id']);
  assert.equal(serializeJsonLd({ value: '</script>' }), '{"value":"\\u003c/script>"}');
});

test('sitemap route sources resolve to absolute same-origin URLs', () => {
  const urls = showcaseRoutes.map((route) => new URL(route, siteUrl));
  assert.equal(new Set(urls.map((url) => url.toString())).size, showcaseRoutes.length);
  for (const url of urls) assert.equal(url.origin, siteUrl.origin);
});
