import { sendSitemap, postUrlset } from '@/lib/sitemap';

export const getServerSideProps = ({ res }) => sendSitemap(res, postUrlset);

export default function Sitemap() { return null; }
