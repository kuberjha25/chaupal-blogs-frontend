import Link from 'next/link';
import { useEffect, useState } from 'react';
import StudioLayout, { Can } from '@/components/studio/StudioLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const ST = { published: ['st-pub', 'PUBLISHED'], draft: ['st-draft', 'DRAFT'], review: ['st-rev', 'IN REVIEW'], scheduled: ['st-sch', 'SCHEDULED'] };

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    api
      .get('/api/admin/stats')
      .then((raw) => {
        const maxV = Math.max(...raw.week.map((w) => w.views), 1);
        const ago = (t) => {
          const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
          if (m < 60) return `${Math.max(m, 1)}m ago`;
          if (m < 1440) return `${Math.round(m / 60)}h ago`;
          return `${Math.round(m / 1440)}d ago`;
        };
        setD({
          ...raw,
          kpis: [
            { label: 'TOTAL VIEWS', value: Number(raw.views).toLocaleString('en-IN'), delta: '▲ live from DB' },
            { label: raw.ownOnly ? 'MERE POSTS' : 'TOTAL POSTS', value: raw.posts, delta: `${raw.byStatus.published || 0} published` },
            { label: 'SUBSCRIBERS', value: Number(raw.subscribers).toLocaleString('en-IN'), delta: '▲ Chitthi list' },
            { label: 'AVG READ TIME', value: raw.avgRead, delta: '▲ steady' },
          ],
          week: raw.week.map((w) => ({ label: w.day_label, views: w.views, pct: Math.max(8, Math.round((100 * w.views) / maxV)) })),
          recent: raw.recent.map((r) => ({ ...r, when: ago(r.updated_at) })),
          reviewCount: raw.byStatus.review || 0,
        });
      })
      .catch((e) => setErr(e.message));
  }, [user]);

  return (
    <StudioLayout title="Dashboard">
      {err ? <div className="errbox">{err}</div> : null}
      {!d ? (
        <div className="loading">DATA AA RAHA…</div>
      ) : (
        <>
          <div className="vhead">
            <div className="vh">
              <span className="rule" aria-hidden="true" />
              <h2 className="display">SAT SRI AKAL, {user.name.split(' ')[0].toUpperCase()}</h2>
              <span className="sub">{d.ownOnly ? 'Tuhade apne posts da haal — desk view.' : 'Poore Chaupal Te Charcha da haal, ik nazar vich.'}</span>
            </div>
            <Can perm="edit-content">
              <Link className="btn" href="/studio/editor">+ New post</Link>
            </Can>
          </div>

          <div className="kpis">
            {d.kpis.map((k) => (
              <div key={k.label} className="card kpi">
                <span className="ct">{k.label}</span>
                <span className="display kv">{k.value}</span>
                <span className="kd" style={k.down ? { color: 'var(--bj)' } : undefined}>{k.delta}</span>
              </div>
            ))}
          </div>

          <div className="dashrow">
            <div className="card">
              <div className="ch"><span className="ct">VIEWS · LAST 7 DAYS</span><span className="chip sample">DAILY_STATS TABLE</span></div>
              <div className="bars">
                {d.week.map((w) => (
                  <div key={w.label} className="b" style={{ height: `${w.pct}%` }} title={`${w.views.toLocaleString('en-IN')} views`}>
                    <span>{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="ch"><span className="ct">RECENT ACTIVITY</span></div>
              <div className="minirows">
                {d.recent.map((r) => {
                  const [cls, lbl] = ST[r.status] || ST.draft;
                  return (
                    <div key={r.id} className="mrow">
                      <span className={`status ${cls}`}>{lbl}</span>
                      <span className="mt">{r.title}</span>
                      <span className="md">{r.when}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="widgets">
            <Can perm="publish">
              <div className="card widget">
                <span className="ct">REVIEW QUEUE</span>
                <p><b>{d.reviewCount}</b> post{d.reviewCount === 1 ? '' : 's'} review vich — publish da button tuhade kol hai.</p>
                <Link className="act" href="/studio/posts" style={{ alignSelf: 'flex-start' }}>Open posts →</Link>
              </div>
            </Can>
            <Can perm="submit">
              <div className="card widget" style={{ borderLeftColor: 'var(--ok)' }}>
                <span className="ct">TUHADI QUEUE</span>
                <p><b>{d.reviewCount}</b> post review vich. Draft save karo, phir Submit for review.</p>
                <Link className="act" href="/studio/editor" style={{ alignSelf: 'flex-start' }}>Likhna shuru →</Link>
              </div>
            </Can>
            <Can perm="edit-meta">
              <div className="card widget" style={{ borderLeftColor: 'var(--hv)' }}>
                <span className="ct">SEO NOTE</span>
                <p><b>{d.seoMissing}</b> published post{d.seoMissing === 1 ? '' : 's'} di meta description missing hai.</p>
                <Link className="act" href="/studio/seo" style={{ alignSelf: 'flex-start' }}>Fix in SEO →</Link>
              </div>
            </Can>
            <Can perm="utm">
              <div className="card widget" style={{ borderLeftColor: 'var(--bj)' }}>
                <span className="ct">CAMPAIGN</span>
                <p>{d.liveCampaign ? <><b>{d.liveCampaign.name}</b> live hai — UTM links marketing tab vich.</> : 'Koi live campaign nahi — nava banao.'}</p>
                <Link className="act" href="/studio/marketing" style={{ alignSelf: 'flex-start' }}>Marketing →</Link>
              </div>
            </Can>
            <div className="card widget" style={{ borderLeftColor: 'var(--strong)' }}>
              <span className="ct">COMMENTS</span>
              <p><b>{d.pendingComments}</b> comment{d.pendingComments === 1 ? '' : 's'} moderation queue vich.</p>
              <Can perm="approve">
                <Link className="act" href="/studio/comments" style={{ alignSelf: 'flex-start' }}>Moderate →</Link>
              </Can>
            </div>
          </div>
        </>
      )}
    </StudioLayout>
  );
}
