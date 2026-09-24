/* Saara data backend (port 4000) ton aanda hai — frontend vich koi content hardcode nahi. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
/* SSR (server-side) fetch ke liye — locally same URL */
export const API_INTERNAL = process.env.API_INTERNAL_URL || API_URL;

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
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
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

/* SSR helper — getServerSideProps vich use hota */
export async function ssrGet(path) {
  const res = await fetch(`${API_INTERNAL}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* Uploaded image path → full URL */
export const mediaUrl = (p) => (p ? (p.startsWith('http') ? p : `${API_URL}${p}`) : null);
