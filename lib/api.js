/* All data comes from the backend (port 4000) — no content is hardcoded in the frontend. */

/* Empty ('') in production — the browser calls /api on the same domain (nginx → Express). `??` so that '' is respected */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
/* For SSR (server-side) fetches — the server always needs an absolute URL */
export const API_INTERNAL = process.env.API_INTERNAL_URL || API_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function token() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ctc-auth');
    return raw ? JSON.parse(raw).token : null;
  } catch (e) {
    return null;
  }
}

async function request(path, { method = 'GET', body, isForm = false, server = false } = {}) {
  const base = server ? API_INTERNAL : API_URL;
  const headers = {};
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* empty body */
  }
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, opts) => request(p, opts),
  post: (p, body, opts = {}) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts = {}) => request(p, { ...opts, method: 'PUT', body }),
  patch: (p, body, opts = {}) => request(p, { ...opts, method: 'PATCH', body }),
  del: (p, opts = {}) => request(p, { ...opts, method: 'DELETE' }),
  upload: (p, formData) => request(p, { method: 'POST', body: formData, isForm: true }),
};

/* SSR helper — used in getServerSideProps */
export async function ssrGet(path) {
  const res = await fetch(`${API_INTERNAL}${path}`);
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/* Empty home sections (keep in sync with the guards in pages/index.jsx) → settings.empty_sections,
   so the header/footer don't show links to those sections */
export function withNav(settings, home) {
  const has = (a) => Array.isArray(a) && a.length > 0;
  const empty = [];
  if (!has(home.top10)) empty.push('top10');
  if (!has(home.picks)) empty.push('watch');
  if (!has(home.hubs)) empty.push('boli');
  if (!has(home.videos)) empty.push('trailers');
  if (!home.quiz && !home.poll) empty.push('play');
  if (!has(home.sessions)) empty.push('sessions');
  if (!has(home.calendar)) empty.push('calendar');
  return { ...(settings || {}), empty_sections: empty };
}

/* Backend unreachable (network error / bad JSON — no status), 5xx or 429 → temporary failure */
export const isBackendDown = (e) => !e || !e.status || e.status >= 500 || e.status === 429;

/* Keep the friendly page but not a 200 — 503 + Retry-After so Google doesn't index the error page */
export function markUnavailable(res) {
  res.statusCode = 503;
  res.setHeader('Retry-After', '120');
}

/* Uploaded image path → full URL */
export const mediaUrl = (p) => (p ? (p.startsWith('http') ? p : `${API_URL}${p}`) : null);

/* Absolute URL for og:image / JSON-LD — join a relative /uploads/... path with the site domain */
export const absMediaUrl = (p) => {
  const u = mediaUrl(p);
  return u && u.startsWith('/') ? `${SITE_URL}${u}` : u;
};
