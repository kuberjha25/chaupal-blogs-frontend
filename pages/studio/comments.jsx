import { useEffect, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

const ST = { pending: ['st-rev', 'PENDING'], approved: ['st-pub', 'APPROVED'], spam: ['st-spam', 'SPAM'] };

export default function Comments() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [own, setOwn] = useState(false);

  const load = () =>
    api
      .get('/api/admin/comments')
      .then((d) => {
        setRows(d.comments);
        setOwn(d.ownOnly);
      })
      .catch((e) => toast(e.message));

  useEffect(() => {
    if (user) load();
  }, [user]); // eslint-disable-line

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/comments/${id}`, { status });
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <StudioLayout title="Comments">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">COMMENT MODERATION</h2>
          <span className="sub">{own ? 'Sirf tuhade posts de comments.' : 'Article pages ton aaye comments — approve ya spam.'}</span>
        </div>
      </div>

      {!rows ? (
        <div className="loading">COMMENTS AA RAHE…</div>
      ) : rows.length === 0 ? (
        <div className="lockednote">Queue khali hai — koi naya comment nahi.</div>
      ) : (
        <div className="card">
          {rows.map((cm) => {
            const [cls, lbl] = ST[cm.status] || ST.pending;
            return (
              <div key={cm.id} className="crow">
                <span className="avatar" aria-hidden="true">{cm.author_name.slice(0, 2).toUpperCase()}</span>
                <span className="cbody">
                  <span className="cq">&ldquo;{cm.body}&rdquo;</span>
                  <span className="cm"><b>{cm.author_name}</b> · on <i>{cm.post_title}</i> · {new Date(cm.created_at).toLocaleString('en-IN')}</span>
                </span>
                <span className="cacts">
                  <span className={`status ${cls}`}>{lbl}</span>
                  {cm.status !== 'approved' ? <button className="act" type="button" onClick={() => setStatus(cm.id, 'approved')}>Approve</button> : null}
                  {cm.status !== 'spam' ? <button className="act warn" type="button" onClick={() => setStatus(cm.id, 'spam')}>Spam</button> : null}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </StudioLayout>
  );
}
