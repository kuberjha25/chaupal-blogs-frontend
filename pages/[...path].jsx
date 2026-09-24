/* Catch-all — purane WordPress URLs layi 301 redirects (redirects table ton) */
const API = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getServerSideProps({ params, resolvedUrl }) {
  const path = '/' + (params.path || []).join('/');
  try {
    const r = await fetch(`${API}/api/public/redirect?path=${encodeURIComponent(path)}`);
    if (r.ok) {
      const d = await r.json();
      if (d && d.to) {
        /* statusCode use kar rahe — Next da permanent:true 308 bhejda hai, saanu exact 301 chahida (WP-parity) */
        return { redirect: { destination: d.to, statusCode: d.code === 302 ? 302 : 301 } };
      }
    }
  } catch (e) {
    /* backend down — 404 */
  }
  return { notFound: true };
}

export default function CatchAll() { return null; }
