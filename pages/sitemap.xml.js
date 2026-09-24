/* Dynamic sitemap — backend /api/public/sitemap ton URLs */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getServerSideProps({ res }) {
  let urls = [{ loc: '/', lastmod: null }];
  try {
    const r = await fetch(`${API}/api/public/sitemap`);
    const d = await r.json();
    urls = [{ loc: '/', lastmod: null }].concat(
      (d.posts || []).map((p) => ({ loc: `/article/${p.slug}`, lastmod: p.updated_at }))
    );
  } catch (e) {
    /* backend down — home hi sahi */
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${SITE}${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}<changefreq>${u.loc === '/' ? 'daily' : 'weekly'}</changefreq></url>`
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
