import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ssrGet } from '@/lib/api';
import Chrome from '@/components/site/Chrome';
import Footer from '@/components/site/Footer';
import { ArtGhost, SectionHead, Phulkari } from '@/components/site/bits';
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

export async function getServerSideProps() {
  try {
    const data = await ssrGet('/api/public/home');
    return { props: { data } };
  } catch (e) {
    return { props: { data: null } };
  }
}

export default function Home({ data }) {
  const [mood, setMood] = useState(null);

  /* Backend down / seed nahi hua → frontend te koi content nahi (sab data API ton aanda) */
  if (!data) {
    return (
      <main className="loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        BACKEND SE DATA NAHI MILA — port 4000 te API chalao te `npm run seed` kar lo.
      </main>
    );
  }

  const { settings, trending, hero, top10, latest, moods, picks, hubs, videos, titleHub, sessions, calendar, quiz, poll } = data;
  const shownPicks = mood ? picks.filter((p) => p.mood === mood) : picks;
  const title = settings.seo_home_title || `${settings.site_title} — ${settings.tagline}`;
  const desc = settings.seo_home_description || settings.tagline;

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
        <meta name="twitter:card" content="summary_large_image" />
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
        {/* HERO */}
        {hero ? (
          <section className="hero tone-1" id="top" aria-label="Featured story">
            <div className="hero-shell">
              <ArtGhost className="hero-art" tone={hero.art_tone} glyph={hero.ghost_glyph} script={hero.glyph_script} image={hero.image} alt={hero.image_alt || hero.title} tag="KEY ART · FULL BLEED 16:9" />
              <div className="hero-panel">
                <div className="chiprow">
                  <span className="chip">{(hero.category || '').toUpperCase()}</span>
                  <span className="chip quiet">{(hero.boli || '').toUpperCase()}</span>
                </div>
                <h1 className="display">{hero.title.split(':')[0].toUpperCase()}</h1>
                <p className="dek">{hero.dek}</p>
                <div className="meta">{`${(hero.boli || '').toUpperCase()} · ${hero.read_minutes} MIN READ`}</div>
                <div className="hero-ctas">
                  <Link className="btn btn-lg" href={`/article/${hero.slug}`}>Read the full breakdown →</Link>
                  <a className="btn btn-lg btn-ghost" href={settings.watch_url} target="_blank" rel="noopener noreferrer">
                    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1.5 L12.5 7 L2 12.5 Z" fill="currentColor" /></svg>
                    Watch on Chaupal
                  </a>
                </div>
              </div>
              <Phulkari up style={{ position: 'absolute', left: 0, bottom: 0 }} />
            </div>
          </section>
        ) : null}

        {/* TOP 10 */}
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

        {/* LATEST */}
        <section className="section on-band" id="latest">
          <div className="wrap">
            <SectionHead kicker="LATEST" title="FRESH FROM THE CHARCHA DESK" />
            <div className="latest-grid">
              {latest.feature ? (
                <Link className="ocard feature" href={`/article/${latest.feature.slug}`}>
                  <ArtGhost tone={latest.feature.art_tone} glyph={latest.feature.ghost_glyph} script={latest.feature.glyph_script} image={latest.feature.image} alt={latest.feature.image_alt || latest.feature.title} tag="STILL 16:9" />
                  <span className="otext">
                    <span><span className="chip fill" style={{ fontSize: 10 }}>{(latest.feature.category || '').toUpperCase()}</span></span>
                    <span className="ot">{latest.feature.title}</span>
                    <span className="om">{`${(latest.feature.boli || '').toUpperCase()} · ${latest.feature.read_minutes} MIN READ`}</span>
                  </span>
                </Link>
              ) : null}
              <div className="sidelist">
                {latest.side.map((p) => (
                  <Link key={p.id} className="srow" href={`/article/${p.slug}`}>
                    <ArtGhost className="thumb" tone={p.art_tone} glyph={p.ghost_glyph} script={p.glyph_script} image={p.image} alt={p.image_alt || p.title} />
                    <span className="st">
                      <span className={`sk ${boliClass(p.boli)}`}>{(p.boli || p.category || '').toUpperCase()}</span>
                      <span className="sh">{p.title}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="latest-row">
              {latest.row[0] ? (
                <Link className="ocard" href={`/article/${latest.row[0].slug}`}>
                  <ArtGhost tone={latest.row[0].art_tone} glyph={latest.row[0].ghost_glyph} script={latest.row[0].glyph_script} image={latest.row[0].image} alt={latest.row[0].title} />
                  <span className="otext">
                    <span className="sk c-acc">{(latest.row[0].category || '').toUpperCase()}</span>
                    <span className="ot">{latest.row[0].title}</span>
                  </span>
                </Link>
              ) : null}
              <a className="ocard" href="#play">
                <span className="art qcard"><span className="qword">QUIZ TIME</span></span>
                <span className="otext">
                  <span className="sk c-acc">QUIZ</span>
                  <span className="ot">{quiz ? quiz.title : 'Kaunsi Chaupal film hai tuhadi weekend match?'}</span>
                </span>
              </a>
              {latest.row[1] ? (
                <Link className="ocard" href={`/article/${latest.row[1].slug}`}>
                  <ArtGhost tone={latest.row[1].art_tone} glyph={latest.row[1].ghost_glyph} script={latest.row[1].glyph_script} image={latest.row[1].image} alt={latest.row[1].title} />
                  <span className="otext">
                    <span className="sk c-acc">{(latest.row[1].category || '').toUpperCase()}</span>
                    <span className="ot">{latest.row[1].title}</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {/* WHAT TO WATCH */}
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

        {/* BOLI HUBS */}
        <section className="section on-band" id="boli">
          <div className="wrap">
            <SectionHead kicker="PICK YOUR BOLI" title="THREE LANGUAGES. ONE CHAUPAL." />
            <div className="hubs">
              {hubs.map((h, i) => {
                const glyphs = { punjabi: 'ਪ', haryanvi: 'ह', bhojpuri: 'भ' };
                const colors = ['var(--acc)', 'var(--hv)', 'var(--bj)'];
                const texts = ['c-acc', 'c-hv', 'c-bj'];
                return (
                  <a key={h.slug} className={`hub hubtone-${i + 1}`} href="#latest">
                    <span className={`bigglyph ${i === 0 ? 'glyph-gurmukhi' : 'glyph-devanagari'}`} aria-hidden="true" style={{ color: colors[i], opacity: i === 0 ? 0.16 : 0.18 }}>
                      {glyphs[h.slug] || 'ਚ'}
                    </span>
                    <span className="hubtext">
                      <h3 className="display">{h.name.toUpperCase()}</h3>
                      <p>{h.post_count} stories te counting — {h.name} di apni chaupal.</p>
                      <span className={`go ${texts[i]}`} style={{ fontWeight: 800, fontSize: 13 }}>Enter hub →</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* TRAILERS */}
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
                    <Link className="pill" href="#latest">News</Link>
                    <Link className="pill" href="#trailers">Trailer</Link>
                    <Link className="pill" href={`/article/${titleHub.article_slug}`}>Episode guide</Link>
                    <a className="pill active" href={titleHub.watch_link} target="_blank" rel="noopener noreferrer">Watch now</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* QUIZ + POLL */}
        <section className="section" id="play">
          <div className="wrap">
            <SectionHead kicker="PLAY" title="QUIZZES TE POLLS" />
            <div className="play-grid">
              <QuizWidget quiz={quiz} />
              <PollWidget poll={poll} />
            </div>
          </div>
        </section>

        {/* CHARCHA SESSIONS */}
        <section className="section on-band" id="sessions">
          <div className="wrap">
            <SectionHead kicker="CHARCHA SESSIONS" title="INTERVIEWS & BEHIND THE SCENES" hint tight />
            <div className="vids" style={{ marginTop: 26 }}>
              {sessions.map((s) => (
                <a key={s.title} className="ocard bts" href="#latest">
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

        {/* CALENDAR */}
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
