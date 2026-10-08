import { useEffect, useState } from 'react';
import StudioLayout, { READER_ROLES } from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';

const TITLE_MAX = 65;
const MSG_MAX = 150;
const CUSTOM = '__custom';
const PATH_RE = /^\/(?!\/)\S*$/; // same-site path: "/" naal shuru, "//" nahi, spaces nahi

export default function Notifications() {
  const { user } = useAuth();
  const allowed = Boolean(user && READER_ROLES.includes(user.role));

  const [history, setHistory] = useState(null);
  const [granted, setGranted] = useState(null); // null = hale load nahi hoya
  const [posts, setPosts] = useState([]);
  const [loadErr, setLoadErr] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkSel, setLinkSel] = useState('/');
  const [custom, setCustom] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  /* GET → { notifications: [{ id, title, body, url, created_at, created_by_name, target_count, sent_count, failed_count }], granted } */
  const loadHistory = () =>
    api
      .get('/api/admin/notifications')
      .then((d) => {
        setHistory(d.notifications);
        setGranted(Number(d.granted));
        setLoadErr('');
      })
      .catch((e) => setLoadErr(e.message));

  useEffect(() => {
    if (!allowed) return;
    loadHistory();
    api
      .get('/api/public/posts?page=1&limit=10')
      .then((d) => {
        const list = (d && d.posts) || [];
        setPosts(list);
        if (list[0]) setLinkSel((cur) => (cur === '/' ? `/article/${list[0].slug}` : cur));
      })
      .catch(() => setPosts([]));
  }, [allowed]); // eslint-disable-line

  const url = linkSel === CUSTOM ? custom.trim() : linkSel;
  const host = typeof window !== 'undefined' ? window.location.host : '';

  const review = (e) => {
    e.preventDefault();
    setFormErr('');
    setResult(null);
    if (!title.trim() || !body.trim()) return setFormErr('Title te message dono chahide.');
    if (!PATH_RE.test(url)) return setFormErr('Custom link "/" naal shuru hona chahida, jiwen /article/slug — poora URL ya spaces nahi.');
    setStep('confirm');
    return undefined;
  };

  const send = async () => {
    setFormErr('');
    setBusy(true);
    try {
      /* → { ok, target, sent, failed } */
      const d = await api.post('/api/admin/notifications', { title: title.trim(), body: body.trim(), url, audience: 'all_granted' });
      setResult({ target: d.target, sent: d.sent, failed: d.failed });
      setTitle('');
      setBody('');
      setStep('form');
      loadHistory();
    } catch (ex) {
      setFormErr(ex.message);
      setStep('form');
    }
    setBusy(false);
  };

  if (user && !allowed) {
    return (
      <StudioLayout title="Notifications">
        <div className="lockednote">Notifications sirf admin te marketing bhej sakde hain.</div>
      </StudioLayout>
    );
  }

  /* Send sirf tad jad backend ne granted > 0 dasya (load na hoya / 0 → band) */
  const canSend = granted > 0;

  return (
    <StudioLayout title="Notifications">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">PUSH NOTIFICATIONS</h2>
          <span className="sub">Nawi story ya announcement — sidha readers de phone te desktop te.</span>
        </div>
        <span className="aud" aria-live="polite">
          <b>{granted === null ? '—' : granted}</b> {granted === 1 ? 'reader has' : 'readers have'} allowed notifications
        </span>
      </div>

      {loadErr ? <div className="errbox" role="alert">{loadErr}</div> : null}
      {result ? (
        <div className="nresult" role="status">
          <span className="ct">SENT</span>
          <span>{result.target} targeted · <b className="c-ok">{result.sent} sent</b> · <b className={result.failed ? 'c-bj' : ''}>{result.failed} failed</b></span>
          {result.failed ? <span className="notech">Failed usually means the browser subscription expired — those readers need to allow notifications again.</span> : null}
        </div>
      ) : null}

      <div className="playgrid">
        <div className="card">
          <span className="ct">NEW NOTIFICATION</span>
          <form onSubmit={review} className="form">
            <div className="field">
              <label htmlFor="nt">TITLE</label>
              <input id="nt" value={title} onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))} maxLength={TITLE_MAX} required disabled={step === 'confirm'} aria-describedby="nt-c" />
              <span id="nt-c" className={`cnt${title.length >= TITLE_MAX ? ' over' : ''}`}>{title.length} / {TITLE_MAX}</span>
            </div>
            <div className="field">
              <label htmlFor="nm">MESSAGE</label>
              <textarea id="nm" rows={3} value={body} onChange={(e) => setBody(e.target.value.slice(0, MSG_MAX))} maxLength={MSG_MAX} required disabled={step === 'confirm'} aria-describedby="nm-c" />
              <span id="nm-c" className={`cnt${body.length >= MSG_MAX ? ' over' : ''}`}>{body.length} / {MSG_MAX}</span>
            </div>
            <div className="field">
              <label htmlFor="nl">LINK</label>
              <select id="nl" value={linkSel} onChange={(e) => setLinkSel(e.target.value)} disabled={step === 'confirm'}>
                {posts.map((p) => <option key={p.slug} value={`/article/${p.slug}`}>{p.title}</option>)}
                <option value="/">Home page (/)</option>
                <option value="/latest">Latest stories (/latest)</option>
                <option value={CUSTOM}>Custom path…</option>
              </select>
            </div>
            {linkSel === CUSTOM ? (
              <div className="field">
                <label htmlFor="nc">CUSTOM PATH</label>
                <input id="nc" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="/article/your-slug" autoCapitalize="off" spellCheck={false} disabled={step === 'confirm'} />
              </div>
            ) : null}

            {formErr ? <div className="errbox" role="alert">{formErr}</div> : null}

            {step === 'form' ? (
              <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }} disabled={!canSend}>Review & send</button>
            ) : (
              <div className="nconfirm" role="group" aria-labelledby="nconf-t">
                <span id="nconf-t" className="nconf-t">
                  Send this to {granted} {granted === 1 ? 'reader' : 'readers'}? It can&apos;t be undone.
                </span>
                <div className="pwbtns">
                  <button className="btn sm" type="button" onClick={send} disabled={busy || !canSend} autoFocus>{busy ? 'Sending…' : 'Yes, send now'}</button>
                  <button className="btn sm btn-ghost" type="button" onClick={() => setStep('form')} disabled={busy}>Back to edit</button>
                </div>
              </div>
            )}
            {granted === 0 ? <span className="notech">No reader has allowed notifications yet.</span> : null}
          </form>
        </div>

        <div className="card">
          <span className="ct">PREVIEW</span>
          <div className="npreview" aria-label="Notification preview">
            <div className="npv-head">
              <img src="/logo.png" width="16" height="16" alt="" />
              <span>Chaupal Te Charcha · {host}</span>
              <span className="npv-now">now</span>
            </div>
            <div className="npv-body">
              <img className="npv-icon" src="/logo.png" width="40" height="40" alt="" />
              <div className="npv-text">
                <b>{title || 'Notification title'}</b>
                <span>{body || 'Your message shows here — keep it short and clear.'}</span>
              </div>
            </div>
          </div>
          <span className="notech">Opens <b>{url || '—'}</b> on click. Exact look depends on the reader&apos;s phone or browser; long text gets cut.</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="ch" style={{ padding: '18px 20px 0' }}><span className="ct">HISTORY</span></div>
        <div className="tscroll flat">
          <table className="tbl utbl">
            <thead>
              <tr><th>Title</th><th>Sent at</th><th>Message</th><th>Link</th><th>Target</th><th>Sent</th><th>Failed</th><th>By</th></tr>
            </thead>
            <tbody>
              {(history || []).map((n) => (
                <tr key={n.id}>
                  <td className="tt">{n.title}</td>
                  <td className="tm" data-label="Sent at">{fmtDateTime(n.created_at)}</td>
                  <td data-label="Message">{n.body}</td>
                  <td className="tm uemail" data-label="Link">{n.url}</td>
                  <td data-label="Target">{n.target_count}</td>
                  <td data-label="Sent"><b className="c-ok">{n.sent_count}</b></td>
                  <td data-label="Failed">{n.failed_count}</td>
                  <td className="tm" data-label="By">{n.created_by_name || '—'}</td>
                </tr>
              ))}
              {history && !history.length ? <tr><td colSpan={8} className="tm">Abhi tak koi notification nahi bheji.</td></tr> : null}
              {!history && !loadErr ? <tr><td colSpan={8} className="tm">History aa rahi…</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </StudioLayout>
  );
}
