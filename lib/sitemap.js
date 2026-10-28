/* Yoast-style sitemap helpers — shared by /sitemap_index.xml, /sitemap.xml, /post-sitemap.xml, /page-sitemap.xml */
import { API_INTERNAL as API, absMediaUrl, markUnavailable } from '@/lib/api';

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/* Static pages (pages/*.jsx) that exist as public routes */
const STATIC_PAGES = ['/latest', '/privacy-policy', '/terms-and-conditions', '/contact-us'];

export const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const iso = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString() : null;
};
const newest = (dates) => {
  const ts = dates.map((d) => (d ? new Date(d).getTime() : NaN)).filter((n) => !Number.isNaN(n));
  return ts.length ? new Date(Math.max(...ts)).toISOString() : null;
};

async function getJson(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

/* All live posts, newest first: slug, lastmod (updated date), image. Throws if the backend is unreachable */
export async function loadPosts() {
  const [map, first] = await Promise.all([getJson('/api/public/sitemap'), getJson('/api/public/posts?page=1&limit=24')]);
  const rest = await Promise.all(Array.from({ length: Math.max(0, (first.pages || 1) - 1) }, (_, i) => getJson(`/api/public/posts?page=${i + 2}&limit=24`)));
  const updated = new Map((map.posts || []).map((p) => [p.slug, p.updated_at]));
  const seen = new Set();
  const posts = [];
  [first, ...rest].forEach((pg) =>
    (pg.posts || []).forEach((p) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      posts.push({ slug: p.slug, title: p.title, lastmod: iso(updated.get(p.slug) || p.published_at), image: p.image ? absMediaUrl(p.image) : null, alt: p.image_alt || p.title });
    })
  );
  return posts;
}

export function postUrlset(posts) {
  const rows = posts.map(
    (p) =>
      `  <url>\n    <loc>${xmlEscape(`${SITE}/article/${p.slug}`)}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}${
        p.image ? `\n    <image:image>\n      <image:loc>${xmlEscape(p.image)}</image:loc>${p.alt ? `\n      <image:title>${xmlEscape(p.alt)}</image:title>` : ''}\n    </image:image>` : ''
      }\n  </url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows.join('\n')}\n</urlset>\n`;
}

/* Home and /latest change whenever a post goes live; the legal pages have no stored date, so no lastmod (never a fake one) */
export function pageEntries(posts) {
  const latest = newest(posts.map((p) => p.lastmod));
  return [{ loc: '/', lastmod: latest }, ...STATIC_PAGES.map((loc) => ({ loc, lastmod: loc === '/latest' ? latest : null }))];
}

export function pageUrlset(entries) {
  const rows = entries.map((e) => `  <url>\n    <loc>${xmlEscape(SITE + e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

/* category-sitemap is left out: the new site has no public category / boli-hub routes */
export function indexXml(posts) {
  const items = [
    { loc: '/post-sitemap.xml', lastmod: newest(posts.map((p) => p.lastmod)) },
    { loc: '/page-sitemap.xml', lastmod: newest(posts.map((p) => p.lastmod)) },
  ];
  const rows = items.map((i) => `  <sitemap>\n    <loc>${xmlEscape(SITE + i.loc)}</loc>${i.lastmod ? `\n    <lastmod>${i.lastmod}</lastmod>` : ''}\n  </sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</sitemapindex>\n`;
}

/* Runs a sitemap page's getServerSideProps: 503 (not an empty sitemap) when the backend is down */
export async function sendSitemap(res, build) {
  try {
    const xml = build(await loadPosts());
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.write(xml);
  } catch (e) {
    markUnavailable(res);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write('Sitemap temporarily unavailable');
  }
  res.end();
  return { props: {} };
}
