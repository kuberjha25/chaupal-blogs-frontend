import { useEffect, useState } from 'react';
import StudioLayout, { Can } from '@/components/studio/StudioLayout';
import ImageCheck, { IMAGE_SPECS, checkImage } from '@/components/studio/ImageCheck';
import { api, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/ui';

export default function Media() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState(null);

  const load = () => api.get('/api/admin/media').then((d) => setRows(d.media)).catch((e) => toast(e.message));
  useEffect(() => {
    if (user) load();
  }, [user]); // eslint-disable-line

  const upload = async (file) => {
    setBusy(true);
    /* Before the upload — show expected vs actual size immediately */
    setCheck(await checkImage(file, IMAGE_SPECS.featured));
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt', file.name.replace(/\.[^.]+$/, ''));
    try {
      const d = await api.upload('/api/admin/media', fd);
      toast(`${d.media.filename} — saved as WebP ✓ (${Math.round(d.media.size_bytes / 1024)} KB)`);
      load();
    } catch (e) {
      toast(`Upload fail: ${e.message}`);
    }
    setBusy(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this media file? It will be removed from any posts that use it.')) return;
    try {
      await api.del(`/api/admin/media/${id}`);
      toast('Deleted');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <StudioLayout title="Media">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">MEDIA LIBRARY</h2>
          <span className="sub">Upload JPG, PNG or HEIC — the server converts it to WebP automatically.</span>
        </div>
        <label className="btn" style={{ cursor: 'pointer' }}>
          {busy ? 'Uploading…' : '↑ Upload image'}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <ImageCheck spec={IMAGE_SPECS.featured} result={check} />

      {!rows ? (
        <div className="loading">LOADING MEDIA…</div>
      ) : rows.length === 0 ? (
        <div className="lockednote">The library is empty — upload your first image. WebP conversion and resizing are automatic.</div>
      ) : (
        <div className="mediagrid">
          {rows.map((m) => (
            <div key={m.id} className="mtile">
              <a className="mart" href={mediaUrl(m.url_path)} target="_blank" rel="noopener noreferrer">
                <img src={mediaUrl(m.url_path)} alt={m.alt || m.filename} loading="lazy" />
              </a>
              <div className="mi">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.filename}</span>
                <span style={{ flex: 'none' }}>{Math.round(m.size_bytes / 1024)} KB</span>
              </div>
              <div className="mi" style={{ paddingTop: 0 }}>
                <span className="chip sample">WEBP · {m.width}×{m.height}</span>
                <Can perm="media">
                  <button className="act warn" type="button" onClick={() => del(m.id)}>Delete</button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudioLayout>
  );
}
