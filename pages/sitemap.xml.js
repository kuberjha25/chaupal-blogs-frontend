/* Dynamic sitemap — backend /api/public/sitemap ton URLs */
import { API_INTERNAL as API } from '@/lib/api';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/* Static pages (pages/*.jsx) — backend down hove taan vi sitemap vich */
const STATIC_PAGES = ['/latest', '/privacy-policy', '/terms-and-conditions', '/contact-us'];

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function getServerSideProps({ res }) {
  const base = [{ loc: '/', lastmod: null }].concat(STATIC_PAGES.map((loc) => ({ loc, lastmod: null })));
  let urls = base;
  try {
    const r = await fetch(`${API}/api/public/sitemap`);
    const d = await r.json();
    urls = base.concat(
      (d.posts || []).map((p) => ({ loc: `/article/${p.slug}`, lastmod: p.updated_at }))
    );
  } catch (e) {
    /* backend down — home te static pages hi sahi */
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${xmlEscape(SITE + u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}<changefreq>${u.loc === '/' || u.loc === '/latest' ? 'daily' : 'weekly'}</changefreq></url>`
  )
  .join('\n')}
</urlset>`;
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }
