import { useEffect, useState } from 'react';
import StudioLayout, { Can } from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

export default function Play() {
  const { user } = useAuth();
  const toast = useToast();
  const [quizzes, setQuizzes] = useState(null);
  const [polls, setPolls] = useState(null);

  const load = () => {
    api.get('/api/admin/quizzes').then((d) => setQuizzes(d.quizzes)).catch((e) => toast(e.message));
    api.get('/api/admin/polls').then((d) => setPolls(d.polls)).catch(() => {});
  };
  useEffect(() => {
    if (user) load();
  }, [user]); // eslint-disable-line

  const toggleQuiz = async (q) => {
    try {
      await api.patch(`/api/admin/quizzes/${q.id}`, { status: q.status === 'live' ? 'draft' : 'live' });
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const endPoll = async (p) => {
    try {
      await api.patch(`/api/admin/polls/${p.id}`, { status: p.status === 'live' ? 'ended' : 'live' });
      toast(p.status === 'live' ? 'Poll end ho gaya' : 'Poll dubara live');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const colors = ['var(--acc)', 'var(--hv)', 'var(--bj)', 'var(--ok)'];

  return (
    <StudioLayout title="Quizzes te polls">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">PLAYFUL CONTENT</h2>
          <span className="sub">Homepage de quiz te poll widgets — live status ithe control hunda.</span>
        </div>
      </div>

      <div className="playgrid">
        <div className="card">
          <div className="ch"><span className="ct">QUIZZES</span><span className="chip sample">HOMEPAGE WIDGET</span></div>
          {!quizzes ? (
            <div className="loading">AA RAHE…</div>
          ) : (
            <div className="minirows">
              {quizzes.map((q) => (
                <div key={q.id} className="mrow">
                  <span className={`status ${q.status === 'live' ? 'st-pub' : 'st-draft'}`}>{q.status.toUpperCase()}</span>
                  <span className="mt">{q.title}</span>
                  <span className="md">{Number(q.plays).toLocaleString('en-IN')} plays</span>
                  <Can perm="edit-content,utm">
                    <button className="act" type="button" onClick={() => toggleQuiz(q)}>{q.status === 'live' ? 'Pause' : 'Go live'}</button>
                  </Can>
                </div>
              ))}
            </div>
          )}
          <span className="notech">Quiz de questions te results seed data vich JSON config ne — builder agla phase.</span>
        </div>

        <div className="card">
          <div className="ch"><span className="ct">POLLS · LIVE VOTES</span></div>
          {!polls ? (
            <div className="loading">AA RAHE…</div>
          ) : (
            polls.map((p) => {
              const total = p.options.reduce((s, o) => s + o.votes, 0) || 1;
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="ch">
                    <b style={{ fontSize: 14 }}>{p.question}</b>
                    <span className={`status ${p.status === 'live' ? 'st-pub' : 'st-draft'}`}>{p.status.toUpperCase()}</span>
                  </div>
                  {p.options.map((o, i) => {
                    const pct = Math.round((100 * o.votes) / total);
                    return (
                      <div key={o.id} className="bar">
                        <span className="fill" style={{ width: `${pct}%`, borderRightColor: colors[i % colors.length] }} />
                        <span className="bt"><span>{o.label}</span><b>{pct}% · {o.votes.toLocaleString('en-IN')}</b></span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="smallnote">{total.toLocaleString('en-IN')} total votes</span>
                    <Can perm="edit-content,utm">
                      <button className="act" type="button" onClick={() => endPoll(p)}>{p.status === 'live' ? 'End poll' : 'Re-open'}</button>
                    </Can>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </StudioLayout>
  );
}
