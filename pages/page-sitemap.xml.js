import { sendSitemap, pageEntries, pageUrlset } from '@/lib/sitemap';

export const getServerSideProps = ({ res }) => sendSitemap(res, (posts) => pageUrlset(pageEntries(posts)));

export default function Sitemap() { return null; }
