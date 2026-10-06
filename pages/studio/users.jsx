import { Fragment, useEffect, useRef, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

const ROLES = ['admin', 'author', 'seo', 'marketing'];
const ROLE_LABEL = { admin: 'Admin', author: 'Publisher', seo: 'SEO manager', marketing: 'Marketing' };
const ROLE_CH = {
  admin: { bg: 'var(--gold-tint)', c: 'var(--acc-text)' },
  author: { bg: 'var(--ok-tint)', c: 'var(--ok)' },
  seo: { bg: 'var(--hv-tint)', c: 'var(--hv)' },
  marketing: { bg: 'var(--bj-tint)', c: 'var(--bj)' },
};
const MATRIX_ROWS = [
  ['dashboard', 'Dashboard'], ['posts', 'Posts list'], ['edit-content', 'Edit content'], ['submit', 'Submit for review'],
  ['publish', 'Publish / schedule'], ['delete', 'Delete posts'], ['edit-meta', 'Edit SEO meta'], ['media', 'Media library'],
  ['playful', 'Quizzes te polls'], ['seo', 'SEO tools'], ['marketing', 'Marketing tools'], ['utm', 'UTM builder'],
  ['approve', 'Moderate comments'], ['users', 'Manage users'], ['settings', 'Site settings'],
];
const PERM_LABEL = Object.fromEntries(MATRIX_ROWS);

/* Backend di permission list ton ik line — role ki kar sakda */
function roleSummary(perms) {
  if (!Array.isArray(perms)) return '';
  if (!perms.length) return 'No access to anything yet.';
  if (MATRIX_ROWS.every(([k]) => perms.includes(k))) return 'Full access — content, publishing, SEO, marketing, users te site settings.';
  return `Can: ${perms.map((k) => (PERM_LABEL[k] || k).toLowerCase()).join(', ')}.`;
}

const isActive = (u) => (u.is_active === undefined || u.is_active === null ? true : Boolean(Number(u.is_active)));

const fmtAgo = (d) => {
  if (!d) return 'Never';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  const m = Math.round((Date.now() - t.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} d ago`;
  return t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* crypto.getRandomValues + rejection sampling (modulo bias nahi); har class ton ghatt to ghatt ik char */
const PW_SETS = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];
function randInt(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do window.crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % n;
}
function generatePassword(len = 20) {
  const all = PW_SETS.join('');
  const chars = PW_SETS.map((s) => s[randInt(s.length)]);
  while (chars.length < len) chars.push(all[randInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    /* http / purana browser — textarea fallback */
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e2) {
      return false;
    }
  }
}

function useCopy() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    if (!text) return;
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast('Copy nahi hoya — password select karke manually copy karo');
    }
  };
  return [copied, copy];
}

function PasswordField({ id, label, value, onChange }) {
  const [show, setShow] = useState(false);
  const [copied, copy] = useCopy();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pwrow">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          autoCapitalize="off"
          spellCheck={false}
          required
        />
        <div className="pwbtns">
          <button className="act" type="button" onClick={() => { onChange(generatePassword()); setShow(true); }}>Generate strong password</button>
          <button className="act" type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-controls={id}>{show ? 'Hide' : 'Show'}</button>
          <button className="act" type="button" onClick={() => copy(value)} disabled={!value}>{copied ? 'Copied ✓' : 'Copy'}</button>
        </div>
      </div>
    </div>
  );
}

/* Naya password sirf ik vaar dikhda — "Done" te state ton saaf */
function OneTimePassword({ who, password, onDone }) {
  const [copied, copy] = useCopy();
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);
  return (
    <div className="pwonce" ref={ref} role="status">
      <span className="ct">PASSWORD FOR {who.toUpperCase()}</span>
      <code className="pwcode">{password}</code>
      <div className="pwbtns">
        <button className="btn sm" type="button" onClick={() => copy(password)}>{copied ? 'Copied ✓' : 'Copy password'}</button>
        <button className="btn sm btn-ghost" type="button" onClick={onDone}>Done — hide it</button>
      </div>
      <span className="notech">Eh password dobara nahi dikhega. Copy karke user nu kise safe tareeke naal bhejo.</span>
    </div>
  );
}

const EMPTY_FORM = { name: '', email: '', role: 'author', password: '' };

export default function Users() {
  const { user, can } = useAuth();
  const toast = useToast();
  const allowed = can('users');
  const me = user ? user.id : null;

  const [rows, setRows] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [rowErr, setRowErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(null); // { who, password }
  const [pwFor, setPwFor] = useState(null);
  const [pwVal, setPwVal] = useState('');
  const [pwErr, setPwErr] = useState('');

  const load = () =>
    api
      .get('/api/admin/users')
      .then((d) => {
        setRows(d.users || []);
        setMatrix(d.matrix || d.permissions || null);
        setLoadErr('');
      })
      .catch((e) => setLoadErr(e.message));

  useEffect(() => {
    if (user && allowed) load();
  }, [user, allowed]); // eslint-disable-line

  const roles = matrix ? ROLES.filter((r) => matrix[r]).concat(Object.keys(matrix).filter((r) => !ROLES.includes(r))) : ROLES;

  const update = async (u, patch, okMsg) => {
    setRowErr('');
    setBusy(true);
    try {
      await api.put(`/api/admin/users/${u.id}`, patch);
      if (okMsg) toast(okMsg);
      await load();
      setBusy(false);
      return true;
    } catch (e) {
      setRowErr(`${u.name}: ${e.message}`);
      await load();
      setBusy(false);
      return false;
    }
  };

  const changeRole = (u, role) => update(u, { role }, `${u.name} hun ${ROLE_LABEL[role] || role} ✓`);

  const toggleActive = (u) => {
    const active = isActive(u);
    if (active && !window.confirm(`${u.name} nu deactivate karna? Oh sign in nahi kar sakenge.`)) return;
    update(u, { is_active: !active }, active ? `${u.name} deactivated` : `${u.name} active ✓`);
  };

  const openPw = (u) => {
    setPwFor(pwFor === u.id ? null : u.id);
    setPwVal('');
    setPwErr('');
  };

  const savePw = async (e, u) => {
    e.preventDefault();
    setPwErr('');
    setBusy(true);
    try {
      await api.put(`/api/admin/users/${u.id}`, { password: pwVal });
      setReveal({ who: u.name, password: pwVal });
      setPwFor(null);
      setPwVal('');
    } catch (ex) {
      setPwErr(ex.message);
    }
    setBusy(false);
  };

  const create = async (e) => {
    e.preventDefault();
    setFormErr('');
    setBusy(true);
    try {
      const res = await api.post('/api/admin/users', form);
      setReveal({ who: form.name, password: (res && (res.password || res.temp_password)) || form.password });
      setForm(EMPTY_FORM);
      load();
    } catch (ex) {
      setFormErr(ex.message);
    }
    setBusy(false);
  };

  if (user && !allowed) {
    return (
      <StudioLayout title="Users te roles">
        <div className="lockednote">Users te roles sirf admin manage kar sakda hai.</div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout title="Users te roles">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">TEAM TE PERMISSIONS</h2>
          <span className="sub">Role badlo, access band/chalu karo, password reset karo — matrix thalle live hai.</span>
        </div>
        <a className="btn sm" href="#add-user">+ Add user</a>
      </div>

      {reveal ? <OneTimePassword who={reveal.who} password={reveal.password} onDone={() => setReveal(null)} /> : null}
      {loadErr ? <div className="errbox" role="alert">{loadErr}</div> : null}

      <div className="card" style={{ padding: 0 }}>
        <div className="ch" style={{ padding: '18px 20px 0' }}>
          <span className="ct">TEAM{rows ? ` · ${rows.length}` : ''}</span>
        </div>
        {rowErr ? (
          <div className="errbox" role="alert" style={{ margin: '0 20px', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span>{rowErr}</span>
            <button type="button" className="act" onClick={() => setRowErr('')} aria-label="Dismiss error">✕</button>
          </div>
        ) : null}
        <div className="tscroll flat">
          <table className="tbl utbl">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(rows || []).map((u) => {
                const rc = ROLE_CH[u.role] || ROLE_CH.author;
                const active = isActive(u);
                const self = u.id === me;
                return (
                  <Fragment key={u.id}>
                    <tr className={active ? '' : 'inactive'}>
                      <td className="tt">{u.name}{self ? <span className="tm"> · tusi</span> : null}</td>
                      <td className="tm uemail" data-label="Email">{u.email}</td>
                      <td data-label="Role">
                        <span className="rolechip" style={{ background: rc.bg, color: rc.c }}>{(ROLE_LABEL[u.role] || u.role || '').toUpperCase()}</span>
                      </td>
                      <td data-label="Status">
                        <span className={`status ${active ? 'st-pub' : 'st-draft'}`}>{active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </td>
                      <td className="tm" data-label="Last active" title={u.last_active ? new Date(u.last_active).toLocaleString('en-IN') : undefined}>
                        {fmtAgo(u.last_active)}
                      </td>
                      <td data-label="Actions">
                        <div className="uacts">
                          <select
                            className="tsel"
                            value={u.role}
                            onChange={(e) => changeRole(u, e.target.value)}
                            disabled={busy || self}
                            title={self ? 'Apna role khud nahi badal sakde' : undefined}
                            aria-label={`Change role for ${u.name}`}
                          >
                            {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
                          </select>
                          <button
                            className={`act${active ? ' warn' : ''}`}
                            type="button"
                            onClick={() => toggleActive(u)}
                            disabled={busy || self}
                            title={self ? 'Apna account khud deactivate nahi kar sakde' : undefined}
                          >
                            {active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="act" type="button" onClick={() => openPw(u)} aria-expanded={pwFor === u.id}>
                            Set password
                          </button>
                        </div>
                      </td>
                    </tr>
                    {pwFor === u.id ? (
                      <tr className="pwtr">
                        <td colSpan={6}>
                          <form className="pwpanel" onSubmit={(e) => savePw(e, u)}>
                            <PasswordField id={`pw-${u.id}`} label={`NEW PASSWORD FOR ${u.name.toUpperCase()}`} value={pwVal} onChange={setPwVal} />
                            {pwErr ? <div className="errbox" role="alert">{pwErr}</div> : null}
                            <div className="pwbtns">
                              <button className="btn sm" type="submit" disabled={busy || !pwVal}>Save password</button>
                              <button className="btn sm btn-ghost" type="button" onClick={() => setPwFor(null)}>Cancel</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {rows && !rows.length ? (
                <tr><td colSpan={6} className="tm">Koi user nahi.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="playgrid">
        <div className="card" id="add-user">
          <span className="ct">ADD USER</span>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label htmlFor="inm">NAAM</label>
              <input id="inm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="off" required />
            </div>
            <div className="field">
              <label htmlFor="ine">EMAIL</label>
              <input id="ine" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" required />
            </div>
            <div className="field">
              <label htmlFor="inr">ROLE</label>
              <select id="inr" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-describedby="inr-desc">
                {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
              </select>
              <span className="notech" id="inr-desc">{matrix ? roleSummary(matrix[form.role]) : 'Permissions load ho rahe…'}</span>
            </div>
            <PasswordField id="inp" label="PASSWORD" value={form.password} onChange={(password) => setForm({ ...form, password })} />
            {formErr ? <div className="errbox" role="alert">{formErr}</div> : null}
            <button className="btn" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>{busy ? 'Saving…' : 'Create user'}</button>
          </form>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="ch" style={{ padding: '18px 20px 0' }}><span className="ct">PERMISSIONS MATRIX · BACKEND TON LIVE</span></div>
          <div className="tscroll flat">
            <table className="tbl" style={{ minWidth: 520 }}>
              <thead>
                <tr><th>Permission</th>{roles.map((r) => <th key={r}>{ROLE_LABEL[r] || r}</th>)}</tr>
              </thead>
              <tbody>
                {matrix
                  ? MATRIX_ROWS.map(([key, label]) => (
                      <tr key={key}>
                        <td className="tt" style={{ fontWeight: 600 }}>{label}</td>
                        {roles.map((r) => {
                          const has = (matrix[r] || []).includes(key);
                          return <td key={r} className={has ? 'yes' : 'no'}>{has ? '✓' : '—'}</td>;
                        })}
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
