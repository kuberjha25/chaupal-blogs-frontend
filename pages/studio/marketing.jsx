import { useEffect, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function Marketing() {
  const { user } = useAuth();
  const toast = useToast();
  const [d, setD] = useState(null);
  const [u, setU] = useState({ url: `${SITE}/article/bhai-sahab-web-series-episode-guide`, source: 'instagram', medium: 'social', campaign: 'bhai_sahab_launch' });

  const load = () => api.get('/api/admin/marketing/overview').then(setD).catch((e) => toast(e.message));
  useEffect(() => {
    if (user) load();
  }, [user]); // eslint-disable-line

  const utm = `${u.url}${u.url.includes('?') ? '&' : '?'}utm_source=${encodeURIComponent(u.source)}&utm_medium=${encodeURIComponent(u.medium)}&utm_campaign=${encodeURIComponent(u.campaign)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(utm);
      toast('UTM link copy ho gaya ✓');
    } catch (e) {
      toast('Copy fail — manually select karo');
    }
  };

  const saveCampaign = async () => {
    try {
      await api.post('/api/admin/marketing/campaigns', { name: u.campaign, channel: u.source, utm_url: utm });
      toast('Campaign save ho gaya ✓');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const toggleCampaign = async (c) => {
    try {
      await api.patch(`/api/admin/marketing/campaigns/${c.id}`, { status: c.status === 'live' ? 'ended' : 'live' });
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const sendTest = async () => {
    try {
      const r = await api.post('/api/admin/marketing/newsletter/test');
      toast(r.message);
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <StudioLayout title="Marketing">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">MARKETING DESK</h2>
          <span className="sub">UTM links, campaigns te Chitthi newsletter — growth da adda.</span>
        </div>
      </div>

      {!d ? (
        <div className="loading">DATA AA RAHA…</div>
      ) : (
        <>
          <div className="playgrid">
            <div className="card">
              <div className="ch"><span className="ct">UTM LINK BUILDER</span><span className="chip sample">GA4 READY</span></div>
              <div className="field"><label htmlFor="uu">PAGE URL</label><input id="uu" value={u.url} onChange={(e) => setU({ ...u, url: e.target.value })} /></div>
              <div className="two" style={{ gap: 10 }}>
                <div className="field">
                  <label htmlFor="us">SOURCE</label>
                  <select id="us" value={u.source} onChange={(e) => setU({ ...u, source: e.target.value })}>
                    {['instagram', 'facebook', 'x', 'youtube', 'whatsapp', 'newsletter'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="um">MEDIUM</label>
                  <select id="um" value={u.medium} onChange={(e) => setU({ ...u, medium: e.target.value })}>
                    {['social', 'paid', 'email', 'referral'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label htmlFor="uc">CAMPAIGN NAME</label><input id="uc" value={u.campaign} onChange={(e) => setU({ ...u, campaign: e.target.value })} /></div>
              <div className="utmout">{utm}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn sm" type="button" onClick={copy}>Copy link</button>
                <button className="btn sm ghost" type="button" onClick={saveCampaign}>Save as campaign</button>
              </div>
            </div>

            <div className="stackcol">
              <div className="card">
                <div className="ch"><span className="ct">CHITTHI · NEWSLETTER</span><span className="status st-pub">{d.subscribers.count.toLocaleString('en-IN')} SUBSCRIBERS</span></div>
                <div className="minirows">
                  {d.subscribers.latest.map((s) => (
                    <div key={s.email} className="mrow"><span className="mt">{s.email}</span><span className="md">{new Date(s.created_at).toLocaleDateString('en-IN')}</span></div>
                  ))}
                </div>
                <button className="btn ghost sm" type="button" onClick={sendTest} style={{ alignSelf: 'flex-start' }}>Send test chitthi</button>
                <span className="notech">Real mailer (SES/Mailchimp) agla phase — hun demo response.</span>
              </div>
              <div className="card">
                <span className="ct">HOMEPAGE PROMO SLOTS</span>
                {d.promoSlots.map((p) => (
                  <div key={p.name} className="healthrow">
                    <span>{p.name}</span>
                    <span className="status st-sch">{p.status}</span>
                  </div>
                ))}
                <span className="notech">Slots settings table vich — Settings tab ton admin badal sakda.</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="ch" style={{ padding: '18px 20px 0' }}><span className="ct">CAMPAIGNS</span></div>
            <div className="tscroll flat">
              <table className="tbl">
                <thead><tr><th>Campaign</th><th>Channel</th><th>Status</th><th>UTM URL</th><th></th></tr></thead>
                <tbody>
                  {d.campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="tt">{c.name}</td>
                      <td>{c.channel}</td>
                      <td><span className={`status ${c.status === 'live' ? 'st-pub' : 'st-draft'}`}>{c.status.toUpperCase()}</span></td>
                      <td className="tm" style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.utm_url}</td>
                      <td><button className="act" type="button" onClick={() => toggleCampaign(c)}>{c.status === 'live' ? 'End' : 'Re-open'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </StudioLayout>
  );
}
