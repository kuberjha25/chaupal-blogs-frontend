const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function getServerSideProps({ res }) {
  const txt = `User-agent: *
Allow: /
Disallow: /studio
Disallow: /login

Sitemap: ${SITE}/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain');
  res.write(txt);
  res.end();
  return { props: {} };
}

export default function Robots() { return null; }
