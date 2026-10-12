/* Catch-all — 301 redirects for old WordPress URLs (from the redirects table) */
import { API_INTERNAL as API, markUnavailable } from '@/lib/api';
import Unavailable from '@/components/site/Unavailable';

export async function getServerSideProps({ params, res }) {
  const path = '/' + (params.path || []).join('/');
  try {
    const r = await fetch(`${API}/api/public/redirect?path=${encodeURIComponent(path)}`);
    if (r.ok) {
      const d = await r.json();
      if (d && d.to) {
        /* Using statusCode — Next's permanent:true sends a 308, we need an exact 301 (WP parity) */
        return { redirect: { destination: d.to, statusCode: d.code === 302 ? 302 : 301 } };
      }
    } else if (r.status >= 500 || r.status === 429) {
      markUnavailable(res);
      return { props: { unavailable: true } };
    }
  } catch (e) {
    /* backend down / bad JSON — can't tell whether a redirect exists, so 503 rather than 404 */
    markUnavailable(res);
    return { props: { unavailable: true } };
  }
  return { notFound: true };
}

export default function CatchAll({ unavailable }) {
  return unavailable ? <Unavailable /> : null;
}
