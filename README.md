# Photolib

Minimalist photographer portfolio with admin panel. Bilingual (RU/EN), light/dark theme.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + SQLite (`better-sqlite3`) |
| Images | Sharp — auto-rotation, web resize (≤1800px), 400px thumbnail |
| Upload | Multer (memory storage, 50 MB limit) |
| Auth | HMAC-signed HttpOnly cookie, rate-limited login |
| Frontend | React 18 + React Router 6 + Vite |
| Deploy | Docker (multi-stage) + GitHub Actions → ghcr.io |

## Project structure

```
photolib/
├── server.js                   # Express API + auth + image processing
├── src/
│   ├── App.jsx                 # Root component, routing, lang/dark state
│   ├── main.jsx                # Entry point
│   ├── api.js                  # Fetch wrappers + photoUrl helper
│   ├── ui.jsx                  # Design system tokens + shared components
│   ├── styles.css              # CSS variables, animations
│   ├── hooks/
│   │   └── useAuth.js          # Auth state + login/logout actions
│   ├── components/
│   │   ├── Header.jsx          # Public site top bar
│   │   ├── Lightbox.jsx        # Full-screen photo viewer (←→ ESC)
│   │   └── ThemesOverlay.jsx   # Theme picker overlay
│   └── pages/
│       ├── Home.jsx            # Full-screen cycling photo
│       ├── ThemePage.jsx       # Masonry grid for a theme
│       └── admin/
│           ├── AdminLayout.jsx   # Auth gate + nav tabs
│           ├── AdminLogin.jsx    # Password form
│           ├── AdminDashboard.jsx
│           ├── AdminPhotos.jsx   # Library with bulk actions
│           ├── AdminThemes.jsx   # Inline edit + create/delete
│           └── AdminUpload.jsx   # Drag-and-drop with XHR progress
├── deploy/
│   └── setup.sh               # One-time server setup script
├── .github/workflows/
│   └── deploy.yml             # Build → push ghcr.io → SSH deploy
├── Dockerfile                 # Multi-stage: builder / deps / runner
├── docker-compose.yml
└── .env.example
```

## Development

```bash
npm install
npm run dev        # Express on :3000 + Vite dev server on :5173
```

Open http://localhost:5173 — Vite proxies `/api` and `/uploads` to Express.
Auth is bypassed in dev mode (no password needed for `/admin`).

## Production (local)

```bash
cp .env.example .env   # fill in SESSION_SECRET and ADMIN_PASSWORD
npm run build
npm start              # serves everything from Express on :3000
```

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Docker

```bash
# Build and run locally
docker compose up --build

# With custom credentials
SESSION_SECRET=<secret> ADMIN_PASSWORD=<pass> docker compose up -d
```

## CI/CD (GitHub Actions)

Every push to `main`:
1. Builds the Docker image
2. Pushes to `ghcr.io/<your-repo>:latest` + `:<sha>`
3. SSH-deploys to the server via `docker compose up -d`

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Server IP or hostname |
| `SSH_USER` | SSH username |
| `SSH_KEY` | Private SSH key (contents of `~/.ssh/id_rsa`) |
| `SSH_PORT` | SSH port (default `22`) |
| `DEPLOY_PATH` | Path on server, e.g. `/opt/photolib` |

**First-time server setup:**
```bash
scp deploy/setup.sh user@server:/tmp/
ssh user@server 'bash /tmp/setup.sh /opt/photolib'
# copy docker-compose.yml and .env to /opt/photolib
```

## Routes

| URL | Description |
|-----|-------------|
| `/` | Home — full-screen photo, cycles every 9s or on click |
| `/themes/:slug` | Masonry grid for a theme, lightbox on click |
| `/admin` | Dashboard — stats, recent uploads, quick actions |
| `/admin/photos` | Library — filter, multi-select, bulk delete, detail panel |
| `/admin/themes` | Manage themes — inline edit RU/EN, create, delete |
| `/admin/upload` | Drag-and-drop upload with per-file progress bar |

## API

```
GET    /api/themes
POST   /api/themes              { slug, name_ru, name_en }          🔒
PATCH  /api/themes/:slug        { name_ru?, name_en? }              🔒
DELETE /api/themes/:slug                                            🔒

GET    /api/photos?theme=&orientation=landscape|portrait&limit=&offset=
POST   /api/photos/upload       multipart: files[] + theme_slug?   🔒
PATCH  /api/photos/:id          { theme_slug }                      🔒
DELETE /api/photos/:id                                              🔒
POST   /api/photos/bulk-delete  { ids: [] }                         🔒

GET    /api/stats
POST   /api/track               { event: home_view|theme_view|lightbox_open }
POST   /api/auth/login          { password }
POST   /api/auth/logout                                             🔒
GET    /api/auth/me
```

🔒 requires auth in production (`NODE_ENV=production`).

Static files: `/uploads/{id}.jpg` (web ≤1800px) · `/uploads/{id}-thumb.jpg` (400px crop)

## Default themes

`gorod` · `more` · `portret` · `arhitektura` · `svet` · `pustoty`
