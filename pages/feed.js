/* RSS feed — same address as the old WordPress feed (/feed/), newest 20 stories */
import { ssrGet, absMediaUrl, markUnavailable } from '@/lib/api';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const xmlEscape = (s) =>
  String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const rfc822 = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toUTCString() : null;
};

export async function getServerSideProps({ res }) {
  const [home, list] = await Promise.allSettled([ssrGet('/api/public/home'), ssrGet('/api/public/posts?page=1&limit=20')]);

  /* No post list → 503, so feed readers retry instead of seeing an empty feed */
  if (list.status === 'rejected') {
    markUnavailable(res);
    res.end();
    return { props: {} };
  }

  const settings = (home.status === 'fulfilled' && home.value && home.value.settings) || {};
  const title = settings.site_title || 'Chaupal Te Charcha';
  const desc = settings.seo_home_description || settings.tagline || '';
  const posts = (list.value && list.value.posts) || [];
  const newest = rfc822(posts[0] && (posts[0].published_at || posts[0].updated_at));

  const items = posts
    .map((p) => {
      const url = `${SITE}/article/${p.slug}`;
      const date = rfc822(p.published_at || p.updated_at);
      const img = p.image ? absMediaUrl(p.image) : null;
      return `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>${date ? `\n      <pubDate>${date}</pubDate>` : ''}${p.category ? `\n      <category>${xmlEscape(p.category)}</category>` : ''}
      <description>${xmlEscape(p.dek || p.seo_description || '')}</description>${img ? `\n      <media:content url="${xmlEscape(img)}" medium="image" />` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(`${SITE}/`)}</link>
    <description>${xmlEscape(desc)}</description>
    <language>en-IN</language>${newest ? `\n    <lastBuildDate>${newest}</lastBuildDate>` : ''}
    <atom:link href="${xmlEscape(`${SITE}/feed`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Feed() { return null; }
