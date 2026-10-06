import { useEffect, useState } from 'react';
import StudioLayout, { READER_ROLES } from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtAgo, fmtDate } from '@/lib/format';
import { useToast } from '@/lib/ui';

const PER_PAGE = 20;
const NOTIF = {
  granted: ['st-pub', 'GRANTED'],
  denied: ['st-spam', 'DENIED'],
};
const notifBadge = (s) => NOTIF[s] || ['st-draft', 'NOT ASKED'];
/* verified / is_active: boolean ya MySQL 0/1 — dono chalde */
const truthy = (v) => v === true || v === 1 || v === '1';
const isVerified = (r) => truthy(r.verified);
const isActive = (r) => truthy(r.is_active);

export default function Readers() {
  const { user } = useAuth();
  const toast = useToast();
  const allowed = Boolean(user && READER_ROLES.includes(user.role));
  const isAdmin = Boolean(user && user.role === 'admin');

  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // { readers, page, pages, total }
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  /* Search debounce — typing rukan ton 300ms baad, page 1 ton */
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = () =>
    api
      .get(`/api/admin/readers?search=${encodeURIComponent(query)}&page=${page}&limit=${PER_PAGE}`)
      .then((d) => {
        setData({ readers: d.readers, page: d.page, pages: Math.max(1, d.pages), total: d.total });
        setErr('');
      })
      .catch((e) => setErr(e.message));

  useEffect(() => {
    if (allowed) load();
  }, [allowed, query, page]); // eslint-disable-line

  const toggle = async (r) => {
    const active = isActive(r);
    if (active && !window.confirm(`${r.name} nu deactivate karna? Oh login ate comment nahi kar sakenge.`)) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/readers/${r.id}`, { is_active: !active });
      toast(active ? `${r.name} deactivated` : `${r.name} active ✓`);
      await load();
    } catch (e) {
      setErr(`${r.name}: ${e.message}`);
    }
    setBusy(false);
  };

  if (user && !allowed) {
    return (
      <StudioLayout title="Readers">
        <div className="lockednote">Readers sirf admin te marketing dekh sakde hain.</div>
      </StudioLayout>
    );
  }

  const rows = data ? data.readers : [];
  const cols = isAdmin ? 7 : 6;

  return (
    <StudioLayout title="Readers">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">READERS</h2>
          <span className="sub">Site te sign up kitte readers — comments te notifications layi.</span>
        </div>
      </div>

      <form className="rsearch" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="rq" className="sr-only">Search readers by name or email</label>
        <input id="rq" type="search" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </form>

      {err ? <div className="errbox" role="alert">{err}</div> : null}

      <div className="card" style={{ padding: 0 }}>
        <div className="ch" style={{ padding: '18px 20px 0' }}>
          <span className="ct">{data ? `${data.total} ${data.total === 1 ? 'READER' : 'READERS'}${query ? ` · “${query}”` : ''}` : 'READERS'}</span>
        </div>
        <div className="tscroll flat">
          <table className="tbl utbl">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Verified</th><th>Notifications</th><th>Joined</th><th>Last login</th>
                {isAdmin ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const [cls, lbl] = notifBadge(r.notif_status);
                const active = isActive(r);
                return (
                  <tr key={r.id} className={active ? '' : 'inactive'}>
                    <td className="tt">
                      {r.name}
                      {!active ? <span className="status st-draft" style={{ marginLeft: 8 }}>INACTIVE</span> : null}
                    </td>
                    <td className="tm uemail" data-label="Email">{r.email}</td>
                    <td data-label="Verified">{isVerified(r) ? <span className="c-ok" style={{ fontWeight: 800 }}>✓ Yes</span> : <span className="tm">No</span>}</td>
                    <td data-label="Notifications"><span className={`status ${cls}`}>{lbl}</span></td>
                    <td className="tm" data-label="Joined">{fmtDate(r.created_at)}</td>
                    <td className="tm" data-label="Last login">{fmtAgo(r.last_login_at)}</td>
                    {isAdmin ? (
                      <td data-label="Actions">
                        <button className={`act${active ? ' warn' : ''}`} type="button" onClick={() => toggle(r)} disabled={busy}>
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {data && !rows.length ? (
                <tr><td colSpan={cols} className="tm">{query ? 'Is search naal koi reader nahi mileya.' : 'Abhi koi reader nahi.'}</td></tr>
              ) : null}
              {!data && !err ? (
                <tr><td colSpan={cols} className="tm">Readers aa rahe…</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 ? (
        <nav className="pager" aria-label="Readers pages">
          <button className="btn sm btn-ghost" type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}>← Prev</button>
          <span className="pinfo">Page {page} of {data.pages}</span>
          <button className="btn sm btn-ghost" type="button" onClick={() => setPage(page + 1)} disabled={page >= data.pages}>Next →</button>
        </nav>
      ) : null}
    </StudioLayout>
  );
}
