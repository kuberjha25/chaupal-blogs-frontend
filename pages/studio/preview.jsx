import { useEffect, useMemo, useState } from 'react';
import ArticleView from '@/components/site/ArticleView';
import { api, withNav } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PREVIEW_KEY, readPreview } from '@/lib/previewStore';

const slugify = (t) => t.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';

/* Adds ids to h2 headings (as the backend does) and returns the table of contents */
function buildBody(html) {
  const toc = [];
  const used = new Set();
  const out = (html || '').replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    let id = slugify(text);
    while (used.has(id)) id += '-x';
    used.add(id);
    toc.push({ id, text });
    return `<h2${attrs.replace(/\sid\s*=\s*("[^"]*"|'[^']*')/i, '')} id="${id}">${inner}</h2>`;
  });
  return { body: out, toc };
}

export default function PreviewPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    setDraft(readPreview());
    const onStorage = (e) => e.key === PREVIEW_KEY && setDraft(readPreview());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    api.get('/api/public/home').then((h) => setSettings(withNav(h.settings, h))).catch(() => setSettings(false));
  }, []);

  const data = useMemo(() => {
    if (!draft || !settings) return null;
    const { body, toc } = buildBody(draft.body);
    const words = body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    const post = {
      title: draft.title || 'Untitled story',
      dek: draft.dek || '',
      slug: draft.slug || 'preview',
      body,
      boli: draft.boli || '',
      category: draft.category || '',
      category_slug: '',
      tags: (draft.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      image: draft.featured_path || null,
      image_alt: draft.title || '',
      art_tone: draft.art_tone || 1,
      ghost_glyph: draft.ghost_glyph || 'ਚ',
      glyph_script: draft.glyph_script || 'gurmukhi',
      author_name: (user && user.name) || '',
      published_at: draft.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_minutes: Math.max(1, Math.round(words / 200)),
      seo_title: draft.seo_title || '',
      seo_description: draft.seo_description || '',
    };
    return { post, toc, related: [], latest: [], settings };
  }, [draft, settings, user]);

  if (!draft) return <div className="loading">NO DRAFT TO PREVIEW — open this from the editor’s “Preview post” button.</div>;
  if (settings === false) return <div className="loading">COULD NOT LOAD SITE SETTINGS — is the API running?</div>;
  if (!data) return <div className="loading">LOADING PREVIEW…</div>;
  return <ArticleView data={data} preview />;
}
