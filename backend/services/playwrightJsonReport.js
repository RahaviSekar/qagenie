/**
 * Walk Playwright JSON reporter output and list each test with status + error text.
 */
function walkForTests(node, out) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.tests)) {
    for (const t of node.tests) {
      const res = Array.isArray(t.results) ? t.results[0] : null;
      const titlePath = Array.isArray(t.titlePath) && t.titlePath.length ? t.titlePath.join(" › ") : t.title || "";
      out.push({
        title: t.title || titlePath || "Unnamed test",
        fullTitle: titlePath || t.title || "",
        status: res?.status || "unknown",
        durationMs: typeof res?.duration === "number" ? res.duration : null,
        errorMessage: res?.error?.message || (typeof res?.error === "string" ? res.error : null) || null,
      });
    }
  }
  if (Array.isArray(node.suites)) for (const s of node.suites) walkForTests(s, out);
  if (Array.isArray(node.specs)) for (const s of node.specs) walkForTests(s, out);
}

function tryParsePlaywrightJsonReport(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    /* try last substantial JSON object (some shells add noise) */
  }
  const lines = String(raw || "").split(/\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const slice = lines.slice(i).join("\n").trim();
    if (slice.length < 50 || !slice.startsWith("{")) continue;
    try {
      return JSON.parse(slice);
    } catch {
      /* continue */
    }
  }
  return null;
}

function extractTestsFromPlaywrightJson(json) {
  if (!json || typeof json !== "object") return [];
  const out = [];
  walkForTests(json, out);
  return out;
}

module.exports = { tryParsePlaywrightJsonReport, extractTestsFromPlaywrightJson };
