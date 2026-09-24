import Link from 'next/link';
import { Mark, Phulkari, SocialLinks } from './bits';

export default function Footer({ settings = {} }) {
  const f = settings.footer || {};
  const eco = settings.ecosystem || [];
  const legal = f.legal || [];
  const watchUrl = settings.watch_url || 'https://www.chaupal.com';

  return (
    <footer className="footer">
      <Phulkari />
      <div className="wrap">
        <div className="fbrand">
          <Mark size={44} icon={26} />
          <span className="wordmark">
            <span className="display wm1" style={{ fontSize: 24 }}>CHAUPAL TE CHARCHA</span>
            <br />
            <span style={{ fontSize: 12, color: 'var(--dim)' }}>
              <span className="gurmukhi">{settings.gurmukhi_label || ''}</span> · Entertainment beyond boundaries
            </span>
          </span>
        </div>
        <div className="fcols">
          <div className="fblurb fblurb-col">{f.blurb || ''}</div>
          <div className="fcol">
            <span className="fh">CHARCHA</span>
            <Link href="/#latest">Latest stories</Link>
            <Link href="/#top10">Top 10</Link>
            <Link href="/#watch">What to Watch</Link>
            <Link href="/#trailers">Trailers</Link>
            <Link href="/#play">Quizzes te polls</Link>
          </div>
          <div className="fcol">
            <span className="fh">BOLI HUBS</span>
            <Link href="/#boli">Punjabi</Link>
            <Link href="/#boli">Haryanvi</Link>
            <Link href="/#boli">Bhojpuri</Link>
            <Link href="/#sessions">Charcha Sessions</Link>
          </div>
          <div className="fcol">
            <span className="fh">CHAUPAL</span>
            <a href={watchUrl} target="_blank" rel="noopener noreferrer">Watch on Chaupal</a>
            {eco.map((e) => (
              <a key={e.label} href={e.url} target="_blank" rel="noopener noreferrer">Chaupal {e.label.toLowerCase()}</a>
            ))}
          </div>
          <div className="fcol">
            <span className="fh">GET THE APP</span>
            <span className="fdev">{f.devices || ''}</span>
            <div className="fsocials">
              <SocialLinks socials={settings.socials || []} size={40} />
            </div>
          </div>
        </div>
        <div className="legal">
          <span>{f.copyright || ''}</span>
          <span className="llinks">
            {legal.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
            ))}
            <a className="top-pill" href="#top">Back to top ↑</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
