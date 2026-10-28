import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ssrGet, markUnavailable, withNav, absMediaUrl } from '@/lib/api';
import Chrome from '@/components/site/Chrome';
import Unavailable from '@/components/site/Unavailable';
import Footer from '@/components/site/Footer';
import { ArtGhost, SectionHead } from '@/components/site/bits';
import { HeroBanner, PostRail } from '@/components/site/Rails';
import { QuizWidget, PollWidget, NewsletterForm } from '@/components/site/PlayWidgets';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const boliClass = (b) => (b === 'Haryanvi' ? 'c-hv' : b === 'Bhojpuri' ? 'c-bj' : 'c-acc');
const fmtCal = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[dt.getDay()]} · ${months[dt.getMonth()]} ${dt.getDate()}`;
};

const RAIL_SIZE = 12;

export async function getServerSideProps({ res }) {
  try {
    /* 3 parallel calls first: home data, newest posts (hero + "Latest stories"), category / hub list */
    const [data, newest, tax] = await Promise.all([
      ssrGet('/api/public/home'),
      ssrGet(`/api/public/posts?page=1&limit=${RAIL_SIZE + 1}`),
      ssrGet('/api/public/taxonomy').catch(() => ({ bolis: [], categories: [] })),
    ]);
    /* API returns newest first (published/scheduled date); re-sort defensively */
    const when = (p) => new Date(p.published_at || 0).getTime();
    const all = (newest.posts || []).sort((a, b) => when(b) - when(a));
    const hero = all[0] || null;
    const rest = all.slice(1);

    const rails = [];
    if (rest.length) rails.push({ id: 'latest', title: 'Latest stories', posts: rest.slice(0, RAIL_SIZE), href: '/latest' });

    /* Then one row per category / boli hub that has posts, each its own call (in parallel) */
    const terms = [
      ...(tax.categories || []).filter((t) => t.post_count > 0).sort((a, b) => b.post_count - a.post_count).map((t) => ({ ...t, key: 'category', href: `/category/${t.slug}`, title: t.name })),
      ...(tax.bolis || []).filter((t) => t.post_count > 0).map((t) => ({ ...t, key: 'boli', href: `/boli/${t.slug}`, title: `${t.name} stories` })),
    ];
    const lists = await Promise.all(
      terms.map((t) => ssrGet(`/api/public/posts?${t.key}=${encodeURIComponent(t.slug)}&limit=${RAIL_SIZE + 1}`).catch(() => ({ posts: [] })))
    );
    terms.forEach((t, i) => {
      /* The hero is never repeated in a row */
      const posts = (lists[i].posts || []).filter((p) => !hero || p.id !== hero.id).slice(0, RAIL_SIZE);
      if (posts.length) rails.push({ id: `${t.key}-${t.slug}`, title: t.title, posts, href: t.href });
    });

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { data: { ...data, hero, rails, settings: withNav(data.settings, data) } } };
  } catch (e) {
    /* Any backend failure on home is temporary — never a 200 */
    markUnavailable(res);
    return { props: { data: null } };
  }
}

export default function Home({ data }) {
  const [mood, setMood] = useState(null);

  /* Backend down / not seeded → no content on the frontend (all data comes from the API) */
  if (!data) {
    return <Unavailable>BACKEND SE DATA NAHI MILA — port 4000 te API chalao te `npm run seed` kar lo.</Unavailable>;
  }

  const { settings, trending, hero, rails, top10, moods, picks, hubs, videos, titleHub, sessions, calendar, quiz, poll } = data;
  const shownPicks = mood ? picks.filter((p) => p.mood === mood) : picks;
  const title = settings.seo_home_title || `${settings.site_title} — ${settings.tagline}`;
  const desc = settings.seo_home_description || settings.tagline;
  /* Share preview (WhatsApp / Facebook / X): the featured story's image, otherwise the logo */
  const shareImg = hero && hero.image ? absMediaUrl(hero.image) : `${SITE}/logo.png`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${SITE}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={`${SITE}/`} />
        <meta property="og:site_name" content={settings.site_title} />
        <meta property="og:image" content={shareImg} />        <meta name="twitter:card" content="summary_large_image" />
        {settings.twitter_handle ? <meta name="twitter:site" content={settings.twitter_handle} /> : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                { '@type': 'Organization', name: 'Chaupal', url: 'https://www.chaupal.com', sameAs: (settings.socials || []).map((s) => s.url) },
                { '@type': 'WebSite', name: settings.site_title, url: SITE },
              ],
            }),
          }}
        />
      </Head>

      <Chrome settings={settings} trending={trending} />

      <main id="main">
        {/* HERO — always the newest live post */}
        {hero ? <HeroBanner post={hero} settings={settings} /> : <h1 className="sr-only">{settings.site_title}</h1>}

        {/* RAILS */}
        {rails.length ? (
          <div className="rails wrap">
            {rails.map((r) => (
              <PostRail key={r.id} id={r.id} title={r.title} posts={r.posts} href={r.href} />
            ))}
          </div>
        ) : null}

        {/* TOP 10 */}
        {top10.length ? (
          <section className="section" id="top10">
            <div className="wrap">
              <SectionHead kicker="CHARTS · ALL THREE BOLIS" title="TOP 10 ON CHAUPAL THIS WEEK" hint tight />
              <div className="rail" style={{ marginTop: 26 }}>
                {top10.map((t, i) => (
                  <a key={t.rank_no} className="ocard rankcard" href={t.link || settings.watch_url} target="_blank" rel="noopener noreferrer">
                    <ArtGhost tone={t.tone} glyph={t.glyph} script={t.glyph_script} ghostStyle={{ top: '36%' }} tag={i === 0 ? 'POSTER 2:3' : undefined}>
                      <span className="rank" aria-hidden="true">{t.rank_no}</span>
                      {i === top10.length - 1 ? <span className="viewall">View all 10 →</span> : null}
                    </ArtGhost>
                    <span className="otext">
                      <span className="ot">{t.title}</span>
                      <span className="om">{t.boli}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* WHAT TO WATCH */}
        {picks.length ? (
          <section className="section" id="watch">
            <div className="wrap">
              <SectionHead kicker="WHAT TO WATCH" title={'TONIGHT\u2019S PICKS, SORTED BY MOOD'} hint tight />
              <div className="moods" role="group" aria-label="Mood filters">
                {moods.map((m) => (
                  <button key={m} className={`pill${mood === m ? ' active' : ''}`} type="button" onClick={() => setMood(mood === m ? null : m)}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="picks">
                {shownPicks.map((p) => (
                  <div key={p.title} className="ocard pick">
                    <ArtGhost tone={p.tone} glyph={p.glyph} script={p.glyph_script} />
                    <span className="otext">
                      <span className="ot">{p.title}</span>
                      <span className="why">{p.why}</span>
                      <a className="go" href={p.link} target="_blank" rel="noopener noreferrer">Watch on Chaupal →</a>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* BOLI HUBS */}
        {hubs.length ? (
          <section className="section on-band" id="boli">
            <div className="wrap">
              <SectionHead kicker="PICK YOUR BOLI" title="THREE LANGUAGES. ONE CHAUPAL." />
              <div className="hubs">
                {hubs.map((h, i) => {
                  const glyphs = { punjabi: 'ਪ', haryanvi: 'ह', bhojpuri: 'भ' };
                  const colors = ['var(--acc)', 'var(--hv)', 'var(--bj)'];
                  const texts = ['c-acc', 'c-hv', 'c-bj'];
                  return (
                    <Link key={h.slug} className={`hub hubtone-${i + 1}`} href={`/boli/${h.slug}`}>
                      <span className={`bigglyph ${i === 0 ? 'glyph-gurmukhi' : 'glyph-devanagari'}`} aria-hidden="true" style={{ color: colors[i], opacity: i === 0 ? 0.16 : 0.18 }}>
                        {glyphs[h.slug] || 'ਚ'}
                      </span>
                      <span className="hubtext">
                        <h3 className="display">{h.name.toUpperCase()}</h3>
                        <p>{h.post_count} stories te counting — {h.name} di apni chaupal.</p>
                        <span className={`go ${texts[i]}`} style={{ fontWeight: 800, fontSize: 13 }}>Enter hub →</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* TRAILERS */}
        {videos.length ? (
          <section className="section" id="trailers">
            <div className="wrap">
              <SectionHead kicker="WATCH" title="TRAILERS & FIRST LOOKS" hint tight />
              <div className="vids" style={{ marginTop: 26 }}>
                {videos.map((v) => (
                  <a key={v.title} className="ocard vid" href={settings.watch_url} target="_blank" rel="noopener noreferrer">
                    <ArtGhost tone={v.tone} glyph={v.glyph} script={v.glyph_script}>
                      <span className="playbadge" aria-hidden="true">
                        <svg width="19" height="19" viewBox="0 0 14 14"><path d="M3 1.5 L12 7 L3 12.5 Z" fill="currentColor" /></svg>
                      </span>
                      <span className="dur">{v.duration}</span>
                    </ArtGhost>
                    <span className="otext">
                      <span className="ot">{v.title}</span>
                      <span className="om">{v.kind}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* TITLE HUB */}
        {titleHub ? (
          <section className="section on-band2" aria-label={`Title hub: ${titleHub.title}`}>
            <div className="wrap">
              <div className="hubband">
                <ArtGhost className="poster" tone={titleHub.tone} glyph={titleHub.glyph} script={titleHub.script} tag="POSTER 2:3" />
                <div className="hb">
                  <span><span className="chip">{titleHub.kicker}</span></span>
                  <h2 className="display">{titleHub.title}</h2>
                  <p>{titleHub.blurb}</p>
                  <div className="tabs">
                    <Link className="pill" href="/latest">News</Link>
                    {videos.length ? <Link className="pill" href="#trailers">Trailer</Link> : null}
                    <Link className="pill" href={`/article/${titleHub.article_slug}`}>Episode guide</Link>
                    <a className="pill active" href={titleHub.watch_link} target="_blank" rel="noopener noreferrer">Watch now</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* QUIZ + POLL */}
        {quiz || poll ? (
          <section className="section" id="play">
            <div className="wrap">
              <SectionHead kicker="PLAY" title="QUIZZES TE POLLS" />
              <div className="play-grid">
                <QuizWidget quiz={quiz} />
                <PollWidget poll={poll} />
              </div>
            </div>
          </section>
        ) : null}

        {/* CHARCHA SESSIONS */}
        {sessions.length ? (
          <section className="section on-band" id="sessions">
            <div className="wrap">
              <SectionHead kicker="CHARCHA SESSIONS" title="INTERVIEWS & BEHIND THE SCENES" hint tight />
              <div className="vids" style={{ marginTop: 26 }}>
                {sessions.map((s) => (
                  <a key={s.title} className="ocard bts" href="/latest">
                    <span className={`art hubtone-${s.tone}`}>
                      <span className="ghost" aria-hidden="true">{s.glyph_text.split(' ').slice(0, 2).join(' ')}<br />{s.glyph_text.split(' ').slice(2).join(' ')}</span>
                    </span>
                    <span className="otext">
                      <span className="ot">{s.title}</span>
                      <span className="om">{s.meta}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* CALENDAR */}
        {calendar.length ? (
          <section className="section" id="calendar">
            <div className="wrap">
              <SectionHead kicker="CALENDAR" title="NEW ON CHAUPAL — EVERY FRIDAY" hint tight />
              <div className="rail" style={{ marginTop: 24 }}>
                {calendar.map((c, i) =>
                  c.is_tba ? (
                    <div key={i} className="calcard tba">
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--acc-text)' }}>{c.title}</div>
                      <div className="smallnote">{c.kind}</div>
                    </div>
                  ) : (
                    <div key={i} className={`calcard${i === 0 ? ' now' : ''}`}>
                      <div>
                        <div className={`caldate ${c.boli === 'hv' ? 'c-hv' : c.boli === 'bj' ? 'c-bj' : 'c-acc'}`}>{fmtCal(c.release_date)}</div>
                        <div className="display caltitle">{c.title}</div>
                      </div>
                      <div className="calmeta">{c.kind}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* NEWSLETTER */}
        <section className="newsletter" aria-label="Newsletter">
          <div className="wrap">
            <div>
              <span className="rule" aria-hidden="true" style={{ display: 'block', marginBottom: 10 }} />
              <h2 className="display">CHITTHI FROM THE CHAUPAL</h2>
              <p>Hafte di sab ton vaddi entertainment news, sidha tuhade inbox vich. No spam, sirf charcha.</p>
            </div>
            <NewsletterForm />
          </div>
        </section>
      </main>

      <Footer settings={settings} />
    </>
  );
}
