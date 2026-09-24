import Link from 'next/link';
import { useState } from 'react';
import { Mark, SocialLinks } from './bits';
import { ThemeToggle } from '@/lib/ui';

const NAV = [
  { label: 'Latest', href: '/#latest' },
  { label: 'Top 10', href: '/#top10' },
  { label: 'Boli Hubs', href: '/#boli' },
  { label: 'What to Watch', href: '/#watch' },
  { label: 'Trailers', href: '/#trailers' },
  { label: 'Quizzes', href: '/#play' },
];

export default function Chrome({ settings = {}, trending = [] }) {
  const [open, setOpen] = useState(false);
  const socials = settings.socials || [];
  const eco = settings.ecosystem || [];
  const watchUrl = settings.watch_url || 'https://www.chaupal.com';

  return (
    <>
      <a href="#main" className="skiplink">Skip to content</a>
      <div className="chrome">
        <div className="utility">
          <div className="wrap">
            <div className="socialrow">
              <SocialLinks socials={socials} />
              <span className="udivider" aria-hidden="true" />
              <span className="ulabel">
                <span className="gurmukhi">{settings.gurmukhi_label || ''}</span> · The official Chaupal companion
              </span>
            </div>
            <nav className="ulinks" aria-label="Chaupal ecosystem">
              {eco.map((e) => (
                <a key={e.label} href={e.url} target="_blank" rel="noopener noreferrer">{e.label} ↗</a>
              ))}
            </nav>
          </div>
        </div>

        <header className="mainbar">
          <div className="wrap">
            <button
              className="iconbtn menubtn"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => {
                setOpen(!open);
                document.body.classList.toggle('menu-open', !open);
              }}
              type="button"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M3 6 H19 M3 11 H19 M3 16 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Link className="lockup" href="/" aria-label="Chaupal Te Charcha — home">
              <Mark />
              <span className="wordmark">
                <span className="display wm1">CHAUPAL <span>TE CHARCHA</span></span>
                <br />
                <span className="wm2">STORIES · TRAILERS · CHARCHA</span>
              </span>
            </Link>
            <nav className="nav" aria-label="Sections">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href}>{n.label}</Link>
              ))}
            </nav>
            <div className="actions">
              <ThemeToggle />
              <a className="btn" href={watchUrl} target="_blank" rel="noopener noreferrer">Watch on Chaupal</a>
            </div>
          </div>
        </header>
      </div>

      <nav className={`mnav${open ? ' open' : ''}`} aria-label="Mobile sections">
        {NAV.map((n) => (
          <Link
            key={n.label}
            className="mlink"
            href={n.href}
            onClick={() => {
              setOpen(false);
              document.body.classList.remove('menu-open');
            }}
          >
            {n.label}
          </Link>
        ))}
        <a className="btn btn-lg" href={watchUrl} target="_blank" rel="noopener noreferrer">Watch on Chaupal</a>
      </nav>

      {trending.length ? (
        <div className="ticker">
          <div className="wrap">
            <span className="tlabel">TRENDING</span>
            {trending.map((t, i) => (
              <span key={t.slug} style={{ display: 'contents' }}>
                {i > 0 && <span className="tdot" aria-hidden="true">·</span>}
                <Link href={`/article/${t.slug}`}>{t.title}</Link>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
