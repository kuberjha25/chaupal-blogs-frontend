import { mediaUrl } from '@/lib/api';

export function Mark({ size = 40, icon = 24 }) {
  return (
    <span className="mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={icon} height={icon} viewBox="0 0 32 32" fill="none">
        <path d="M5 17 L16 6 L27 17" stroke="#171204" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 25 H28" stroke="#171204" strokeWidth="3" strokeLinecap="round" />
        <circle cx="16" cy="21" r="2.6" fill="#171204" />
      </svg>
    </span>
  );
}

/* Poster/still block — image hai to image, nahi to DB-driven ghost glyph placeholder */
export function ArtGhost({ className = '', tone = 1, glyph = 'ਚ', script = 'gurmukhi', image, alt = '', ghostStyle, tag, children }) {
  return (
    <span className={`art tone-${tone} ${className}`}>
      {image ? (
        <img className="artimg" src={mediaUrl(image)} alt={alt} loading="lazy" />
      ) : (
        <span className={`ghost glyph-${script}`} aria-hidden="true" style={ghostStyle}>{glyph}</span>
      )}
      {tag && !image ? <span className="arttag">{tag}</span> : null}
      {children}
    </span>
  );
}

export function SectionHead({ kicker, title, hint, tight }) {
  const head = (
    <div className={`shead${tight ? ' tight' : ''}`}>
      <span className="rule" aria-hidden="true" />
      <span className="kicker">{kicker}</span>
      <h2 className="display">{title}</h2>
    </div>
  );
  if (!hint) return head;
  return (
    <div className="shead-row">
      {head}
      <span className="swipe-hint">swipe →</span>
    </div>
  );
}

export function Phulkari({ up, style }) {
  return (
    <svg className="phulkari" preserveAspectRatio="none" viewBox="0 0 1440 8" aria-hidden="true" style={style}>
      <defs>
        <pattern id={up ? 'phu' : 'phd'} width="16" height="8" patternUnits="userSpaceOnUse">
          <path d={up ? 'M0 8 L8 0 L16 8 Z' : 'M0 0 L8 8 L16 0 Z'} fill="#F2B01E" opacity="0.55" />
        </pattern>
      </defs>
      <rect width="1440" height="8" fill={`url(#${up ? 'phu' : 'phd'})`} />
    </svg>
  );
}

const ICONS = {
  instagram: (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="14.6" cy="5.4" r="1.2" fill="currentColor" />
    </svg>
  ),
  youtube: (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1.5" y="4" width="17" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 7.8 L12.6 10 L8.5 12.2 Z" fill="currentColor" />
    </svg>
  ),
};

export function SocialLinks({ socials = [], size }) {
  return (
    <>
      {socials.map((s) => (
        <a
          key={s.key}
          className="sq"
          style={size ? { width: size, height: size, fontSize: 13 } : undefined}
          href={s.url}
          aria-label={`Chaupal on ${s.label}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ICONS[s.key] || (s.key === 'facebook' ? 'f' : 'X')}
        </a>
      ))}
    </>
  );
}
