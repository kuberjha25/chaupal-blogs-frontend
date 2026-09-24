import Link from 'next/link';
import { useEffect, useState } from 'react';
import StudioLayout, { Can } from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

const ST = { published: ['st-pub', 'PUBLISHED'], draft: ['st-draft', 'DRAFT'], review: ['st-rev', 'IN REVIEW'], scheduled: ['st-sch', 'SCHEDULED'] };
const FILTERS = ['all', 'published', 'review', 'scheduled', 'draft'];

export default function Posts() {
  const { user, can } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [own, setOwn] = useState(false);
  const [filter, setFilter] = useState('all');
  const [err, setErr] = useState('');

  const load = () => {
    api
      .get(`/api/admin/posts${filter !== 'all' ? `?status=${filter}` : ''}`)
      .then((d) => {
        setRows(d.posts);
        setOwn(d.ownOnly);
      })
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    if (user) load();
  }, [user, filter]); // eslint-disable-line

  const publish = async (id) => {
    try {
      await api.patch(`/api/admin/posts/${id}/status`, { status: 'published' });
      toast('Post publish ho gaya ✓');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Pakka delete karna? Wapas nahi aayega.')) return;
    try {
      await api.del(`/api/admin/posts/${id}`);
      toast('Post delete ho gaya');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <StudioLayout title="Posts">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">{own ? 'MERE POSTS' : 'ALL POSTS'}</h2>
          <span className="sub">{own ? 'Sirf tuhade apne posts — desk scope.' : 'Har boli, har status — poora content.'}</span>
        </div>
        <Can perm="edit-content">
          <Link className="btn" href="/studio/editor">+ New post</Link>
        </Can>
      </div>

      <div className="filters" role="group" aria-label="Status filter">
        {FILTERS.map((f) => (
          <button key={f} className={`fpill${filter === f ? ' active' : ''}`} type="button" onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : ST[f][1].charAt(0) + ST[f][1].slice(1).toLowerCase()}
          </button>
        ))}
        {own ? <span className="notech" style={{ alignSelf: 'center' }}>Desk role — apne posts hi dikhde ne.</span> : null}
      </div>

      {err ? <div className="errbox">{err}</div> : null}
      {!rows ? (
        <div className="loading">POSTS AA RAHE…</div>
      ) : (
        <div className="tscroll">
          <table className="tbl">
            <thead>
              <tr><th>Title</th><th>Boli</th><th>Author</th><th>Status</th><th>Views</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const [cls, lbl] = ST[p.status] || ST.draft;
                const mine = p.author_id === user.id;
                return (
                  <tr key={p.id}>
                    <td><span className="tt">{p.title}</span><br /><span className="tm">/{p.slug}</span></td>
                    <td>{p.boli || '—'}</td>
                    <td>{p.author}</td>
                    <td><span className={`status ${cls}`}>{lbl}</span></td>
                    <td>{Number(p.views).toLocaleString('en-IN')}</td>
                    <td>
                      <span className="rowacts">
                        {(can('edit-content') && (!own || mine)) || can('edit-meta') ? (
                          <Link className="act" href={`/studio/editor?id=${p.id}`}>{can('edit-content') ? 'Edit' : 'Meta'}</Link>
                        ) : null}
                        <Can perm="publish">
                          {p.status !== 'published' ? (
                            <button className="act" type="button" onClick={() => publish(p.id)}>Publish</button>
                          ) : null}
                        </Can>
                        {p.status === 'published' ? (
                          <a className="act" href={`/article/${p.slug}`} target="_blank" rel="noopener noreferrer">View</a>
                        ) : null}
                        <Can perm="delete">
                          <button className="act warn" type="button" onClick={() => del(p.id)}>Delete</button>
                        </Can>
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="tm">Is filter vich koi post nahi.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </StudioLayout>
  );
}
