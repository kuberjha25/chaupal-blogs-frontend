/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  /* Old WordPress URLs all end in "/". Without this Next first sends a 308 to drop the slash and only then
     the 301 to the new address — two redirects in a row for every old post. Canonical tags cover the "/" duplicates. */
  skipTrailingSlashRedirect: true,
  /* sitemap_index / post-sitemap / page-sitemap / category-sitemap are real pages now (same addresses as the old Yoast ones); the old
     web-story / wp sitemaps have no equivalent, so they go to the index.
     statusCode, not permanent:true, for an exact 301 (Next would send a 308). */
  async redirects() {
    const oldSitemaps = ['web-story-sitemap', 'wp-sitemap'];
    return [
      ...oldSitemaps.map((n) => ({ source: `/${n}.xml`, destination: '/sitemap_index.xml', statusCode: 301 })),
      { source: '/favicon.ico', destination: '/logo.png', statusCode: 301 },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'blog.chaupal.com', pathname: '/uploads/**' },
    ],
  },
};

module.exports = nextConfig;
