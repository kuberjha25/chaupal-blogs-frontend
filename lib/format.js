/* Studio tables layi chhote date helpers */

export const fmtDate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
};

export const fmtDateTime = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
};

export const fmtAgo = (d) => {
  if (!d) return 'Never';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  const m = Math.round((Date.now() - t.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} d ago`;
  return t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
