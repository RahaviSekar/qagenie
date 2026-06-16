/**
 * Walk Playwright JSON reporter output and list each test with status + error text.
 */
function walkForTests(node, out, inheritedTitle = "") {
  if (!node || typeof node !== "object") return;

  const nodeTitle = node.title || inheritedTitle;

  if (Array.isArray(node.specs)) {
    for (const spec of node.specs) {
      const specTitle = spec.title || inheritedTitle || "Unnamed test";
      if (Array.isArray(spec.tests)) {
        for (const t of spec.tests) {
          const res = Array.isArray(t.results) ? t.results[0] : null;
          const titlePath =
            Array.isArray(t.titlePath) && t.titlePath.length ? t.titlePath.join(" › ") : specTitle;
          out.push({
            title: t.title || specTitle,
            fullTitle: titlePath,
            status: res?.status || "unknown",
            durationMs: typeof res?.duration === "number" ? res.duration : null,
            errorMessage: res?.error?.message || (typeof res?.error === "string" ? res.error : null) || null,
            specLine: res?.error?.location?.line ?? res?.errorLocation?.line ?? null,
          });
        }
      }
      if (Array.isArray(spec.suites)) {
        for (const nested of spec.suites) walkForTests(nested, out, specTitle);
      }
    }
  }

  if (Array.isArray(node.tests) && !Array.isArray(node.specs)) {
    for (const t of node.tests) {
      const res = Array.isArray(t.results) ? t.results[0] : null;
      const titlePath = Array.isArray(t.titlePath) && t.titlePath.length ? t.titlePath.join(" › ") : "";
      const title = t.title || nodeTitle || titlePath || "Unnamed test";
      out.push({
        title,
        fullTitle: titlePath || title,
        status: res?.status || "unknown",
        durationMs: typeof res?.duration === "number" ? res.duration : null,
        errorMessage: res?.error?.message || (typeof res?.error === "string" ? res.error : null) || null,
        specLine: res?.error?.location?.line ?? res?.errorLocation?.line ?? null,
      });
    }
  }

  if (Array.isArray(node.suites)) {
    for (const s of node.suites) walkForTests(s, out, nodeTitle);
  }
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

function extractGlobalErrors(json) {
  if (!json || !Array.isArray(json.errors)) return [];
  return json.errors.map((e) => ({
    title: "Generated test file — load error",
    fullTitle: e.location?.file || "spec",
    status: "failed",
    durationMs: null,
    errorMessage: e.message || "Unknown error loading spec",
    specLine: e.location?.line ?? null,
  }));
}

function extractTestsFromPlaywrightJson(json) {
  if (!json || typeof json !== "object") return [];
  const out = [];
  walkForTests(json, out);
  if (out.length === 0) {
    out.push(...extractGlobalErrors(json));
  }
  return out;
}

module.exports = { tryParsePlaywrightJsonReport, extractTestsFromPlaywrightJson };
