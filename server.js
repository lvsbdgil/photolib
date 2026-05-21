import express from 'express';
import helmet from 'helmet';
import Database from 'better-sqlite3';
import multer from 'multer';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(express.json({ limit: '1mb' }));

// ── Auth ──────────────────────────────────────────────────────────────────────
const SESSION_SECRET  = process.env.SESSION_SECRET  || 'dev-secret-change-in-production';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  || 'admin';
const IS_PROD         = process.env.NODE_ENV === 'production';

if (IS_PROD && SESSION_SECRET === 'dev-secret-change-in-production') {
  console.error('FATAL: SESSION_SECRET is not set. Set SESSION_SECRET env variable before running in production.');
  process.exit(1);
}

// Simple in-memory rate limiter: max 10 login attempts per IP per 15 minutes
const loginAttempts = new Map();
function checkLoginRate(ip) {
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + 15 * 60 * 1000 };
  }
  entry.count++;
  loginAttempts.set(ip, entry);
  return entry.count > 10;
}
// Clean up old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.reset) loginAttempts.delete(ip);
  }
}, 30 * 60 * 1000);

function signToken(payload) {
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}
function verifyToken(token) {
  try {
    const raw = Buffer.from(token, 'base64url').toString();
    const sep = raw.lastIndexOf(':');
    const payload = raw.slice(0, sep);
    const sig     = raw.slice(sep + 1);
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return false; }
}
function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k.trim() === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
function requireAuth(req, res, next) {
  if (!IS_PROD) return next();
  const token = getCookie(req, 'pl_auth');
  if (token && verifyToken(token)) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Auth routes (always public)
app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress;
  if (checkLoginRate(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }
  const { password } = req.body;
  const h1 = crypto.createHmac('sha256', SESSION_SECRET).update(password || '').digest();
  const h2 = crypto.createHmac('sha256', SESSION_SECRET).update(ADMIN_PASSWORD).digest();
  if (!crypto.timingSafeEqual(h1, h2)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = signToken(Date.now().toString());
  const cookie = [
    `pl_auth=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=604800', // 7 days
    IS_PROD ? 'Secure' : '',
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
  res.json({ ok: true });
});

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'pl_auth=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!IS_PROD) return res.json({ authenticated: true, dev: true });
  const token = getCookie(req, 'pl_auth');
  res.json({ authenticated: !!(token && verifyToken(token)) });
});

// ── Database ──────────────────────────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'photolib.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS themes (
    slug       TEXT PRIMARY KEY,
    name_ru    TEXT NOT NULL,
    name_en    TEXT NOT NULL,
    created_at TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id            TEXT PRIMARY KEY,
    original_name TEXT,
    ext           TEXT NOT NULL DEFAULT 'jpg',
    theme_slug    TEXT REFERENCES themes(slug) ON DELETE SET NULL,
    width         INTEGER NOT NULL DEFAULT 0,
    height        INTEGER NOT NULL DEFAULT 0,
    file_size     INTEGER NOT NULL DEFAULT 0,
    uploaded_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stats (
    key   TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0
  );
`);

// Seed default themes once
const themeCount = db.prepare('SELECT COUNT(*) as n FROM themes').get().n;
if (themeCount === 0) {
  const ins = db.prepare('INSERT OR IGNORE INTO themes (slug, name_ru, name_en) VALUES (?, ?, ?)');
  for (const [slug, ru, en] of [
    ['gorod',       'Город',       'City'],
    ['more',        'Море',        'Sea'],
    ['portret',     'Портрет',     'Portrait'],
    ['arhitektura', 'Архитектура', 'Architecture'],
    ['svet',        'Свет',        'Light'],
    ['pustoty',     'Пустоты',     'Voids'],
  ]) ins.run(slug, ru, en);
}

// ── Uploads ───────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Disposition', 'inline');
  next();
}, express.static(uploadsDir));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'].includes(file.mimetype)),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const getThemeWithCount = db.prepare(`
  SELECT t.*, COUNT(p.id) as photo_count
  FROM themes t LEFT JOIN photos p ON p.theme_slug = t.slug
  WHERE t.slug = ?
  GROUP BY t.slug
`);

function incrementStat(key, by = 1) {
  db.prepare(`INSERT INTO stats (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = value + ?`)
    .run(key, by, by);
}

// ── API: Themes ───────────────────────────────────────────────────────────────
app.get('/api/themes', (_req, res) => {
  const rows = db.prepare(`
    SELECT t.*, COUNT(p.id) as photo_count
    FROM themes t LEFT JOIN photos p ON p.theme_slug = t.slug
    GROUP BY t.slug ORDER BY t.created_at
  `).all();
  res.json(rows);
});

app.post('/api/themes', requireAuth, (req, res) => {
  const { slug, name_ru, name_en } = req.body;
  if (!slug || !name_ru || !name_en) return res.status(400).json({ error: 'Missing fields' });
  try {
    db.prepare('INSERT INTO themes (slug, name_ru, name_en) VALUES (?, ?, ?)').run(slug, name_ru, name_en);
    res.json(getThemeWithCount.get(slug));
  } catch {
    res.status(409).json({ error: 'Slug already exists' });
  }
});

app.patch('/api/themes/:slug', requireAuth, (req, res) => {
  const { name_ru, name_en } = req.body;
  const parts = [], vals = [];
  if (name_ru != null) { parts.push('name_ru = ?'); vals.push(name_ru); }
  if (name_en != null) { parts.push('name_en = ?'); vals.push(name_en); }
  if (!parts.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.slug);
  db.prepare(`UPDATE themes SET ${parts.join(', ')} WHERE slug = ?`).run(...vals);
  res.json(getThemeWithCount.get(req.params.slug));
});

app.delete('/api/themes/:slug', requireAuth, (req, res) => {
  db.prepare('UPDATE photos SET theme_slug = NULL WHERE theme_slug = ?').run(req.params.slug);
  db.prepare('DELETE FROM themes WHERE slug = ?').run(req.params.slug);
  res.json({ ok: true });
});

// ── API: Photos ───────────────────────────────────────────────────────────────
app.get('/api/photos', (req, res) => {
  const { theme, orientation, offset = 0 } = req.query;
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const where = [];
  const vals = [];

  if (theme && theme !== 'all') { where.push('theme_slug = ?'); vals.push(theme); }
  if (orientation === 'landscape') where.push('CAST(width AS REAL) / height >= 1.1');
  if (orientation === 'portrait')  where.push('CAST(width AS REAL) / height <= 0.95');

  const sql = `
    SELECT * FROM photos
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `;
  vals.push(limit, Number(offset));
  res.json(db.prepare(sql).all(...vals));
});

app.post('/api/photos/upload', requireAuth, upload.array('files', 20), async (req, res) => {
  const { theme_slug } = req.body;
  const results = [];

  for (const file of req.files || []) {
    const id = nanoid(10);
    const ext = 'jpg';
    try {
      // .rotate() with no args auto-applies EXIF orientation so the output is
      // correctly oriented and the reported dimensions reflect actual display size.
      const webInfo = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(path.join(uploadsDir, `${id}.${ext}`));

      await sharp(file.buffer)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(uploadsDir, `${id}-thumb.${ext}`));

      // Store post-rotation dimensions — these match what the browser renders.
      db.prepare(`
        INSERT INTO photos (id, original_name, ext, theme_slug, width, height, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, file.originalname, ext, theme_slug || null, webInfo.width, webInfo.height, file.size);

      incrementStat('total_uploads');
      results.push(db.prepare('SELECT * FROM photos WHERE id = ?').get(id));
    } catch (e) {
      console.error('Upload error for', file.originalname, e.message);
    }
  }
  res.json(results);
});

app.patch('/api/photos/:id', requireAuth, (req, res) => {
  const { theme_slug } = req.body;
  db.prepare('UPDATE photos SET theme_slug = ? WHERE id = ?').run(theme_slug ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id));
});

app.delete('/api/photos/:id', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (photo) {
    for (const f of [`${photo.id}.${photo.ext}`, `${photo.id}-thumb.${photo.ext}`]) {
      try { fs.unlinkSync(path.join(uploadsDir, f)); } catch {}
    }
    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  }
  res.json({ ok: true });
});

app.post('/api/photos/bulk-delete', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  for (const id of ids) {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
    if (photo) {
      for (const f of [`${photo.id}.${photo.ext}`, `${photo.id}-thumb.${photo.ext}`]) {
        try { fs.unlinkSync(path.join(uploadsDir, f)); } catch {}
      }
      db.prepare('DELETE FROM photos WHERE id = ?').run(id);
    }
  }
  res.json({ ok: true });
});

// ── Umami analytics proxy ─────────────────────────────────────────────────────
const UMAMI_URL          = process.env.UMAMI_URL || 'http://umami:3000';
const UMAMI_SITE_ID      = process.env.UMAMI_SITE_ID;
const UMAMI_ADMIN_PASS   = process.env.UMAMI_ADMIN_PASSWORD;

let _umamiTok = null, _umamiTokExp = 0;
async function umamiToken() {
  if (_umamiTok && Date.now() < _umamiTokExp) return _umamiTok;
  try {
    const r = await fetch(`${UMAMI_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: UMAMI_ADMIN_PASS }),
    });
    if (!r.ok) return null;
    const { token } = await r.json();
    _umamiTok = token;
    _umamiTokExp = Date.now() + 23 * 3600 * 1000;
    return token;
  } catch { return null; }
}

app.get('/api/config', (_req, res) => {
  res.json({ umamiSiteId: UMAMI_SITE_ID || null });
});

app.get('/u/script.js', async (_req, res) => {
  try {
    const r = await fetch(`${UMAMI_URL}/script.js`);
    if (!r.ok) return res.status(503).send('');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(await r.text());
  } catch { res.status(503).send(''); }
});

app.get('/api/analytics', requireAuth, async (_req, res) => {
  if (!UMAMI_SITE_ID || !UMAMI_ADMIN_PASS) return res.json(null);
  const tok = await umamiToken();
  if (!tok) return res.json(null);
  const now = Date.now();
  const startAt = now - 7 * 86400 * 1000;
  const hdrs = { Authorization: `Bearer ${tok}` };
  try {
    const [sRes, pRes] = await Promise.all([
      fetch(`${UMAMI_URL}/api/websites/${UMAMI_SITE_ID}/stats?startAt=${startAt}&endAt=${now}`, { headers: hdrs }),
      fetch(`${UMAMI_URL}/api/websites/${UMAMI_SITE_ID}/pageviews?startAt=${startAt}&endAt=${now}&unit=day&timezone=UTC`, { headers: hdrs }),
    ]);
    if (sRes.status === 401) { _umamiTok = null; return res.json(null); }
    const [stats, pv] = await Promise.all([sRes.json(), pRes.json()]);
    res.json({ stats, chart: pv.pageviews });
  } catch { res.json(null); }
});

// ── API: Stats ────────────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
  const totalPhotos  = db.prepare('SELECT COUNT(*) as n FROM photos').get().n;
  const totalThemes  = db.prepare('SELECT COUNT(*) as n FROM themes').get().n;
  const totalUploads = db.prepare("SELECT value FROM stats WHERE key = 'total_uploads'").get()?.value || 0;
  const homeViews    = db.prepare("SELECT value FROM stats WHERE key = 'home_view'").get()?.value || 0;
  res.json({ totalPhotos, totalThemes, totalUploads, homeViews });
});

// ── Track page views ──────────────────────────────────────────────────────────
const ALLOWED_EVENTS = new Set(['home_view', 'theme_view', 'lightbox_open']);
app.post('/api/track', (req, res) => {
  const { event } = req.body;
  if (event && ALLOWED_EVENTS.has(event)) incrementStat(event);
  res.json({ ok: true });
});

// ── Serve frontend in production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Photolib → http://localhost:${PORT}`));
