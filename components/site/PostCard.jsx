import Link from 'next/link';
import { ArtGhost } from './bits';

const boliClass = (b) => (b === 'Haryanvi' ? 'c-hv' : b === 'Bhojpuri' ? 'c-bj' : 'c-acc');
export const fmtPostDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/* One story card — used by the home rails and the /latest archive. 16:9 thumbnail, category, 2-line title, date · read time */
export default function PostCard({ post: p, className = '' }) {
  return (
    <Link className={`ocard pcard ${className}`} href={`/article/${p.slug}`}>
      <ArtGhost className="rart" tone={p.art_tone} glyph={p.ghost_glyph} script={p.glyph_script} image={p.image} width={p.image_width} height={p.image_height} alt={p.image_alt || p.title} />
      <span className="otext">
        <span className={`sk ${boliClass(p.boli)}`}>{(p.category || p.boli || '').toUpperCase()}</span>
        <span className="ot">{p.title}</span>
        <span className="om">
          {[fmtPostDate(p.published_at), p.read_minutes ? `${p.read_minutes} min read` : ''].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  );
}
