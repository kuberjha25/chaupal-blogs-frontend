import Link from 'next/link';
import { useEffect, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

export default function Seo() {
  const { user } = useAuth();
  const toast = useToast();
  const [d, setD] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => api.get('/api/admin/seo/overview').then(setD).catch((e) => toast(e.message));
  useEffect(() => {
    if (user) load();
  }, [user]); // eslint-disable-line

  const addRedirect = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/seo/redirects', { from_path: from, to_path: to });
      toast('301 redirect add ho gaya ✓');
      setFrom('');
      setTo('');
      load();
    } catch (ex) {
      toast(ex.message);
    }
  };

  const delRedirect = async (id) => {
    try {
      await api.del(`/api/admin/seo/redirects/${id}`);
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const lenChip = (len, min, max) => {
    if (!len) return <span className="status st-spam">MISSING</span>;
    if (len > max) return <span className="status st-rev">LONG · {len}</span>;
    if (len < min) return <span className="status st-rev">SHORT · {len}</span>;
    return <span className="status st-pub">OK · {len}</span>;
  };

  return (
    <StudioLayout title="SEO">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">SEO COMMAND</h2>
          <span className="sub">Meta lens, keywords te 301 redirects — Google layi sab tight.</span>
        </div>
      </div>

      {!d ? (
        <div className="loading">DATA AA RAHA…</div>
      ) : (
        <>
          <div className="playgrid">
            <div className="card">
              <div className="ch"><span className="ct">SITE HEALTH</span><span className="chip sample">SETTINGS TON</span></div>
              {(Array.isArray(d.health) ? d.health : []).map((h) => (
                <div key={h.label} className="healthrow">
                  <span>{h.label}</span>
                  <span className={`status ${/FAIL|MISS|ERROR/i.test(h.status) ? 'st-rev' : 'st-pub'}`}>{h.status}</span>
                </div>
              ))}
              <span className="notech">Sitemap live: <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc-text)' }}>/sitemap.xml</a> · robots: <a href="/robots.txt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc-text)' }}>/robots.txt</a></span>
            </div>
            <div className="card">
              <div className="ch"><span className="ct">FOCUS KEYWORDS</span><span className="chip sample">RANK TRACK</span></div>
              <div className="tscroll flat">
                <table className="tbl" style={{ minWidth: 0 }}>
                  <thead><tr><th>Keyword</th><th>Position</th><th>Move</th></tr></thead>
                  <tbody>
                    {d.keywords.map((k) => (
                      <tr key={k.id}>
                        <td className="tt">{k.keyword}</td>
                        <td>#{k.position}</td>
                        <td style={{ color: k.delta >= 0 ? 'var(--ok)' : 'var(--bj)', fontWeight: 800 }}>{k.delta >= 0 ? `▲ ${k.delta}` : `▼ ${Math.abs(k.delta)}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="ch" style={{ padding: '18px 20px 0' }}><span className="ct">META LENS · PUBLISHED POSTS</span></div>
            <div className="tscroll flat">
              <table className="tbl">
                <thead><tr><th>Post</th><th>SEO title</th><th>Meta description</th><th></th></tr></thead>
                <tbody>
                  {d.meta.map((m) => (
                    <tr key={m.id}>
                      <td><span className="tt">{m.title}</span><br /><span className="tm">/article/{m.slug}</span></td>
                      <td>{lenChip(m.title_len, 35, 60)}</td>
                      <td>{lenChip(m.desc_len, 90, 160)}</td>
                      <td><Link className="act" href={`/studio/editor?id=${m.id}`}>Edit meta</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="ch"><span className="ct">301 REDIRECTS · PURANE WORDPRESS URLS</span><span className="chip sample">LINK JUICE SAFE</span></div>
            <form className="two" style={{ alignItems: 'end' }} onSubmit={addRedirect}>
              <div className="field">
                <label htmlFor="rf">FROM · PURANA PATH</label>
                <input id="rf" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/2025/10/bhai-sahab-web-series" required />
              </div>
              <div className="field">
                <label htmlFor="rt">TO · NAVA PATH</label>
                <input id="rt" value={to} onChange={(e) => setTo(e.target.value)} placeholder="/article/bhai-sahab-web-series-episode-guide" required />
              </div>
              <button className="btn" type="submit" style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>+ Add 301</button>
            </form>
            <div className="minirows">
              {d.redirects.map((r) => (
                <div key={r.id} className="mrow">
                  <span className="status st-sch">301</span>
                  <span className="mt">{r.from_path} → {r.to_path}</span>
                  <span className="md">{Number(r.hits).toLocaleString('en-IN')} hits</span>
                  <button className="act warn" type="button" onClick={() => delRedirect(r.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </StudioLayout>
  );
}
