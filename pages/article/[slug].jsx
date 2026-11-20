import { ssrGet, isBackendDown, markUnavailable, withNav } from '@/lib/api';
import ArticleView from '@/components/site/ArticleView';

export async function getServerSideProps({ params, res }) {
  try {
    const [data, home] = await Promise.all([
      ssrGet(`/api/public/posts/${encodeURIComponent(params.slug)}`),
      /* Only for the header/footer links — if it fails, all links show and the article still loads */
      ssrGet('/api/public/home').catch(() => null),
    ]);
    return { props: { data: home ? { ...data, settings: withNav(data.settings, home) } : data } };
  } catch (e) {
    /* Backend down / 5xx → 503 (friendly page); a real 4xx (404 etc.) → 404 */
    if (isBackendDown(e)) {
      markUnavailable(res);
      return { props: { data: null } };
    }
    return { notFound: true };
  }
}

export default function Article({ data }) {
  return <ArticleView data={data} />;
}
