/* Article comments — approved list (client fetch, article SSR cacheable rehnda) + reader-only form */
import { useEffect, useState } from 'react';
import { readerFetch, useReader } from '@/lib/reader';

const MAX = 1000;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function Comments({ slug }) {
  const { reader, refresh, openAuth } = useReader();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  /* GET /api/public/posts/:slug/comments → { comments: [{ id, author_name, initial, body, created_at }] } */
  useEffect(() => {
    let alive = true;
    readerFetch(`/api/public/posts/${encodeURIComponent(slug)}/comments`)
      .then((d) => alive && setComments((d && d.comments) || []))
      .catch(() => alive && setComments([]));
    return () => {
      alive = false;
    };
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await readerFetch(`/api/public/posts/${encodeURIComponent(slug)}/comments`, { method: 'POST', body: { body } });
      setOk(true);
      setBody('');
    } catch (ex) {
      setErr(ex.message);
      /* Session expire ho gaya → reader state taaza karo (form "Log in" ban jaanda) */
      if (ex.status === 401) refresh();
    }
    setBusy(false);
  };

  return (
    <div className="scard" id="comments">
      <span className="shh">CHARCHA KARO — COMMENTS{comments.length ? ` (${comments.length})` : ''}</span>

      {comments.length ? (
        <ul className="clist">
          {comments.map((c) => (
            <li key={c.id} className="citem">
              <span className="avatar" aria-hidden="true">{c.initial}</span>
              <span className="cbody">
                <span className="cm"><b>{c.author_name}</b> · <time dateTime={c.created_at}>{fmtDate(c.created_at)}</time></span>
                <span className="cq">{c.body}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {ok ? (
        <span className="nl-ok" role="status">Thanks! Your comment will appear after approval.</span>
      ) : reader ? (
        <form onSubmit={submit} className="form">
          <div className="field">
            <label htmlFor="cbody">COMMENT</label>
            <textarea id="cbody" rows={4} value={body} onChange={(e) => setBody(e.target.value.slice(0, MAX))} maxLength={MAX} required aria-describedby="cbody-count" />
            <span id="cbody-count" className={`cnt${body.length >= MAX ? ' over' : ''}`}>{body.length} / {MAX}</span>
          </div>
          <span className="note">Commenting as <b>{reader.name}</b></span>
          {err ? <div className="errbox" role="alert">{err}</div> : null}
          <button className="btn" type="submit" disabled={busy || !body.trim()} style={{ alignSelf: 'flex-start' }}>{busy ? 'Posting…' : 'Post comment'}</button>
        </form>
      ) : (
        <button className="btn btn-ghost" type="button" onClick={() => openAuth('login')} style={{ alignSelf: 'flex-start' }}>Log in to comment</button>
      )}
    </div>
  );
}
