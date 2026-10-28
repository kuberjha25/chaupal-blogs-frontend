import Head from 'next/head';
import Link from 'next/link';
import Chrome from './Chrome';
import Footer from './Footer';
import Unavailable from './Unavailable';
import { PostCard } from './Rails';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/* A category or boli hub archive — same card grid and pager as /latest */
export default function TermPage({ data }) {
  if (!data) return <Unavailable>COULD NOT LOAD DATA FROM THE BACKEND — please try again in a little while.</Unavailable>;

  const { kind, term, settings, posts, page, pages, total } = data;
  const base = `${kind === 'boli' ? '/boli' : '/category'}/${term.slug}`;
  const pageHref = (n) => (n <= 1 ? base : `${base}?page=${n}`);
  const siteTitle = settings.site_title || 'Chaupal Te Charcha';
  const label = kind === 'boli' ? `${term.name} stories` : term.name;
  const title = `${label}${page > 1 ? ` (page ${page})` : ''} — ${siteTitle}`;
  const desc = `${label} — latest stories, guides te charcha from ${siteTitle}${page > 1 ? ` — page ${page} of ${pages}` : ''}.`;
  const canonical = `${SITE}${pageHref(page)}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        {!posts.length ? <meta name="robots" content="noindex, follow" /> : null}
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
              <span className="kicker">{`${kind === 'boli' ? 'BOLI HUB' : 'CATEGORY'} · ${total} ${total === 1 ? 'STORY' : 'STORIES'}${pages > 1 ? ` · PAGE ${page} OF ${pages}` : ''}`}</span>
              <h1 className="display">{term.name.toUpperCase()}</h1>
            </div>

            {posts.length ? (
              <div className="archive-grid">
                {posts.map((p) => <PostCard key={p.id || p.slug} post={p} />)}
              </div>
            ) : (
              <p className="loading">No stories are live in this section yet — coming soon. <Link href="/latest">See the latest stories →</Link></p>
            )}

            {pages > 1 ? (
              <nav className="pager" aria-label="Pagination">
                {page > 1 ? <Link className="btn btn-ghost" href={pageHref(page - 1)} rel="prev">← Newer stories</Link> : <span />}
                <span className="pinfo">Page {page} of {pages}</span>
                {page < pages ? <Link className="btn btn-ghost" href={pageHref(page + 1)} rel="next">Older stories →</Link> : <span />}
              </nav>
            ) : null}
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
