import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mark, Phulkari } from '@/components/site/bits';
import { ThemeToggle } from '@/lib/ui';

const DEMOS = [
  { email: 'admin@chaupal.com', name: 'Ujjwal M.', role: 'ADMIN · FULL ACCESS', ini: 'UM', bg: 'var(--acc)', fg: 'var(--on-acc)', color: 'var(--acc-text)' },
  { email: 'desk@chaupal.com', name: 'Charcha Desk', role: 'PUBLISHER · AUTHOR', ini: 'CD', bg: 'var(--ok)', fg: '#fff', color: 'var(--ok)' },
  { email: 'seo@chaupal.com', name: 'Simran K.', role: 'SEO MANAGER', ini: 'SK', bg: 'var(--hv)', fg: '#fff', color: 'var(--hv)' },
  { email: 'marketing@chaupal.com', name: 'Manav S.', role: 'MARKETING AGENT', ini: 'MS', bg: 'var(--bj)', fg: '#fff', color: 'var(--bj)' },
];

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async (e, p) => {
    setErr('');
    setBusy(true);
    try {
      await login(e, p);
      router.push('/studio');
    } catch (ex) {
      setErr(ex.message || 'Login fail — backend chal raha hai?');
    }
    setBusy(false);
  };

  return (
    <>
      <Head>
        <title>Sign in — Chaupal Te Charcha Studio</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="split">
        <aside className="brandside">
          <Link className="lockup" href="/">
            <Mark size={46} icon={26} />
            <span>
              <span className="display wm1" style={{ fontSize: 22 }}>CHAUPAL <span style={{ color: 'var(--acc-text)' }}>TE CHARCHA</span></span>
              <br />
              <span className="wm2">CONTENT STUDIO</span>
            </span>
          </Link>
          <div className="brandcopy">
            <span className="rule" aria-hidden="true" />
            <h1 className="display">IK DESK. TINN BOLIS. SAARI CHARCHA.</h1>
            <p>The Chaupal Te Charcha content studio — publish stories, tune SEO, run campaigns te manage the team, sab ik jagah ton.</p>
          </div>
          <Link className="backlink" href="/">← Back to Chaupal Te Charcha</Link>
          <span className="bigghost gurmukhi" aria-hidden="true">ਚ</span>
          <Phulkari up style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />
        </aside>

        <main className="formside">
          <div className="panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 className="display">SIGN IN TO THE STUDIO</h2>
              <span className="sub">Role decides what you see inside — admin sab kuchh, baki roles conditional.</span>
            </div>

            <div>
              <div className="shh" style={{ marginBottom: 12 }}>SEEDED ACCOUNTS · ONE-TAP SIGN IN</div>
              <div className="roles">
                {DEMOS.map((d) => (
                  <button key={d.email} className="rolebtn" type="button" disabled={busy} onClick={() => doLogin(d.email, 'Chaupal@123')}>
                    <span className="avatar" style={{ background: d.bg, color: d.fg }}>{d.ini}</span>
                    <span className="rt">
                      <span className="rn">{d.name}</span>
                      <span className="rr" style={{ color: d.color }}>{d.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divider">OR SIGN IN WITH EMAIL</div>

            {err ? <div className="errbox">{err}</div> : null}

            <form className="form" onSubmit={(e) => { e.preventDefault(); doLogin(email, pass); }}>
              <div className="field">
                <label htmlFor="email">EMAIL</label>
                <input id="email" type="email" placeholder="tusi@chaupal.com" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pass">PASSWORD</label>
                <input id="pass" type="password" placeholder="••••••••" autoComplete="current-password" required value={pass} onChange={(e) => setPass(e.target.value)} />
              </div>
              <button className="btn" type="submit" disabled={busy} style={{ height: 50 }}>{busy ? 'Signing in…' : 'Sign in →'}</button>
              <p className="note">Seeded password sab accounts da: <b>Chaupal@123</b>. Production vich pehli login te change karwana.</p>
            </form>

            <ThemeToggle className="pill" />
          </div>
        </main>
      </div>
    </>
  );
}
