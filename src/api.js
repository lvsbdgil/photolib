const BASE = '/api';

async function req(path, opts = {}) {
  const r = await fetch(BASE + path, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Themes ────────────────────────────────────────────────────────────────────
export const getThemes = () => req('/themes');

export const createTheme = (data) =>
  req('/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const updateTheme = (slug, data) =>
  req(`/themes/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const deleteTheme = (slug) =>
  req(`/themes/${slug}`, { method: 'DELETE' });

// ── Photos ────────────────────────────────────────────────────────────────────
export const getPhotos = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();
  return req('/photos' + (q ? '?' + q : ''));
};

export const updatePhoto = (id, data) =>
  req(`/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const deletePhoto = (id) =>
  req(`/photos/${id}`, { method: 'DELETE' });

export const bulkDeletePhotos = (ids) =>
  req('/photos/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });

export function uploadPhotos(files, themeSlug, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    if (themeSlug) fd.append('theme_slug', themeSlug);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/photos/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authMe = () => req('/auth/me');

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () => req('/stats');

export const getAnalytics = () => req('/analytics').catch(() => null);

export const trackEvent = (event) =>
  req('/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event }) }).catch(() => {});

// ── Helpers ───────────────────────────────────────────────────────────────────
export function photoUrl(photo, size = 'web') {
  if (!photo) return null;
  return size === 'thumb'
    ? `/uploads/${photo.id}-thumb.jpg`
    : `/uploads/${photo.id}.${photo.ext}`;
}

export function photoAspect(photo) {
  if (!photo || !photo.height) return 1;
  return photo.width / photo.height;
}
