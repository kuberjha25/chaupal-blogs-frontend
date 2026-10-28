/* Shared server logic for the category (/category/<slug>) and boli hub (/boli/<slug>) pages */
import { ssrGet, isBackendDown, markUnavailable, withNav } from '@/lib/api';

export const TERM_PER_PAGE = 12;

export function termGSSP(kind) {
  const base = kind === 'boli' ? '/boli' : '/category';
  return async function getServerSideProps({ params, query, res }) {
    const slug = String(params.slug || '').toLowerCase();
    const raw = query.page;
    let page = 1;
    if (raw !== undefined) {
      if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) < 1) return { notFound: true };
      page = Number(raw);
      if (page === 1) return { redirect: { destination: `${base}/${slug}`, statusCode: 301 } };
    }

    try {
      const [tax, home] = await Promise.all([
        ssrGet('/api/public/taxonomy'),
        ssrGet('/api/public/home').catch(() => null),
      ]);
      const term = ((kind === 'boli' ? tax.bolis : tax.categories) || []).find((t) => t.slug === slug);
      if (!term) {
        /* Not a real category — an old WordPress URL may still have a redirect row */
        if (kind === 'category') {
          const r = await ssrGet(`/api/public/redirect?path=${encodeURIComponent(`${base}/${slug}`)}`).catch(() => null);
          if (r && r.found && r.to) return { redirect: { destination: r.to, statusCode: r.code === 302 ? 302 : 301 } };
        }
        return { notFound: true };
      }
      const list = await ssrGet(`/api/public/posts?${kind}=${encodeURIComponent(slug)}&page=${page}&limit=${TERM_PER_PAGE}`);
      const { posts = [], pages = 1, total = 0 } = list || {};
      if (page > 1 && page > pages) return { notFound: true };

      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      const settings = home ? withNav(home.settings, home) : {};
      return { props: { data: { kind, term: { name: term.name, slug: term.slug }, settings, posts, page, pages: Math.max(1, pages), total } } };
    } catch (e) {
      if (isBackendDown(e)) {
        markUnavailable(res);
        return { props: { data: null } };
      }
      return { notFound: true };
    }
  };
}
