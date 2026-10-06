/* Catch-all — purane WordPress URLs layi 301 redirects (redirects table ton) */
import { API_INTERNAL as API, markUnavailable } from '@/lib/api';
import Unavailable from '@/components/site/Unavailable';

export async function getServerSideProps({ params, res }) {
  const path = '/' + (params.path || []).join('/');
  try {
    const r = await fetch(`${API}/api/public/redirect?path=${encodeURIComponent(path)}`);
    if (r.ok) {
      const d = await r.json();
      if (d && d.to) {
        /* statusCode use kar rahe — Next da permanent:true 308 bhejda hai, saanu exact 301 chahida (WP-parity) */
        return { redirect: { destination: d.to, statusCode: d.code === 302 ? 302 : 301 } };
      }
    } else if (r.status >= 500 || r.status === 429) {
      markUnavailable(res);
      return { props: { unavailable: true } };
    }
  } catch (e) {
    /* backend down / bad JSON — pata nahi redirect hai ya nahi, is layi 404 nahi, 503 */
    markUnavailable(res);
    return { props: { unavailable: true } };
  }
  return { notFound: true };
}

export default function CatchAll({ unavailable }) {
  return unavailable ? <Unavailable /> : null;
}
