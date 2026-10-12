/* Reader (public site account) — loads on the client only, no effect on SSR output (pages stay cacheable) */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL } from './api';

/* Reader endpoints: cookie session (credentials:'include'); JSON + X-CTC header on every POST (CSRF guard) */
export async function readerFetch(path, { method = 'GET', body } = {}) {
  const opts = { method, credentials: 'include', headers: {} };
  if (method !== 'GET') {
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['X-CTC'] = '1';
    opts.body = JSON.stringify(body || {});
  }
  const res = await fetch(`${API_URL}${path}`, opts);
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

const ReaderCtx = createContext(null);

export function ReaderProvider({ children }) {
  const [reader, setReader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState(null); // null = modal closed; 'login' | 'signup' | 'forgot' | 'delete'

  const refresh = useCallback(async () => {
    try {
      /* { reader: {id, name, notif_status} | null } */
      const d = await readerFetch('/api/reader/me');
      const r = (d && d.reader) || null;
      setReader(r);
      return r;
    } catch (e) {
      /* Network / server error → treat as logged out (never block the page) */
      setReader(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await readerFetch('/api/reader/logout', { method: 'POST' });
    } catch (e) {
      /* the session may already have ended */
    }
    setReader(null);
  }, []);

  /* Once on mount — never blocks rendering */
  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = {
    reader,
    loading,
    refresh,
    logout,
    authView,
    openAuth: (view = 'login') => setAuthView(view),
    closeAuth: () => setAuthView(null),
  };
  return <ReaderCtx.Provider value={value}>{children}</ReaderCtx.Provider>;
}

export const useReader = () => useContext(ReaderCtx);

export const firstName = (r) => ((r && r.name) || '').trim().split(/\s+/)[0] || 'there';
