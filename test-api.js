/**
 * Smoke tests for QA Genie API (no Gemini required for /api/health and /api/flows).
 * Run: node test-api.js   (with server: pnpm dev)
 */
const base = process.env.TEST_BASE || "http://127.0.0.1:3000";

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    return true;
  } catch (e) {
    console.error(`FAIL  ${name}: ${e.message}`);
    return false;
  }
}

async function get(path) {
  const r = await fetch(`${base}${path}`);
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = { raw: t };
  }
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}

async function post(path, body) {
  const r = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = { raw: t };
  }
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}

async function put(path, body) {
  const r = await fetch(`${base}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = { raw: t };
  }
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}

async function main() {
  let ok = 0;
  let total = 0;

  total++;
  if (
    await run("GET /api/health", async () => {
      const h = await get("/api/health");
      if (!h.ok) throw new Error("health not ok");
    })
  )
    ok++;

  total++;
  if (
    await run("GET /api/flows", async () => {
      const flows = await get("/api/flows");
      if (!Array.isArray(flows)) throw new Error("expected array");
    })
  )
    ok++;

  total++;
  if (
    await run("PUT /api/flows/:id (edit)", async () => {
      const f = await post("/api/flows", {
        name: "edit-me",
        steps: ["line one", "line two"],
      });
      const updated = await put(`/api/flows/${f.id}`, {
        name: "edited-name",
        steps: ["only step"],
      });
      if (updated.name !== "edited-name") throw new Error("name not updated");
      if (updated.steps.length !== 1) throw new Error("steps not updated");
      await fetch(`${base}/api/flows/${f.id}`, { method: "DELETE" });
    })
  )
    ok++;

  if (process.env.GEMINI_API_KEY) {
    total++;
    if (
      await run("POST /api/scan (example.com)", async () => {
        await post("/api/scan", { url: "https://example.com", scope: ["navigation"] });
      })
    )
      ok++;

    total++;
    if (
      await run("POST /api/flows + run", async () => {
        const f = await post("/api/flows", {
          name: "API smoke flow",
          steps: ["Navigate to https://example.com", "Assert: URL contains example"],
        });
        await post(`/api/flows/${f.id}/run`, { baseUrl: "https://example.com" });
      })
    )
      ok++;

    total++;
    if (
      await run("POST /api/regression/run", async () => {
        await post("/api/regression/run", {
          url: "https://example.com",
          includeUrlScan: true,
          includeFlows: true,
        });
      })
    )
      ok++;
  } else {
    console.log("SKIP  Gemini-dependent tests (set GEMINI_API_KEY to run)");
  }

  console.log(`\nDone: ${ok}/${total}`);
  process.exit(ok === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
