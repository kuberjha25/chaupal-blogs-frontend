import { useEffect, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

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

export default function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [inv, setInv] = useState({ name: '', email: '', role: 'author' });

  const load = () =>
    api
      .get('/api/admin/users')
      .then((d) => {
        setRows(d.users);
        setMatrix(d.matrix);
      })
      .catch((e) => toast(e.message));

  useEffect(() => {
    if (user) load();
  }, [user]); // eslint-disable-line

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/api/admin/users/${id}`, { role });
      toast('Role update ho gaya ✓');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/users', inv);
      toast(`${inv.name} invite ho gaya — password: Chaupal@123`);
      setInv({ name: '', email: '', role: 'author' });
      load();
    } catch (ex) {
      toast(ex.message);
    }
  };

  const del = async (id) => {
    if (!window.confirm('User remove karna?')) return;
    try {
      await api.del(`/api/admin/users/${id}`);
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <StudioLayout title="Users te roles">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">TEAM TE PERMISSIONS</h2>
          <span className="sub">Role badlo, naye members invite karo — matrix thalle live hai.</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="ch" style={{ padding: '18px 20px 0' }}><span className="ct">TEAM</span></div>
        <div className="tscroll flat">
          <table className="tbl">
            <thead><tr><th>Member</th><th>Email</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {(rows || []).map((u) => {
                const rc = ROLE_CH[u.role] || ROLE_CH.author;
                return (
                  <tr key={u.id}>
                    <td className="tt">{u.name}{u.id === user.id ? <span className="tm"> · tusi</span> : ''}</td>
                    <td className="tm">{u.email}</td>
                    <td>
                      <span className="rolechip" style={{ background: rc.bg, color: rc.c, marginRight: 10 }}>{u.role.toUpperCase()}</span>
                      <select className="tsel" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} disabled={u.id === user.id} aria-label={`Role for ${u.name}`}>
                        {['admin', 'author', 'seo', 'marketing'].map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>{u.id !== user.id ? <button className="act warn" type="button" onClick={() => del(u.id)}>Remove</button> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="playgrid">
        <div className="card">
          <span className="ct">INVITE NEW MEMBER</span>
          <form onSubmit={invite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field"><label htmlFor="inm">NAAM</label><input id="inm" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} required /></div>
            <div className="field"><label htmlFor="ine">EMAIL</label><input id="ine" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} required /></div>
            <div className="field">
              <label htmlFor="inr">ROLE</label>
              <select id="inr" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}>
                {['admin', 'author', 'seo', 'marketing'].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }}>Send invite</button>
            <span className="notech">Default password: <b>Chaupal@123</b> — pehli login te change karwana.</span>
          </form>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="ch" style={{ padding: '18px 20px 0' }}><span className="ct">PERMISSIONS MATRIX · BACKEND TON LIVE</span></div>
          <div className="tscroll flat">
            <table className="tbl" style={{ minWidth: 520 }}>
              <thead><tr><th>Permission</th><th>Admin</th><th>Publisher</th><th>SEO</th><th>Marketing</th></tr></thead>
              <tbody>
                {matrix
                  ? MATRIX_ROWS.map(([key, label]) => (
                      <tr key={key}>
                        <td className="tt" style={{ fontWeight: 600 }}>{label}</td>
                        {['admin', 'author', 'seo', 'marketing'].map((r) => (
                          <td key={r} className={matrix[r].includes(key) ? 'yes' : 'no'}>{matrix[r].includes(key) ? '✓' : '—'}</td>
                        ))}
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
