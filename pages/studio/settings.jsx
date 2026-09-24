import { useEffect, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) api.get('/api/admin/settings').then((d) => setS(d.settings)).catch((e) => toast(e.message));
  }, [user]); // eslint-disable-line

  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.value }));
  const setSocial = (i, k) => (e) =>
    setS((x) => {
      const socials = x.socials.map((so, idx) => (idx === i ? { ...so, [k]: e.target.value } : so));
      return { ...x, socials };
    });
  const setFooter = (k) => (e) => setS((x) => ({ ...x, footer: { ...x.footer, [k]: e.target.value } }));

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/api/admin/settings', { settings: s });
      toast('Settings save ho gaye ✓ — site turant update');
    } catch (e) {
      toast(e.message);
    }
    setBusy(false);
  };

  return (
    <StudioLayout title="Settings">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">SITE SETTINGS</h2>
          <span className="sub">Identity, socials te footer — sab settings table ton, site live padh di hai.</span>
        </div>
        <button className="btn" type="button" disabled={busy || !s} onClick={save}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div>

      {!s ? (
        <div className="loading">SETTINGS AA RAHE…</div>
      ) : (
        <div className="playgrid">
          <div className="stackcol">
            <div className="card">
              <span className="ct">IDENTITY</span>
              <div className="field"><label htmlFor="t1">SITE TITLE</label><input id="t1" value={s.site_title || ''} onChange={set('site_title')} /></div>
              <div className="field"><label htmlFor="t2">TAGLINE</label><input id="t2" value={s.tagline || ''} onChange={set('tagline')} /></div>
              <div className="field"><label htmlFor="t3">GURMUKHI LABEL</label><input id="t3" className="gurmukhi" value={s.gurmukhi_label || ''} onChange={set('gurmukhi_label')} /></div>
              <div className="field"><label htmlFor="t4">WATCH URL · CHAUPAL APP</label><input id="t4" value={s.watch_url || ''} onChange={set('watch_url')} /></div>
            </div>
            <div className="card">
              <span className="ct">FOOTER</span>
              <div className="field"><label htmlFor="f1">BLURB</label><textarea id="f1" rows={3} value={s.footer?.blurb || ''} onChange={setFooter('blurb')} /></div>
              <div className="field"><label htmlFor="f2">DEVICES LINE</label><input id="f2" value={s.footer?.devices || ''} onChange={setFooter('devices')} /></div>
              <div className="field"><label htmlFor="f3">COPYRIGHT</label><input id="f3" value={s.footer?.copyright || ''} onChange={setFooter('copyright')} /></div>
            </div>
          </div>

          <div className="card">
            <span className="ct">SOCIAL LINKS</span>
            {(s.socials || []).map((so, i) => (
              <div key={so.key} className="two" style={{ gap: 10 }}>
                <div className="field">
                  <label>{so.key.toUpperCase()} LABEL</label>
                  <input value={so.label} onChange={setSocial(i, 'label')} />
                </div>
                <div className="field">
                  <label>URL</label>
                  <input value={so.url} onChange={setSocial(i, 'url')} />
                </div>
              </div>
            ))}
            <span className="notech">Header, footer te article sidebar — sab inhi links nu use karde ne.</span>
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
