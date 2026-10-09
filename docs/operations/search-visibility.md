# Teachly search visibility

Technical SEO makes Teachly crawlable and understandable, but no implementation can guarantee a particular Google position. The brand query `Teachly` is already contested by established products, so the operational steps below are part of the release, not optional marketing polish.

## Implemented baseline

- Every public Showcase route has a unique title, description and canonical URL.
- The homepage identifies the site as `Teachly Ecosystem`, with `Teachly` as an alternative name, through `WebSite` and `Organization` JSON-LD.
- `/` permanently redirects to the canonical Showcase homepage at `/ecosystem`.
- `robots.txt` allows the public site, excludes API and operator routes, and references the absolute sitemap.
- `sitemap.xml` contains only canonical public Showcase URLs.
- `GOOGLE_SITE_VERIFICATION` can add the Search Console verification meta tag without a code change.

## Production activation

1. Choose and attach a stable custom domain that contains or clearly represents the Teachly brand. Do not treat the generated `vercel.app` hostname as the permanent public identity.
2. Set `TEACHLY_SITE_URL` to that HTTPS origin in Vercel and redeploy. Verify canonical, Open Graph, JSON-LD, robots and sitemap URLs all use the custom origin.
3. Create a Google Search Console Domain property and complete DNS verification. If URL-prefix verification is used instead, set `GOOGLE_SITE_VERIFICATION` to the issued content value and redeploy.
4. Submit `/sitemap.xml` in Search Console and inspect the homepage plus the highest-value product pages (`/ecosystem`, `/ai`, `/analytics`, `/teacher`, `/integrations`). Request indexing once after validation.
5. Monitor indexed pages, canonical selection, crawl failures, branded impressions and click-through rate. Repeated indexing requests do not accelerate crawling.
6. Publish useful, verifiable material under the same domain: integration guides, pilot outcomes, product comparisons and implementation examples. Earn relevant references from partner and customer sites; do not manufacture links or doorway pages.

## Release verification

```text
GET /                         -> 308 /ecosystem
GET /robots.txt               -> public allow rules + absolute sitemap
GET /sitemap.xml              -> canonical production URLs only
GET /ecosystem                -> index,follow + canonical + unique title/description
script#teachly-website-schema -> valid WebSite JSON-LD
script#teachly-organization-schema -> valid Organization JSON-LD
```

Validate JSON-LD with Schema.org Validator and inspect the rendered URL in Search Console. Google documents that crawling and re-indexing can take from several days to several weeks.

## Primary references

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Site names in Google Search](https://developers.google.com/search/docs/appearance/site-names)
- [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Ask Google to recrawl URLs](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
