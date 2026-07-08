# x402-cp0x-com

Web interface for the **x402** machine-payments ecosystem, by [cp0x](https://cp0x.com).

The app lets you:

- **Facilitators** (home) — browse the known x402 facilitators, check their health, and search paid services across all of them or drill into a single facilitator's catalog.
- **Resources (cp0x)** — browse cp0x's own paid x402 endpoints (Morpho-based), served from the backend's `/api/free/cp0x-resources`, as cards or a list.
- **Reports** — read research on the x402 marketplace; each report is a page with an in-page table of contents and available in multiple languages (EN / RU).

## Stack

- Vue 3 + TypeScript
- Vite 6
- vue-router (history mode; hash mode for the IPFS build)
- SCSS
- `markdown-it` (+ `markdown-it-anchor`) for rendering reports

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (vue-tsc) + production build to dist/
```

In dev, `/api` requests are proxied to a local **x402-api** backend on `http://localhost:8080` (see `vite.config.js`), so leaving the API URLs empty in `public/config.js` works out of the box.

## Runtime config

Config is loaded in the browser from `public/config.js` (via `<script src="/config.js">` in `index.html`), **not** through `import.meta.env`. This lets the config be mounted in Docker without rebuilding the image.

```js
// public/config.js
window._env_ = {
  FACILITATORS_API_URL: '',     // base URL of the API serving the facilitator endpoints
  CP0X_SERVICES_API_URL: '',    // base URL of the API serving /api/free/cp0x-resources
};
```

Both API URLs work the same way:

- **Empty** → same-origin `/api/…` (nginx or the Vite dev server proxies it to the backend). No CORS needed.
- **Absolute** (e.g. `http://localhost:8080`) → the browser calls that host directly. The backend must send CORS headers for the interface's origin.

`CP0X_SERVICES_API_URL` is separate from `FACILITATORS_API_URL` so the two can point at different hosts; when it is empty it falls back to `FACILITATORS_API_URL`.

Access from code via `@/config`:

```ts
import { facilitatorsApiUrl, cp0xServicesApiUrl } from '@/config';
```

For a new environment, copy `public/example-config.js` → `public/config.js` and fill in the values. In Docker this file is mounted over the built bundle.

## Backend

The interface expects an **x402-api** backend (see the parent `x402-api` repo, port `8080`) exposing:

- `GET /api/free/facilitators` — the facilitator list
- `GET /api/free/facilitators/{id}/resources` — a facilitator's discovery catalog (proxied)
- `GET /api/free/facilitators/{id}/search` — semantic search across a facilitator
- `GET /api/free/cp0x-resources` — cp0x's own paid x402 endpoints

## IPFS build

`npm run build:ipfs` produces a fully self-contained single-file `dist-ipfs/index.html` (all JS/CSS/images/fonts inlined) that uses hash-based routing and no absolute paths, for static hosting on IPFS.

## Docker

```sh
docker compose up -d --build
```

This builds the SPA into an nginx image and serves it on port **8084** as the `pi-x402-interface` container. `public/config.js` is mounted read-only so it can change without a rebuild, and nginx proxies same-origin `/api/` to the x402-api backend on the host (`host.docker.internal:8080`). See `docker-compose.yml` and `nginx.conf`.

## Structure

- `src/views/` — pages: `FacilitatorsView`, `FacilitatorDetailView`, `ResourcesView`, `ReportsView`, `ReportDetailView`
- `src/facilitators/` — facilitator discovery API client, types and helpers
- `src/cp0x/` — client and types for the cp0x resources endpoint
- `src/reports/` — report registry + markdown content (`content/*.md`) and the markdown renderer
- `src/components/` — reusable components (`AppBar`, `Logo`, facilitator resource cards/rows)
- `src/config.ts` — typed accessor for `window._env_`
- `src/router/` — route definitions
- `public/config.js` — runtime config (replaced at deploy time)
