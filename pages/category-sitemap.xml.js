import { sendSitemap, termUrlset } from '@/lib/sitemap';

export const getServerSideProps = ({ res }) => sendSitemap(res, termUrlset);

export default function Sitemap() { return null; }
