import { useState } from 'react';
import { api } from '@/lib/api';
import { ArtGhost } from './bits';

/* ---------------- QUIZ — poora config DB ton (questions + results) ---------------- */
export function QuizWidget({ quiz }) {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({});
  const [done, setDone] = useState(false);

  if (!quiz) return null;
  const questions = quiz.questions || [];
  const results = quiz.results || {};

  const pick = (key, v) => {
    const next = { ...ans, [key]: v };
    setAns(next);
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      setDone(true);
      api.post(`/api/public/quizzes/${quiz.id}/play`).catch(() => {});
    }
  };

  const retry = () => {
    setAns({});
    setStep(0);
    setDone(false);
  };

  const res = done ? results[ans[questions[0]?.key]] || Object.values(results)[0] : null;
  const q = questions[step];

  return (
    <div className="panelcard" id="quiz">
      <div className="ptop">
        <span className="chip fill" style={{ fontSize: 10 }}>QUIZ</span>
        <span className="plabel">{done ? 'TUHADA MATCH' : `Q${step + 1} OF ${questions.length}`}</span>
      </div>
      <h3>{quiz.title}</h3>

      {!done && q ? (
        <div>
          <p className="qnote">{q.label}</p>
          <div className="opts">
            {q.options.map((o) => (
              <button key={o.v} className="opt" type="button" onClick={() => pick(q.key, o.v)}>{o.label}</button>
            ))}
          </div>
        </div>
      ) : null}

      {done && res ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="smallnote" style={{ margin: 0 }}>
            Tuhadi {ans.boli || 'Chaupal'} · {ans.time || 'tonight'} match:
          </p>
          <div className="rescard">
            <ArtGhost className="rart" tone={res.tone} glyph={res.glyph} script={res.script} />
            <span className="rt">
              <span className="ot" style={{ fontSize: 18 }}>{res.title}</span>
              <span className="why" style={{ fontSize: 13, color: 'var(--mut)' }}>{res.why}</span>
              <a className="go" href={res.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 800, color: 'var(--acc-text)' }}>
                Watch on Chaupal →
              </a>
            </span>
          </div>
          <button className="pill" type="button" onClick={retry} style={{ alignSelf: 'flex-start' }}>Dubara khedo</button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- POLL — votes DB vich save, live percentages ---------------- */
export function PollWidget({ poll }) {
  const [options, setOptions] = useState(poll ? poll.options : []);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!poll) return null;
  const total = options.reduce((s, o) => s + o.votes, 0) || 1;
  const colors = ['var(--acc)', 'var(--hv)', 'var(--bj)', 'var(--ok)'];

  const vote = async (optionId) => {
    if (busy) return;
    setBusy(true);
    try {
      const d = await api.post(`/api/public/polls/${poll.id}/vote`, { optionId });
      setOptions(d.options);
      setVoted(true);
    } catch (e) {
      /* fail quietly */
    }
    setBusy(false);
  };

  return (
    <div className="panelcard" id="poll">
      <span className="chip" style={{ alignSelf: 'flex-start', border: 0, background: 'var(--rose-tint)', color: 'var(--bj)', fontSize: 10 }}>POLL</span>
      <h3 style={{ fontSize: 19 }}>{poll.question}</h3>
      {!voted ? (
        <div className="opts stack">
          {options.map((o) => (
            <button key={o.id} className="opt" type="button" onClick={() => vote(o.id)}>{o.label}</button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((o, i) => {
            const pct = Math.round((100 * o.votes) / total);
            return (
              <div key={o.id} className="bar">
                <span className="fill" style={{ width: `${pct}%`, borderRightColor: colors[i % colors.length] }} />
                <span className="bt"><span>{o.label}</span><b>{pct}%</b></span>
              </div>
            );
          })}
        </div>
      )}
      <p className="smallnote" style={{ margin: 0 }}>
        {voted ? `Shukriya! ${total.toLocaleString('en-IN')} votes hun tak.` : 'Vote to see what the chaupal thinks.'}
      </p>
    </div>
  );
}

/* ---------------- NEWSLETTER ---------------- */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/api/public/newsletter', { email });
      setOk(true);
      setEmail('');
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <form className="nl-form" onSubmit={submit}>
      <label htmlFor="nl-email">EMAIL ADDRESS</label>
      <div className="nl-row">
        <input
          id="nl-email"
          type="email"
          required
          placeholder="tusi@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" style={{ height: 50 }}>Sign me up</button>
      </div>
      {ok ? <span className="nl-ok">Shukriya! Chitthi tuhade raah vich hai.</span> : null}
      {err ? <span className="nl-ok" style={{ color: 'var(--bj)' }}>{err}</span> : null}
    </form>
  );
}
