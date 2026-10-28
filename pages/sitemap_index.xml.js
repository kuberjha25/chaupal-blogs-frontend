import { sendSitemap, indexXml } from '@/lib/sitemap';

export const getServerSideProps = ({ res }) => sendSitemap(res, indexXml);

export default function Sitemap() { return null; }
