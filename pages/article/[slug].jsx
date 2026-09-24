import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ssrGet, api, mediaUrl } from '@/lib/api';
import Chrome from '@/components/site/Chrome';
import Footer from '@/components/site/Footer';
import { ArtGhost, SectionHead, SocialLinks } from '@/components/site/bits';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const boliClass = (b) => (b === 'Haryanvi' ? 'c-hv' : b === 'Bhojpuri' ? 'c-bj' : 'c-acc');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export async function getServerSideProps({ params }) {
  try {
    const data = await ssrGet(`/api/public/posts/${params.slug}`);
    return { props: { data } };
  } catch (e) {
    if (String(e.message).includes('404')) return { notFound: true };
    return { props: { data: null } };
  }
}

export default function Article({ data }) {
  const [active, setActive] = useState('');
  const [copied, setCopied] = useState(false);
  const [cName, setCName] = useState('');
  const [cBody, setCBody] = useState('');
  const [cOk, setCOk] = useState(false);

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
    return (
      <main className="loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        BACKEND SE DATA NAHI MILA — port 4000 te API chalao.
      </main>
    );
  }

  const { post, toc, related, latest, settings } = data;
  const url = `${SITE}/article/${post.slug}`;
  const title = post.seo_title || post.title;
  const desc = post.seo_description || post.dek;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      /* clipboard blocked */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/public/posts/${post.slug}/comments`, { name: cName, body: cBody });
      setCOk(true);
      setCName('');
      setCBody('');
    } catch (err) {
      /* ignore in demo */
    }
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
        {post.image ? <meta property="og:image" content={mediaUrl(post.image)} /> : null}
        <meta property="article:published_time" content={post.published_at || ''} />
        <meta name="twitter:card" content="summary_large_image" />
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
                  datePublished: post.published_at,
                  dateModified: post.updated_at,
                  mainEntityOfPage: url,
                  image: post.image ? [mediaUrl(post.image)] : undefined,
                  author: { '@type': 'Organization', name: post.author || 'Charcha Desk' },
                  publisher: { '@type': 'Organization', name: settings.site_title },
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

      <main id="top">
        <div className="wrap">
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
              <span className="avatar" aria-hidden="true">{(post.author || 'CD').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
              <span className="who">By <b>{post.author || 'Charcha Desk'}</b> · {fmtDate(post.published_at)} · {post.read_minutes} min read</span>
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
                <span className="avatar" aria-hidden="true">{(post.author || 'CD').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                <span>
                  <span className="an">{post.author || 'Charcha Desk'}</span>
                  <div className="ab">The editorial team behind Chaupal Te Charcha — stories, guides te full-on charcha from Chandigarh.</div>
                </span>
              </div>

              {/* Comment form → moderation queue */}
              <div className="scard">
                <span className="shh">CHARCHA KARO — COMMENT CHHADO</span>
                {cOk ? (
                  <span className="nl-ok">Shukriya! Comment review ton baad live hovega.</span>
                ) : (
                  <form onSubmit={submitComment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="field"><label htmlFor="cname">NAAM</label><input id="cname" value={cName} onChange={(e) => setCName(e.target.value)} required maxLength={80} /></div>
                    <div className="field"><label htmlFor="cbody">COMMENT</label><textarea id="cbody" rows={3} value={cBody} onChange={(e) => setCBody(e.target.value)} required maxLength={2000} /></div>
                    <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }}>Post comment</button>
                  </form>
                )}
              </div>
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
            <Link className="seemore" href="/#latest">See more stories →</Link>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
