/* Image size check before upload — shows expected vs actual immediately.
   On the site the container takes the image's own shape (no cropping), so a wrong ratio
   still uploads but changes the shape of the hero/cards — this warns, it does not block the upload. */

export const IMAGE_SPECS = {
  /* Hero (full-bleed up to 1300px), cards, article hero and social share (og:image) */
  featured: { width: 1920, height: 1080, minWidth: 1280 },
  /* Image inside the article body */
  inline: { width: 1600, height: 900, minWidth: 1000 },
};

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/* 1920×1080 → "16:9"; odd size (1455×877) → "1.66:1" */
const ratioLabel = (w, h) => {
  const g = gcd(w, h);
  return w / g <= 32 && h / g <= 32 ? `${w / g}:${h / g}` : `${(w / h).toFixed(2)}:1`;
};

const dims = (w, h) => `${w}×${h} px (${ratioLabel(w, h)})`;

/* The file's real width/height from the browser — null if the format (e.g. HEIC) can't be decoded */
function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    const done = (v) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    img.onload = () => done({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => done(null);
    img.src = url;
  });
}

export async function checkImage(file, spec) {
  const size = await readImageSize(file);
  const out = { name: file.name, expected: dims(spec.width, spec.height), actual: null, issues: [] };
  if (!size || !size.width || !size.height) return out;

  const want = spec.width / spec.height;
  out.actual = dims(size.width, size.height);
  if (size.width < spec.minWidth) out.issues.push(`too small — width must be at least ${spec.minWidth}px`);
  /* Up to 2% difference is allowed (1366×768 still counts as 16:9) */
  if (Math.abs(size.width / size.height - want) / want > 0.02) {
    out.issues.push(`ratio is not ${ratioLabel(spec.width, spec.height)} — it will look different on the site`);
  }
  return out;
}

export default function ImageCheck({ spec, result }) {
  const minHeight = Math.round((spec.minWidth * spec.height) / spec.width);
  return (
    <div className="imgcheck" aria-live="polite">
      <span>
        IMAGE SIZE: <b>{dims(spec.width, spec.height)}</b> recommended · ghatt-o-ghatt {spec.minWidth}×{minHeight}
      </span>
      {result ? (
        <span className="res">
          <span className="fn">{result.name}</span>
          <span>EXPECTED <b>{result.expected}</b></span>
          <span>ACTUAL <b>{result.actual || 'could not be read'}</b></span>
          {!result.actual ? (
            <span className="bad">⚠ The browser could not read this format's size — check skipped</span>
          ) : result.issues.length ? (
            <span className="bad">⚠ {result.issues.join(' · ')}</span>
          ) : (
            <span className="ok">✓ Size looks good</span>
          )}
        </span>
      ) : null}
    </div>
  );
}
