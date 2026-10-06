/* Reader login / sign up / forgot / delete — ik accessible modal (focus trap, Esc, focus wapas opener te) */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { readerFetch, useReader } from '@/lib/reader';
import { useToast } from '@/lib/ui';

const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const RESEND_SECONDS = 60;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TITLES = {
  login: 'LOG IN',
  signup: 'JOIN THE CHARCHA',
  verify: 'CHECK YOUR EMAIL',
  forgot: 'RESET PASSWORD',
  reset: 'RESET PASSWORD',
  delete: 'DELETE MY ACCOUNT',
};

function PwInput({ id, label, value, onChange, autoComplete, rule }) {
  const [show, setShow] = useState(false);
  const ok = PW_RULE.test(value);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pwrow">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby={rule ? `${id}-rule` : undefined}
          required
        />
        <button className="act" type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-controls={id}>{show ? 'Hide' : 'Show'}</button>
      </div>
      {rule ? (
        <span id={`${id}-rule`} className={`pwrule${value ? (ok ? ' ok' : ' bad') : ''}`}>
          {ok ? '✓ ' : ''}8+ characters with a letter and a digit
        </span>
      ) : null}
    </div>
  );
}

function CodeInput({ value, onChange }) {
  return (
    <div className="field">
      <label htmlFor="rm-code">6-DIGIT CODE</label>
      <input
        id="rm-code"
        className="codein"
        data-autofocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
      />
    </div>
  );
}

function Dialog({ initialView, onClose }) {
  const { refresh, logout } = useReader();
  const toast = useToast();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const [view, setView] = useState(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  /* Focus trap + Esc + body scroll lock; band hon te focus opener te wapas */
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const items = () => [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = items();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const inside = node.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (opener && opener.isConnected && opener.focus) opener.focus();
    };
  }, []);

  /* Har step te pehla field focus */
  useEffect(() => {
    const node = ref.current;
    const target = node.querySelector('[data-autofocus]') || node.querySelector('input') || node;
    target.focus();
  }, [view]);

  /* Resend countdown */
  const left = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useEffect(() => {
    if (!left) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [left]);

  const go = (v) => {
    setView(v);
    setErr('');
    setInfo('');
  };

  const run = async (fn) => {
    setErr('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      /* Server da generic message jiwen da tiwen */
      setErr(e.message);
    }
    setBusy(false);
  };

  const startTimer = () => {
    setNow(Date.now());
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
  };

  const needRule = () => {
    if (PW_RULE.test(password)) return true;
    setErr('Password needs 8+ characters with a letter and a digit.');
    return false;
  };

  const login = (e) => {
    e.preventDefault();
    run(async () => {
      await readerFetch('/api/reader/login', { method: 'POST', body: { email, password } });
      await refresh();
      onClose();
    });
  };

  const signupStart = (e) => {
    if (e) e.preventDefault();
    if (!needRule()) return;
    run(async () => {
      const d = await readerFetch('/api/reader/signup/start', { method: 'POST', body: { name, email, password } });
      setCode('');
      setView('verify');
      setInfo((d && d.message) || '');
      startTimer();
    });
  };

  const verify = (e) => {
    e.preventDefault();
    run(async () => {
      await readerFetch('/api/reader/signup/verify', { method: 'POST', body: { email, code } });
      const r = await refresh();
      onClose();
      if (r) toast(`Welcome to the charcha, ${(r.name || '').split(' ')[0]}!`);
    });
  };

  const forgot = (e) => {
    if (e) e.preventDefault();
    run(async () => {
      const d = await readerFetch('/api/reader/password/forgot', { method: 'POST', body: { email } });
      setCode('');
      setPassword('');
      setView('reset');
      setInfo((d && d.message) || '');
      startTimer();
    });
  };

  const reset = (e) => {
    e.preventDefault();
    if (!needRule()) return;
    run(async () => {
      await readerFetch('/api/reader/password/reset', { method: 'POST', body: { email, code, new_password: password } });
      await refresh();
      onClose();
      toast('Password updated — you are logged in.');
    });
  };

  const del = (e) => {
    e.preventDefault();
    run(async () => {
      await readerFetch('/api/reader/account/delete', { method: 'POST', body: { password } });
      await logout();
      onClose();
      toast('Your account has been deleted.');
    });
  };

  const resend = view === 'verify' ? signupStart : forgot;
  const tabbed = view === 'login' || view === 'signup';

  return (
    <div className="rmodal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rmodal" role="dialog" aria-modal="true" aria-labelledby="rm-title" ref={ref} tabIndex={-1}>
        <button className="iconbtn rmodal-x" type="button" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <span className="rule" aria-hidden="true" />
        <h2 id="rm-title" className="display">{TITLES[view]}</h2>

        {tabbed ? (
          <div className="rtabs" role="tablist" aria-label="Account">
            <button type="button" role="tab" id="rt-login" aria-selected={view === 'login'} aria-controls="rm-panel" className={`pill${view === 'login' ? ' active' : ''}`} onClick={() => go('login')}>Login</button>
            <button type="button" role="tab" id="rt-signup" aria-selected={view === 'signup'} aria-controls="rm-panel" className={`pill${view === 'signup' ? ' active' : ''}`} onClick={() => go('signup')}>Sign up</button>
          </div>
        ) : null}

        <div id="rm-panel" role={tabbed ? 'tabpanel' : undefined} aria-labelledby={tabbed ? `rt-${view}` : undefined} className="rpanel">
          {info ? <p className="rinfo" role="status">{info}</p> : null}
          {err ? <div className="errbox" role="alert">{err}</div> : null}

          {view === 'login' ? (
            <form className="form" onSubmit={login}>
              <div className="field"><label htmlFor="rm-email">EMAIL</label><input id="rm-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <PwInput id="rm-pass" label="PASSWORD" value={password} onChange={setPassword} autoComplete="current-password" />
              <button className="linkbtn" type="button" onClick={() => go('forgot')} style={{ alignSelf: 'flex-start' }}>Forgot password?</button>
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
            </form>
          ) : null}

          {view === 'signup' ? (
            <form className="form" onSubmit={signupStart}>
              <div className="field"><label htmlFor="rm-name">NAME</label><input id="rm-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></div>
              <div className="field"><label htmlFor="rm-email">EMAIL</label><input id="rm-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <PwInput id="rm-pass" label="PASSWORD" value={password} onChange={setPassword} autoComplete="new-password" rule />
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending code…' : 'Sign up'}</button>
              <p className="note">
                By signing up you agree to our{' '}
                <Link href="/terms-and-conditions" target="_blank" rel="noopener">Terms and Conditions</Link> and{' '}
                <Link href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</Link>.
              </p>
            </form>
          ) : null}

          {view === 'verify' || view === 'reset' ? (
            <form className="form" onSubmit={view === 'verify' ? verify : reset}>
              <CodeInput value={code} onChange={setCode} />
              {view === 'reset' ? <PwInput id="rm-newpass" label="NEW PASSWORD" value={password} onChange={setPassword} autoComplete="new-password" rule /> : null}
              <button className="btn" type="submit" disabled={busy || code.length !== 6}>
                {busy ? 'Checking…' : view === 'verify' ? 'Verify & continue' : 'Set password & log in'}
              </button>
              <div className="rrow">
                <button className="linkbtn" type="button" onClick={() => resend()} disabled={busy || left > 0}>
                  {left > 0 ? `Resend code (${left}s)` : 'Resend code'}
                </button>
                <button className="linkbtn" type="button" onClick={() => go(view === 'verify' ? 'signup' : 'forgot')}>Change email</button>
              </div>
            </form>
          ) : null}

          {view === 'forgot' ? (
            <form className="form" onSubmit={forgot}>
              <div className="field"><label htmlFor="rm-email">EMAIL</label><input id="rm-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
              <button className="linkbtn" type="button" onClick={() => go('login')} style={{ alignSelf: 'flex-start' }}>← Back to login</button>
            </form>
          ) : null}

          {view === 'delete' ? (
            <form className="form" onSubmit={del}>
              <p className="note" style={{ margin: 0 }}>This permanently deletes your account. Enter your password to confirm.</p>
              <PwInput id="rm-delpass" label="PASSWORD" value={password} onChange={setPassword} autoComplete="current-password" />
              <button className="btn danger" type="submit" disabled={busy}>{busy ? 'Deleting…' : 'Delete my account'}</button>
              <button className="linkbtn" type="button" onClick={onClose} style={{ alignSelf: 'flex-start' }}>Cancel</button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { authView, closeAuth } = useReader();
  const router = useRouter();

  /* Kise link (terms/privacy naveen tab vich; baaki same tab) te navigate → modal band */
  useEffect(() => {
    router.events.on('routeChangeStart', closeAuth);
    return () => router.events.off('routeChangeStart', closeAuth);
  }, [router.events]); // eslint-disable-line

  if (!authView) return null;
  return <Dialog key={authView} initialView={authView} onClose={closeAuth} />;
}
