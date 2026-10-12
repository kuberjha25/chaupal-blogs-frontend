/* Launch check: every URL the old WordPress site had must still work on the new site —
   either a 200 at the same address or a single 301 to a page that returns 200.

   Usage:  node scripts/check-old-urls.mjs https://blog.chaupal.com
           node scripts/check-old-urls.mjs http://localhost:3000

   scripts/wp-urls.txt is the old site's URL list (taken from its sitemaps on 2026-10-13). */
import { readFileSync } from 'node:fs';

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Give the new site address, e.g.  node scripts/check-old-urls.mjs https://blog.chaupal.com');
  process.exit(2);
}

const paths = readFileSync(new URL('./wp-urls.txt', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const MAX_HOPS = 5;

/* Follow redirects by hand so every hop's status code is visible */
async function trace(path) {
  const hops = [];
  let url = base + path;
  for (let i = 0; i <= MAX_HOPS; i++) {
    let r;
    try {
      r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'chaupal-launch-check' } });
    } catch (e) {
      return { hops, status: 0, url, error: e.message };
    }
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) {
      hops.push(r.status);
      url = new URL(loc, url).href;
      continue;
    }
    return { hops, status: r.status, url };
  }
  return { hops, status: 0, url, error: 'too many redirects' };
}

const verdict = (t) => {
  if (t.error) return `FAIL  ${t.error}`;
  if (t.status !== 200) return `FAIL  ends in ${t.status}`;
  if (!t.url.startsWith(base)) return 'WARN  redirects off-site';
  if (t.hops.length > 1) return `WARN  ${t.hops.length} redirects in a row (${t.hops.join(' → ')})`;
  /* 308 is also permanent; 302/307 are temporary and pass no ranking */
  if (t.hops.some((c) => c !== 301 && c !== 308)) return `WARN  temporary redirect (${t.hops.join(' → ')})`;
  return 'ok';
};

const counts = { ok: 0, WARN: 0, FAIL: 0 };
const queue = [...paths];
async function worker() {
  for (let p = queue.shift(); p !== undefined; p = queue.shift()) {
    const t = await trace(p);
    const v = verdict(t);
    counts[v.slice(0, 4).trim()]++;
    if (v !== 'ok') console.log(`${v}\n      ${p}${t.hops.length ? `  →  ${t.url.replace(base, '')}` : ''}`);
  }
}
await Promise.all(Array.from({ length: 3 }, worker));

console.log(`\n${paths.length} old URLs checked against ${base}:  ${counts.ok} ok, ${counts.WARN} warnings, ${counts.FAIL} failures`);
process.exit(counts.FAIL ? 1 : 0);
