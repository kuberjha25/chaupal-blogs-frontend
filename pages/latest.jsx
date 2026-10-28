/* Archive — all live posts, newest first, 12 per page (?page=N) */
import Head from 'next/head';
import Link from 'next/link';
import { ssrGet, isBackendDown, markUnavailable, withNav } from '@/lib/api';
import Chrome from '@/components/site/Chrome';
import Footer from '@/components/site/Footer';
import Unavailable from '@/components/site/Unavailable';
import { PostCard } from '@/components/site/Rails';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PER_PAGE = 12;
const pageHref = (n) => (n <= 1 ? '/latest' : `/latest?page=${n}`);

export async function getServerSideProps({ query, res }) {
  const raw = query.page;
  let page = 1;
  if (raw !== undefined) {
    if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) < 1) return { notFound: true };
    page = Number(raw);
    /* Avoid a duplicate URL for ?page=1 */
    if (page === 1) return { redirect: { destination: '/latest', statusCode: 301 } };
  }

  const [home, list] = await Promise.allSettled([
    ssrGet('/api/public/home'),
    ssrGet(`/api/public/posts?page=${page}&limit=${PER_PAGE}`),
  ]);

  if (list.status === 'rejected') {
    if (isBackendDown(list.reason)) {
      markUnavailable(res);
      return { props: { data: null } };
    }
    return { notFound: true };
  }

  const { posts = [], pages = 1, total = 0 } = list.value || {};
  if (page > 1 && page > pages) return { notFound: true };

  const settings = home.status === 'fulfilled' && home.value ? withNav(home.value.settings, home.value) : {};
  return { props: { data: { settings, posts, page, pages: Math.max(1, pages), total } } };
}

export default function Latest({ data }) {
  if (!data) return <Unavailable>COULD NOT LOAD DATA FROM THE BACKEND — please try again in a little while.</Unavailable>;

  const { settings, posts, page, pages, total } = data;
  const siteTitle = settings.site_title || 'Chaupal Te Charcha';
  const title = page > 1 ? `Latest stories (page ${page}) — ${siteTitle}` : `Latest stories — ${siteTitle}`;
  const desc = `All the latest stories, guides te charcha from ${siteTitle}${page > 1 ? ` — page ${page} of ${pages}` : ''}.`;
  const canonical = `${SITE}${pageHref(page)}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        {page > 1 ? <link rel="prev" href={`${SITE}${pageHref(page - 1)}`} /> : null}
        {page < pages ? <link rel="next" href={`${SITE}${pageHref(page + 1)}`} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonical} />
        {settings.site_title ? <meta property="og:site_name" content={settings.site_title} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        {settings.twitter_handle ? <meta name="twitter:site" content={settings.twitter_handle} /> : null}
      </Head>

      <Chrome settings={settings} />

      <main id="main">
        <section className="section archive" id="top">
          <div className="wrap">
            <div className="shead">
              <span className="rule" aria-hidden="true" />
              <span className="kicker">{`ARCHIVE · ${total} ${total === 1 ? 'STORY' : 'STORIES'}${pages > 1 ? ` · PAGE ${page} OF ${pages}` : ''}`}</span>
              <h1 className="display">LATEST STORIES</h1>
            </div>

            {posts.length ? (
              <div className="archive-grid">
                {posts.map((p) => (
                  <PostCard key={p.id || p.slug} post={p} />
                ))}
              </div>
            ) : (
              <p className="loading">No stories are live yet — coming soon.</p>
            )}

            {pages > 1 ? (
              <nav className="pager" aria-label="Pagination">
                {page > 1 ? (
                  <Link className="btn btn-ghost" href={pageHref(page - 1)} rel="prev">← Newer stories</Link>
                ) : <span />}
                <span className="pinfo">Page {page} of {pages}</span>
                {page < pages ? (
                  <Link className="btn btn-ghost" href={pageHref(page + 1)} rel="next">Older stories →</Link>
                ) : <span />}
              </nav>
            ) : null}
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
