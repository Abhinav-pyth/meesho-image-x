# Meesho Studio Pro

Premium clone of the ListIQ **Meesho Low Shipping Image Generator** — a client-side React + Vite app that turns any product photo into optimized 1200×1200 image variants designed to help lower Meesho shipping slabs, with bulk mode, watermark studio, brand styling, background removal, ZIP export and a shipping-fee calculator.

## Tech stack

- React 18 + Vite 5 (no backend — everything runs in the browser)
- JSZip vendored in `public/` for offline-capable ZIP exports
- Zero environment variables required

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs static site to dist/
npm run preview    # serve the production build locally
```

## Deploy to Vercel

The repo is pre-configured (`vercel.json` sets framework, build command, output directory, SPA rewrites, cache & security headers).

### Option A — Git integration (recommended)

1. Push this folder to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com/new), import the repo.
   - If the repo root **is** this project → defaults are picked up automatically from `vercel.json`.
   - If this project lives in a sub-directory (e.g. `meesho-studio/`) → set **Root Directory** to that folder in the import settings.
3. Vercel auto-detects **Vite**; build command `npm run build`, output `dist`. Click **Deploy**.

### Option B — Vercel CLI

```bash
npm i -g vercel
cd meesho-studio
vercel          # preview deployment
vercel --prod   # production deployment
```

### Post-deploy checklist

- [ ] Update the `<loc>` URLs in `public/sitemap.xml` to your real domain.
- [ ] Add your domain under **Settings → Domains** if not using `*.vercel.app`.
- [ ] Optional: add Google Analytics / Plausible script into `index.html` before deploying.

## Deployment notes

- **SPA fallback**: all unknown routes rewrite to `/index.html` (see `vercel.json`), so deep links never 404.
- **Caching**: hashed assets under `/assets/*` are cached immutably for 1 year; HTML is revalidated by Vercel's default ETag behaviour.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` are injected at the edge.
- **No serverless functions needed** — the entire generator (canvas pipeline, JPEG size-compression loop, ZIP packing) runs client-side, so it deploys as pure static hosting on Vercel's edge CDN.

## Project structure

```
meesho-studio/
├── index.html               # entry HTML (SEO meta, fonts, JSZip script tag)
├── package.json             # scripts + deps used by Vercel
├── vite.config.js           # Vite + React plugin config
├── vercel.json              # Vercel deploy config (framework/build/headers/rewrites)
├── public/
│   ├── jszip.min.js         # vendored dependency (offline-safe)
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── main.jsx             # React bootstrap
    ├── App.jsx              # hash router, hero, pricing, footer
    ├── GeneratorPage.jsx    # main studio workspace
    ├── ShippingGuidePage.jsx# rate table + blended-cost calculator
    ├── ui.jsx               # dropzone, variant grid, toasts, plan gate
    ├── styles.css           # design system
    └── lib/engine.js        # image engine + shipping maths (ported algorithm)
```
