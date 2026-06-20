# Agent Notes for FindX

## Design System

- **Theme**: Mercure 2.0 — warm, elegant, Apple-like minimalism.
- **Color tokens**: defined in `frontend/app/globals.css` with full light/dark palettes.
- **Common utilities** (defined in globals.css):
  - `.surface` — card panel with bg/card, border, rounded-2xl, shadow-sm
  - `.surface-elevated` — elevated card
  - `.btn-primary` — rounded-full primary CTA
  - `.btn-secondary` — rounded-full secondary CTA
- Prefer rounded-2xl, generous whitespace, and muted foreground text for labels.

## Frontend Architecture

- Next.js 16 App Router with `[locale]` segment (`zh`, `en`).
- `next-intl` v4 with a custom client `IntlProvider` (`components/IntlProvider.tsx`) wrapping both `Navbar` and page content to avoid static-render context issues.
- `next-themes` `ThemeProvider` is in `app/layout.tsx`; `ThemeToggle` uses `useTheme` with a mounted guard.
- API client uses `/api` base path; Next.js dev rewrites `/api/*` to `http://127.0.0.1:8006/api/*`.

## Backend Architecture

- FastAPI app is mounted under `/api` via `root_path="/api"` in `main.py`.
- Nginx proxies `https://findx.hub.tt2.li/api/` to `http://127.0.0.1:8006/api/`.
- PM2 manages `findx-backend` (uvicorn) and `findx-frontend` (`next start -p 3006`).

## Build & Deploy

```bash
cd frontend
npm run build
pm2 restart findx-frontend --update-env

cd ../backend
pm2 restart findx-backend --update-env
```

Long-running commands should redirect output to `/tmp/*.log` to avoid Cran Code heartbeat timeouts.

## Useful Checks

- Frontend health: `curl -sL https://findx.hub.tt2.li/`
- Backend health: `curl -s https://findx.hub.tt2.li/api/health`
- Levels API: `curl -s https://findx.hub.tt2.li/api/levels`
- Showcase PPT: `https://findx.hub.tt2.li/showcase`
