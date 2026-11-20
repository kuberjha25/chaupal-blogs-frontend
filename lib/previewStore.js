/* Studio → preview hand-off. The editor writes its current (unsaved) form to localStorage;
   /studio/preview reads it and re-renders live whenever the editor writes again. */
export const PREVIEW_KEY = 'ctc-post-preview';

export function writePreview(data) {
  try {
    localStorage.setItem(PREVIEW_KEY, JSON.stringify({ ...data, _t: Date.now() }));
  } catch (e) {
    /* storage blocked — preview just won't update */
  }
}

export function readPreview() {
  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
