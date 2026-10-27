import Link from 'next/link';
import { mediaUrl } from '@/lib/api';
import { fmtPostDate } from './PostCard';

/* Tudum-style hero for the newest published story: image + dark gradient, text over it on desktop, below it on mobile */
export default function StoryHero({ post: h }) {
  return (
    <section className={`thero${h.image ? '' : ' noimg tone-' + (h.art_tone || 1)}`} id="top" aria-label="Newest story">
      <div className="thero-media">
        {h.image ? (
          <Link href={`/article/${h.slug}`} tabIndex={-1} aria-hidden="true">
            <img className="thero-img" src={mediaUrl(h.image)} alt="" width={Number(h.image_width) || 1600} height={Number(h.image_height) || 900} loading="eager" fetchpriority="high" decoding="async" />
          </Link>
        ) : null}
        <span className="thero-fade" aria-hidden="true" />
      </div>
      <div className="thero-text wrap">
        <div className="chiprow">
          <span className="chip fill">{(h.category || h.boli || 'STORY').toUpperCase()}</span>
        </div>
        <h1 className="display thero-title">{h.title}</h1>
        {h.dek ? <p className="thero-dek">{h.dek}</p> : null}
        <div className="meta">{[fmtPostDate(h.published_at), h.read_minutes ? `${h.read_minutes} MIN READ` : ''].filter(Boolean).join(' · ').toUpperCase()}</div>
        <div className="hero-ctas">
          <Link className="btn btn-lg" href={`/article/${h.slug}`}>Read story →</Link>
        </div>
      </div>
    </section>
  );
}
