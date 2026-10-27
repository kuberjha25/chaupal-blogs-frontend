import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import { mediaUrl } from '@/lib/api';

const boliClass = (b) => (b === 'Haryanvi' ? 'c-hv' : b === 'Bhojpuri' ? 'c-bj' : 'c-acc');
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/* 16:9 thumbnail — fixed aspect-ratio box (no layout shift); gradient/glyph fallback when there is no image */
function Thumb({ post, eager, className = '' }) {
  return (
    <span className={`pthumb tone-${post.art_tone || 1} ${className}`}>
      {post.image ? (
        <img
          className="pimg"
          src={mediaUrl(post.image)}
          alt={post.image_alt || post.title}
          width={Number(post.image_width) || 1280}
          height={Number(post.image_height) || 720}
          loading={eager ? 'eager' : 'lazy'}
          decoding={eager ? 'sync' : 'async'}
          {...(eager ? { fetchpriority: 'high' } : {})}
        />
      ) : (
        <span className={`ghost glyph-${post.glyph_script || 'gurmukhi'}`} aria-hidden="true">{post.ghost_glyph || 'ਚ'}</span>
      )}
    </span>
  );
}

/* One card for the home rails and the /latest archive grid */
export function PostCard({ post }) {
  return (
    <Link className="ocard pcard" href={`/article/${post.slug}`}>
      <Thumb post={post} />
      <span className="otext">
        <span className={`sk ${boliClass(post.boli)}`}>{(post.category || post.boli || '').toUpperCase()}</span>
        <span className="ot pt">{post.title}</span>
        <span className="om">{[fmtDate(post.published_at), post.read_minutes ? `${post.read_minutes} min read` : ''].filter(Boolean).join(' · ')}</span>
      </span>
    </Link>
  );
}

/* Netflix-Tudum style banner: always the newest post */
export function HeroBanner({ post, settings }) {
  const tag = post.category || post.boli || '';
  return (
    <section className="tudum" id="top" aria-label="Newest story">
      <div className="tudum-inner">
        <Link className="tudum-media" href={`/article/${post.slug}`} tabIndex={-1} aria-hidden="true">
          <Thumb post={post} eager className="tudum-thumb" />
        </Link>
        <div className="tudum-text">
          {tag ? <span className="chip">{tag.toUpperCase()}</span> : null}
          <h1 className="tudum-title">{post.title}</h1>
          {post.dek ? <p className="tudum-dek">{post.dek}</p> : null}
          <div className="meta">{[fmtDate(post.published_at), post.read_minutes ? `${post.read_minutes} MIN READ` : ''].filter(Boolean).join(' · ').toUpperCase()}</div>
          <div className="hero-ctas">
            <Link className="btn btn-lg" href={`/article/${post.slug}`}>Read story →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const Chevron = ({ dir }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d={dir === 'l' ? 'M12.5 4 L6.5 10 L12.5 16' : 'M7.5 4 L13.5 10 L7.5 16'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Horizontal scroll-snap rail with desktop arrows (swipe on touch) */
export function PostRail({ id, title, posts, href }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ l: true, r: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ l: el.scrollLeft <= 4, r: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, posts]);

  const go = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (!posts.length) return null;
  return (
    <section className="prail" aria-labelledby={`rail-${id}`}>
      <div className="prail-head">
        <h2 className="prail-title" id={`rail-${id}`}>{title}</h2>
        {href ? <Link className="prail-all" href={href}>See all →</Link> : null}
      </div>
      <div className="prail-wrap">
        <button type="button" className="prail-arrow l" aria-label={`Scroll ${title} left`} onClick={() => go(-1)} disabled={edge.l}><Chevron dir="l" /></button>
        <div className="prail-track" ref={ref} onScroll={update}>
          {posts.map((p) => (
            <div className="prail-item" key={p.id || p.slug}><PostCard post={p} /></div>
          ))}
        </div>
        <button type="button" className="prail-arrow r" aria-label={`Scroll ${title} right`} onClick={() => go(1)} disabled={edge.r}><Chevron dir="r" /></button>
      </div>
    </section>
  );
}
