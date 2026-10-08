import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ssrGet, absMediaUrl, isBackendDown, markUnavailable } from '@/lib/api';
import Chrome from '@/components/site/Chrome';
import Comments from '@/components/reader/Comments';
import Footer from '@/components/site/Footer';
import Unavailable from '@/components/site/Unavailable';
import { ArtGhost, SectionHead, SocialLinks } from '@/components/site/bits';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
/* Publisher logo — public/logo.png (225×225 PNG), site da ikko-ik logo asset */
const LOGO = { url: `${SITE}/logo.png`, width: 225, height: 225 };
const boliClass = (b) => (b === 'Haryanvi' ? 'c-hv' : b === 'Bhojpuri' ? 'c-bj' : 'c-acc');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
/* Meta / JSON-LD layi ISO 8601; invalid ya khali → undefined (tag hi nahi bannda) */
const iso = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString() : undefined;
};

export async function getServerSideProps({ params, res }) {
  try {
    const data = await ssrGet(`/api/public/posts/${encodeURIComponent(params.slug)}`);
    return { props: { data } };
  } catch (e) {
    /* Backend down / 5xx → 503 (friendly page); asli 4xx (404 wagera) → 404 */
    if (isBackendDown(e)) {
      markUnavailable(res);
      return { props: { data: null } };
    }
    return { notFound: true };
  }
}

export default function Article({ data }) {
  const [active, setActive] = useState('');
  const [copied, setCopied] = useState(false);

  /* TOC scrollspy */
  useEffect(() => {
    if (!data || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
      { rootMargin: '-30% 0px -60% 0px' }
    );
    data.toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    if (data.toc[0]) setActive(data.toc[0].id);
    return () => io.disconnect();
  }, [data]);

  if (!data) {
    return <Unavailable>BACKEND SE DATA NAHI MILA — port 4000 te API chalao.</Unavailable>;
  }

  const { post, toc, related, latest, settings } = data;
  const url = `${SITE}/article/${post.slug}`;
  const title = post.seo_title || post.title;
  const desc = post.seo_description || post.dek;
  const authorName = post.author_name || post.author;
  const published = iso(post.published_at) || iso(post.updated_at);
  const modified = iso(post.updated_at) || iso(post.published_at);
  const img = post.image ? absMediaUrl(post.image) : null;
  const imgW = Number(post.image_width) || null;
  const imgH = Number(post.image_height) || null;
  const imgAlt = post.image_alt || post.title;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      /* clipboard blocked */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>{`${title} — ${settings.site_title}`}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content={settings.site_title} />
        {img ? <meta property="og:image" content={img} /> : null}
        {img && imgW ? <meta property="og:image:width" content={String(imgW)} /> : null}
        {img && imgH ? <meta property="og:image:height" content={String(imgH)} /> : null}
        {img ? <meta property="og:image:alt" content={imgAlt} /> : null}
        {published ? <meta property="article:published_time" content={published} /> : null}
        {modified ? <meta property="article:modified_time" content={modified} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        {img ? <meta name="twitter:image:alt" content={imgAlt} /> : null}
        {settings.twitter_handle ? <meta name="twitter:site" content={settings.twitter_handle} /> : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Article',
                  headline: post.title,
                  description: desc,
                  datePublished: published,
                  dateModified: modified,
                  mainEntityOfPage: url,
                  image: img
                    ? { '@type': 'ImageObject', url: img, width: imgW || undefined, height: imgH || undefined }
                    : undefined,
                  author: post.author_name
                    ? { '@type': 'Person', name: post.author_name }
                    : { '@type': 'Organization', name: post.author || settings.site_title, url: SITE },
                  publisher: {
                    '@type': 'Organization',
                    name: settings.site_title,
                    url: SITE,
                    logo: { '@type': 'ImageObject', ...LOGO },
                  },
                },
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Charcha', item: SITE },
                    { '@type': 'ListItem', position: 2, name: post.category || 'Stories', item: `${SITE}/#latest` },
                    { '@type': 'ListItem', position: 3, name: post.title, item: url },
                  ],
                },
              ],
            }),
          }}
        />
      </Head>

      <Chrome settings={settings} trending={[]} />

      <main id="main">
        <div className="wrap" id="top">
          <div className="ahead">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">Charcha</Link>
              <span aria-hidden="true">→</span>
              <Link href="/#latest">{post.category || 'Stories'}</Link>
              <span aria-hidden="true">→</span>
              <span className="here">{post.title.split(':')[0]}</span>
            </nav>
            <div className="chiprow">
              <span className="chip fill" style={{ fontSize: 10 }}>{(post.category || '').toUpperCase()}</span>
              <span className="chip quiet" style={{ fontSize: 10 }}>{(post.boli || '').toUpperCase()}</span>
            </div>
            <h1 className="display">{post.title.toUpperCase()}</h1>
            <p className="dek">{post.dek}</p>
            <div className="byline">
              <span className="avatar" aria-hidden="true">{(authorName || 'CD').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
              <span className="who">By <b>{authorName || 'Charcha Desk'}</b> · {fmtDate(post.published_at)} · {post.read_minutes} min read</span>
              <span className="vsep" aria-hidden="true" />
              <button className="mini" onClick={copyLink} aria-label="Copy link to this story" type="button">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M8 12 L12 8 M11 5 L13 3 A3.5 3.5 0 0 1 17 7 L15 9 M9 15 L7 17 A3.5 3.5 0 0 1 3 13 L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {copied ? <span className="copied">Link copied ✓</span> : null}
            </div>
          </div>

          {/* Mobile TOC accordion */}
          <details className="toc-mob">
            <summary>TABLE OF CONTENTS <span aria-hidden="true">▾</span></summary>
            <nav className="toc" aria-label="Table of contents (mobile)">
              {toc.map((t, i) => (
                <a key={t.id} href={`#${t.id}`}><span className="n">{String(i + 1).padStart(2, '0')}</span>{t.text.replace(/^\d+\s*·\s*/, '')}</a>
              ))}
            </nav>
          </details>

          <div className="layout">
            <aside className="sidebar" aria-label="Article tools">
              <div className="scard toc-card">
                <span className="shh">TABLE OF CONTENTS</span>
                <nav className="toc" aria-label="Table of contents">
                  {toc.map((t, i) => (
                    <a key={t.id} href={`#${t.id}`} className={active === t.id ? 'active' : ''}>
                      <span className="n">{String(i + 1).padStart(2, '0')}</span>
                      {t.text.replace(/^\d+\s*·\s*/, '')}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="scard">
                <span className="shh">SHARE THIS CHARCHA</span>
                <div className="sharegrid">
                  <SocialLinks socials={settings.socials || []} size={40} />
                </div>
              </div>
              <div className="scard watchcard">
                <span className="shh" style={{ color: 'var(--acc-text)' }}>ONLY ON CHAUPAL</span>
                <span className="wt">{post.title.split(':')[0]} — watch it on Chaupal.</span>
                <a className="btn" href={settings.watch_url} target="_blank" rel="noopener noreferrer">Watch on Chaupal →</a>
              </div>
            </aside>

            <article className="content">
              <figure className="figure">
                <ArtGhost className="heroimg" tone={post.art_tone} glyph={post.ghost_glyph} script={post.glyph_script} image={post.image} alt={post.image_alt || post.title} tag="HERO STILL · 16:9" />
                <figcaption className="cap">{post.image_alt || `A still from ${post.title.split(':')[0]}. Courtesy: Chaupal`}</figcaption>
              </figure>

              {/* Body — studio editor da HTML, DB ton */}
              <div className="postbody" dangerouslySetInnerHTML={{ __html: post.body }} />

              <div className="streamrow">
                <a className="btn" href={settings.watch_url} target="_blank" rel="noopener noreferrer" style={{ height: 48, padding: '0 24px', fontSize: 14 }}>
                  Stream on Chaupal →
                </a>
                <span className="note">{(post.boli || '').toUpperCase()} · Only on Chaupal</span>
              </div>

              {post.tags.length ? (
                <div className="tags">
                  <span className="th">RELATED TAGS</span>
                  {post.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              ) : null}

              <div className="author">
                <span className="avatar" aria-hidden="true">{(authorName || 'CD').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                <span>
                  <span className="an">{authorName || 'Charcha Desk'}</span>
                  <div className="ab">The editorial team behind Chaupal Te Charcha — stories, guides te full-on charcha from Chandigarh.</div>
                </span>
              </div>

              {/* Approved comments + reader-only form → moderation queue (dono client te load) */}
              <Comments slug={post.slug} />
            </article>
          </div>
        </div>

        <section className="section on-band">
          <div className="wrap">
            <SectionHead kicker="RELATED" title="KEEP THE CHARCHA GOING" />
            <div className="related">
              {related.map((p) => (
                <Link key={p.id} className="ocard" href={`/article/${p.slug}`}>
                  <ArtGhost className="rart" tone={p.art_tone} glyph={p.ghost_glyph} script={p.glyph_script} image={p.image} alt={p.image_alt || p.title} />
                  <span className={`sk ${boliClass(p.boli)}`}>{(p.boli || '').toUpperCase()}</span>
                  <span className="ot" style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <SectionHead kicker="MORE STORIES" title="LATEST FROM CHARCHA" />
            <div className="listrows">
              {latest.map((p) => (
                <Link key={p.id} className="lrow" href={`/article/${p.slug}`}>
                  <span className={`lk ${boliClass(p.boli)}`}>{(p.category || '').toUpperCase()}</span>
                  <span className="lt">{p.title}</span>
                  <span className="ld">{fmtDate(p.published_at)}</span>
                </Link>
              ))}
            </div>
            <Link className="seemore" href="/latest">See more stories →</Link>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
