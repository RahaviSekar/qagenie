# QA Genie — Project Summary

## Tech stack
- Node.js (>=18)
- Next.js (app directory) for UI (React 19)
- Express for server-side API
- Playwright for end-to-end testing
- Tailwind CSS + PostCSS
- TypeScript tooling (types only; project contains TS/TSX)
- Google Generative AI (`@google/generative-ai`) and `@modelcontextprotocol/sdk`
- Other libs: `cors`, `dotenv`, `uuid`, `framer-motion`, `lucide-react`

## Folder structure (top-level)
- app/ — Next.js app (UI, `layout.tsx`, pages/components)
- backend/
  - data/ — contains `regressionHistory.json` and other persisted JSON blobs
  - routes/ — Express route handlers (`scan`, `flows`, `regression`, ...)
  - services/ — background helpers (e.g., `logEmitter`)
  - server.js — legacy entry (prints message; not used for start)
- components/ — shared React components (e.g., `Dashboard.tsx`)
- scripts/ — automation and helper scripts
- temp-specs/ — generated Playwright/test spec files
- test-results/ — test outputs
- lib/ — lightweight helper(s) (e.g., `api.ts`)
- server.js — root entry that starts Next + Express
- package.json, pnpm-lock.yaml, tsconfig.json, next.config.mjs, tailwind.config.ts, etc.

## Database / Persistence
- No external database dependency detected in `package.json`.
- The app persists regression/test history to file: `backend/data/regressionHistory.json`.
- Summary: file-based storage (JSON) under `backend/data/`; no SQL/NoSQL server configured.

## Architecture
- Single Node.js application that composes:
  - Next.js frontend (served from `app/`) and
  - Express API mounted on the same process via the root `server.js`.
- `server.js` initializes Next and an Express `app`, mounts routes under `/api/*`, and serves Next pages for other routes.
- Server-Sent Events (SSE) stream at `/api/stream` used for live logs (via `backend/services/logEmitter`).
- Playwright is used as a testing/runtime tool (specs under `temp-specs/`) invoked by backend flows (e.g., regression flows).
- Integrations: Google Generative AI and ModelContextProtocol SDKs are used for AI-assisted generation.

## Deployment strategy
- Development: `pnpm dev` / `npm run dev` runs `node server.js` (root) which prepares Next in dev mode.
- Production recommended flow:
  1. `pnpm build` (runs `next build`)
  2. Set environment variables (API keys, `WEBHOOK_SECRET`, `PORT`, etc.)
  3. `NODE_ENV=production node server.js` (package.json `start` uses `cross-env NODE_ENV=production node server.js`)
- Playwright: ensure browsers are installed in the runtime/container (`pnpm exec playwright install chromium` or run `npm run pw:install`).
- Suggested hosts: any Node-capable host (Docker container, Azure App Service, AWS ECS/Fargate, DigitalOcean App Platform). Because the project uses a custom Next + Express server, hosting on Vercel/Netlify (serverless) is not straightforward without containerization.
- Secrets: provide `GEMINI_API_KEY` or other AI keys via environment variables. Use `WEBHOOK_SECRET` for GitHub webhook verification.

## Entry points, what runs and dependencies
- Primary entry: `server.js` at the project root.
  - Starts Next (`nextApp.prepare()`), creates an Express `app`, mounts API routes, SSE, health endpoint, and default catch-all to the Next handler.
  - Depends on: `backend/routes/scan`, `backend/routes/flows`, `backend/routes/regression`, and `backend/services/logEmitter`.
- Legacy entry: `backend/server.js` — intentionally exits with instructions; do not run it directly.
- Background / runtime dependencies:
  - `backend/routes/regression` can trigger Playwright flows (reads/writes `backend/data/`)
  - AI calls use keys from environment variables (`GEMINI_API_KEY`, etc.)
  - SSE clients connect to `/api/stream` to receive live logs emitted by `backend/services/logEmitter`.

## Useful commands
- Install deps (pnpm): `pnpm install`
- Install Playwright browsers: `pnpm exec playwright install chromium` or `npm run pw:install`
- Dev: `pnpm dev` (or `npm run dev`)
- Build: `pnpm build` (or `npm run build`)
- Start (production): `pnpm start` (or `npm run start`)

---
If you want, I can also:
- generate a Dockerfile for production deployment
- add a short README snippet with environment variables to set
