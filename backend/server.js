/**
 * Legacy entry — the app now starts from the project root `server.js`
 * (Next.js UI + this Express API on one port).
 *
 * Run: pnpm dev
 */
console.error(
  "[QA Genie] Start the app from the repo root with: pnpm dev\n" +
    "          (do not run node backend/server.js — use root server.js)"
);
process.exit(1);
