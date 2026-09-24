import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import StudioLayout, { Can } from '@/components/studio/StudioLayout';
import { api, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

const RichEditor = dynamic(() => import('@/components/studio/RichEditor'), { ssr: false, loading: () => <div className="loading">EDITOR LOAD HO RAHA…</div> });

const EMPTY = {
  title: '', dek: '', body: '', boli_id: '', category_id: '', tags: '',
  seo_title: '', seo_description: '', slug: '', focus_keyword: '',
  status: 'draft', scheduled_at: '', featured_media_id: null, featured_path: null,
  ghost_glyph: 'ਚ', glyph_script: 'gurmukhi', art_tone: 1,
};

export default function EditorPage() {
  const router = useRouter();
  const { user, can } = useAuth();
  const toast = useToast();
  const [p, setP] = useState(EMPTY);
  const [tax, setTax] = useState({ bolis: [], categories: [] });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const id = router.query.id;

  useEffect(() => {
    if (!user || !router.isReady) return;
    api.get('/api/admin/taxonomy').then(setTax).catch(() => {});
    if (id) {
      api
        .get(`/api/admin/posts/${id}`)
        .then((d) => {
          setP({
            ...EMPTY,
            ...d.post,
            body: d.post.body_html || '',
            boli_id: d.post.boli_id || '',
            category_id: d.post.category_id || '',
            tags: d.post.tags || '',
            scheduled_at: d.post.scheduled_at ? String(d.post.scheduled_at).slice(0, 16) : '',
            featured_path: d.post.featured_path || null,
          });
          setLoaded(true);
        })
        .catch((e) => toast(e.message));
    } else {
      setP(EMPTY);
      setLoaded(true);
    }
  }, [user, router.isReady, id]); // eslint-disable-line

  const set = (k) => (e) => setP((s) => ({ ...s, [k]: e.target ? e.target.value : e }));

  const uploadFeatured = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt', p.title || file.name);
    try {
      const d = await api.upload('/api/admin/media', fd);
      setP((s) => ({ ...s, featured_media_id: d.media.id, featured_path: d.media.url_path }));
      toast('Featured image WebP ban ke save ho gayi ✓');
    } catch (e) {
      toast(`Upload fail: ${e.message}`);
    }
  };

  const save = async (status) => {
    setBusy(true);
    const payload = {
      title: p.title,
      dek: p.dek,
      body_html: p.body,
      status: status || p.status,
      boli_id: p.boli_id || null,
      category_id: p.category_id || null,
      scheduled_at: p.scheduled_at || null,
      tags: p.tags,
      slug: p.slug,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      focus_keyword: p.focus_keyword,
      featured_media_id: p.featured_media_id,
      ghost_glyph: p.ghost_glyph,
      glyph_script: p.glyph_script,
      art_tone: Number(p.art_tone) || 1,
    };
    try {
      const d = id ? await api.put(`/api/admin/posts/${id}`, payload) : await api.post('/api/admin/posts', payload);
      toast(
        d.status === 'published' ? 'Publish ho gaya ✓' : d.status === 'review' ? 'Review lai submit ho gaya ✓' : d.status === 'scheduled' ? 'Schedule ho gaya ✓' : 'Draft save ho gaya ✓'
      );
      if (!id && d.id) router.replace(`/studio/editor?id=${d.id}`);
      else setP((s) => ({ ...s, status: d.status, slug: d.slug }));
    } catch (e) {
      toast(e.message);
    }
    setBusy(false);
  };

  const metaOnly = !can('edit-content') && can('edit-meta');

  return (
    <StudioLayout title={id ? 'Edit post' : 'New post'}>
      {!loaded ? (
        <div className="loading">POST AA RAHA…</div>
      ) : (
        <div className="edgrid">
          <div className="edcol">
            <div className="field titlefield">
              <label htmlFor="pt">POST TITLE</label>
              <input id="pt" value={p.title} onChange={set('title')} placeholder="Story da title…" disabled={metaOnly} />
            </div>
            <div className="field">
              <label htmlFor="pd">DEK / STANDFIRST</label>
              <textarea id="pd" rows={2} value={p.dek || ''} onChange={set('dek')} placeholder="Ik line vich story da saar…" disabled={metaOnly} />
            </div>
            <div className="card" style={{ padding: 14 }}>
              <span className="ct">FEATURED IMAGE · AUTO-WEBP</span>
              <div className={`artslot tone-${p.art_tone || 1}`}>
                {p.featured_path ? <img src={mediaUrl(p.featured_path)} alt="" /> : <span className={`ghost glyph-${p.glyph_script}`} aria-hidden="true">{p.ghost_glyph}</span>}
                {!metaOnly ? (
                  <label className="btn sm" style={{ cursor: 'pointer' }}>
                    {p.featured_path ? 'Change image' : 'Upload image'}
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadFeatured(e.target.files[0])} />
                  </label>
                ) : null}
              </div>
              <span className="notech">Koi vi format upload karo — server WebP bana ke save karda (production S3 swap-ready).</span>
            </div>
            {metaOnly ? (
              <div className="lockednote">SEO role — body locked hai. Heading, meta te slug thalle SEO card ton edit karo.</div>
            ) : (
              <RichEditor value={p.body} onChange={(html) => setP((s) => ({ ...s, body: html }))} />
            )}
          </div>

          <div className="edcol">
            <div className="card">
              <div className="ch"><span className="ct">STATUS</span><span className={`status ${p.status === 'published' ? 'st-pub' : p.status === 'review' ? 'st-rev' : p.status === 'scheduled' ? 'st-sch' : 'st-draft'}`}>{p.status.toUpperCase()}</span></div>
              <Can perm="publish">
                <div className="field">
                  <label htmlFor="ps">SET STATUS</label>
                  <select id="ps" value={p.status} onChange={set('status')}>
                    <option value="draft">Draft</option>
                    <option value="review">In review</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                {p.status === 'scheduled' ? (
                  <div className="field">
                    <label htmlFor="sched">GO LIVE AT</label>
                    <input id="sched" type="datetime-local" value={p.scheduled_at || ''} onChange={set('scheduled_at')} />
                  </div>
                ) : null}
              </Can>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Can perm="edit-content">
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => save(can('publish') ? null : 'draft')}>Save {can('publish') ? '' : 'draft'}</button>
                </Can>
                <Can perm="submit">
                  {!can('publish') ? (
                    <button className="btn" type="button" disabled={busy} onClick={() => save('review')}>Submit for review →</button>
                  ) : null}
                </Can>
                <Can perm="publish">
                  {p.status !== 'published' ? (
                    <button className="btn" type="button" disabled={busy} onClick={() => save('published')}>Publish now →</button>
                  ) : null}
                </Can>
                {metaOnly ? (
                  <button className="btn" type="button" disabled={busy} onClick={() => save(null)}>Save meta →</button>
                ) : null}
              </div>
              {!can('publish') && can('submit') ? <span className="notech">Publish button desk role kol nahi — review ton baad admin/publisher live karega.</span> : null}
            </div>

            <div className="card">
              <span className="ct">ORGANISE</span>
              <div className="field">
                <label htmlFor="pb">BOLI</label>
                <select id="pb" value={p.boli_id} onChange={set('boli_id')} disabled={metaOnly}>
                  <option value="">— choose —</option>
                  {tax.bolis.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pc">CATEGORY</label>
                <select id="pc" value={p.category_id} onChange={set('category_id')} disabled={metaOnly}>
                  <option value="">— choose —</option>
                  {tax.categories.map((cg) => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ptag">TAGS · COMMA SEPARATED</label>
                <input id="ptag" value={p.tags} onChange={set('tags')} placeholder="Bhai Sahab, Web series" disabled={metaOnly} />
              </div>
            </div>

            <Can perm="edit-meta,edit-content">
              <div className="card">
                <div className="ch"><span className="ct">SEO</span><span className="chip sample">GOOGLE PREVIEW FIELDS</span></div>
                <div className="field">
                  <label htmlFor="st">SEO TITLE</label>
                  <input id="st" value={p.seo_title || ''} onChange={set('seo_title')} maxLength={70} />
                  <span className={`cnt${(p.seo_title || '').length > 60 ? ' over' : ''}`}>{(p.seo_title || '').length}/60</span>
                </div>
                <div className="field">
                  <label htmlFor="sd">META DESCRIPTION</label>
                  <textarea id="sd" rows={3} value={p.seo_description || ''} onChange={set('seo_description')} maxLength={170} />
                  <span className={`cnt${(p.seo_description || '').length > 160 ? ' over' : ''}`}>{(p.seo_description || '').length}/160</span>
                </div>
                <div className="field">
                  <label htmlFor="sl">URL SLUG</label>
                  <input id="sl" value={p.slug || ''} onChange={set('slug')} placeholder="auto ban jayega title ton" />
                </div>
                <div className="field">
                  <label htmlFor="fk">FOCUS KEYWORD</label>
                  <input id="fk" value={p.focus_keyword || ''} onChange={set('focus_keyword')} />
                </div>
              </div>
            </Can>

            <div className="card">
              <span className="ct">GHOST ART · JADO IMAGE NA HOVE</span>
              <div className="field">
                <label htmlFor="gg">GLYPH</label>
                <input id="gg" value={p.ghost_glyph || ''} onChange={set('ghost_glyph')} maxLength={4} disabled={metaOnly} />
              </div>
              <div className="two" style={{ gap: 10 }}>
                <div className="field">
                  <label htmlFor="gs">SCRIPT</label>
                  <select id="gs" value={p.glyph_script} onChange={set('glyph_script')} disabled={metaOnly}>
                    <option value="gurmukhi">Gurmukhi</option>
                    <option value="devanagari">Devanagari</option>
                    <option value="display">Display</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="gt">TONE 1–6</label>
                  <input id="gt" type="number" min="1" max="6" value={p.art_tone || 1} onChange={set('art_tone')} disabled={metaOnly} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
