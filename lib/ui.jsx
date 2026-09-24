import { createContext, useContext, useRef, useState } from 'react';

/* ---------------- Toast ---------------- */
const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const t = useRef(null);

  const toast = (m) => {
    setMsg(m);
    setShow(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setShow(false), 2600);
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={`toast${show ? ' show' : ''}`} role="status" aria-live="polite">{msg}</div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ---------------- Theme ---------------- */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem('ctc-theme', next);
  } catch (e) {
    /* ignore */
  }
}

export function ThemeToggle({ className = 'iconbtn' }) {
  return (
    <button className={className} onClick={toggleTheme} aria-label="Switch light or dark mode" type="button">
      <svg className="icon-moon" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M16.5 12.2 A7 7 0 0 1 7.8 3.5 A7 7 0 1 0 16.5 12.2 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <svg className="icon-sun" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 1.5 V3.5 M10 16.5 V18.5 M1.5 10 H3.5 M16.5 10 H18.5 M3.9 3.9 L5.3 5.3 M14.7 14.7 L16.1 16.1 M16.1 3.9 L14.7 5.3 M5.3 14.7 L3.9 16.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
