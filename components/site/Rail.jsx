import Link from 'next/link';
import { useRef } from 'react';
import PostCard from './PostCard';

/* Tudum-style horizontal rail: CSS scroll-snap, arrow buttons on desktop, swipe on touch */
export default function Rail({ title, kicker, posts, seeAll, id }) {
  const ref = useRef(null);
  if (!posts || !posts.length) return null;
  const go = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  return (
    <section className="section trail" id={id} aria-label={title}>
      <div className="wrap">
        <div className="trail-head">
          <div className="shead tight">
            <span className="rule" aria-hidden="true" />
            {kicker ? <span className="kicker">{kicker}</span> : null}
            <h2 className="display">{title}</h2>
          </div>
          <div className="trail-ctl">
            {seeAll ? <Link className="seemore" href={seeAll}>See all →</Link> : null}
            <button type="button" className="iconbtn trail-arrow" aria-label={`Scroll ${title} left`} onClick={() => go(-1)}>‹</button>
            <button type="button" className="iconbtn trail-arrow" aria-label={`Scroll ${title} right`} onClick={() => go(1)}>›</button>
          </div>
        </div>
        <div className="rail trail-rail" ref={ref}>
          {posts.map((p) => <PostCard key={p.id || p.slug} post={p} />)}
        </div>
      </div>
    </section>
  );
}
