const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const crawler = require("../services/crawler");
const aiService = require("../services/aiService");
const { runTestCases } = require("../services/playwrightRunner");
const { runPlaywrightSpec } = require("../services/playwrightCli");
const { wrapPlaywrightSpec } = require("../services/specWrap");
const { resolveFlowBaseUrl } = require("../services/flowBaseUrl");
const { buildFriendlyFailureOrNull, stripAnsi } = require("../services/friendlyRunReport");
const { log } = require("../services/logEmitter");
const historyPath = path.join(__dirname, "..", "data", "regressionHistory.json");

async function readHistory() {
  const raw = await fs.readFile(historyPath, "utf8");
  return JSON.parse(raw);
}

async function runRegression({ url, includeUrlScan, includeFlows, triggeredBy = "manual" }) {
  const flowResults = [];
  const urlScanResults = [];
  const t0 = Date.now();

  if (includeFlows) {
    const data = JSON.parse(await fs.readFile(path.join(__dirname, "..", "data", "flows.json"), "utf8"));
    for (const flow of data.flows || []) {
      try {
        const baseUrl = resolveFlowBaseUrl(flow, url);
        const code = await aiService.convertFlowToScript(flow, baseUrl);
        const specDir = path.join(__dirname, "..", "..", "temp-specs");
        await fs.mkdir(specDir, { recursive: true });
        const specPath = path.join(specDir, `${flow.id}-reg-${Date.now()}.spec.js`);
        const wrapped = wrapPlaywrightSpec(flow.name, code);
        await fs.writeFile(specPath, wrapped, "utf8");
        const mod = await runPlaywrightSpec(specPath);
        let specContent = "";
        try {
          specContent = await fs.readFile(specPath, "utf8");
        } catch {
          /* ignore */
        }
        const friendlyFailure = buildFriendlyFailureOrNull(mod.passed, mod.output, specContent, flow);
        flowResults.push({
          flowId: flow.id,
          name: flow.name,
          passed: mod.passed,
          output: stripAnsi(mod.output).slice(-4000),
          friendlyFailure,
        });
      } catch (e) {
        flowResults.push({ flowId: flow.id, name: flow.name, passed: false, error: e.message });
      }
    }
  }

  if (includeUrlScan && url) {
    let normalized;
    try {
      normalized = new URL(url.startsWith("http") ? url : `https://${url}`).href;
    } catch (e) {
      throw new Error("Invalid URL for regression scan");
    }
    const crawled = await crawler.crawl(normalized);
    const gen = await aiService.generateTestCases(crawled, []);
    const testCases = gen.testCases;
    const results = await runTestCases(testCases.slice(0, 6), normalized);
    urlScanResults.push(...results);
  }

  const passed =
    urlScanResults.filter((r) => r.passed).length + flowResults.filter((r) => r.passed).length;
  const failed =
    urlScanResults.filter((r) => !r.passed).length + flowResults.filter((r) => !r.passed).length;

  const run = {
    id: `run-${uuidv4()}`,
    timestamp: new Date().toISOString(),
    triggeredBy,
    urlScanResults,
    flowResults,
    summary: {
      total: urlScanResults.length + flowResults.length,
      passed,
      failed,
      duration: Date.now() - t0,
    },
  };

  const hist = await readHistory();
  hist.runs = hist.runs || [];
  hist.runs.unshift(run);
  hist.runs = hist.runs.slice(0, 50);
  await fs.writeFile(historyPath, JSON.stringify(hist, null, 2), "utf8");
  return run;
}

router.post("/run", async (req, res) => {
  try {
    const { url, includeUrlScan = true, includeFlows = true } = req.body || {};
    const run = await runRegression({ url, includeUrlScan, includeFlows, triggeredBy: "manual" });
    res.json(run);
  } catch (e) {
    log(e.message, "error");
    res.status(500).json({ error: e.message });
  }
});

router.get("/history", async (_req, res) => {
  try {
    const hist = await readHistory();
    const runs = (hist.runs || []).slice(0, 10);
    res.json(runs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/diff/:runId", async (req, res) => {
  try {
    const hist = await readHistory();
    const runs = hist.runs || [];
    const idx = runs.findIndex((r) => r.id === req.params.runId);
    if (idx === -1) return res.status(404).json({ error: "Run not found" });
    const cur = runs[idx];
    const prev = runs[idx + 1];
    if (!prev) {
      return res.json({ newFailures: [], newPasses: [], unchanged: [], note: "No previous run" });
    }
    const curFail = new Set(
      [...(cur.urlScanResults || []), ...(cur.flowResults || [])]
        .filter((x) => !x.passed)
        .map((x) => x.testId || x.name || x.flowId)
    );
    const prevFail = new Set(
      [...(prev.urlScanResults || []), ...(prev.flowResults || [])]
        .filter((x) => !x.passed)
        .map((x) => x.testId || x.name || x.flowId)
    );
    const newFailures = [...curFail].filter((id) => !prevFail.has(id));
    const newPasses = [...prevFail].filter((id) => !curFail.has(id));
    const unchanged = [...curFail].filter((id) => prevFail.has(id));
    res.json({ newFailures, newPasses, unchanged });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/snapshot", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "url required" });
    const normalized = new URL(url.startsWith("http") ? url : `https://${url}`).href;
    const snap = await crawler.saveSnapshot(normalized);
    res.json({ snapshotId: snap.id, url: normalized });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/check-changes", async (req, res) => {
  try {
    const { url, snapshotId } = req.body || {};
    if (!url || !snapshotId) return res.status(400).json({ error: "url and snapshotId required" });
    const normalized = new URL(url.startsWith("http") ? url : `https://${url}`).href;
    const previous = await crawler.loadSnapshot(snapshotId);
    const diff = await crawler.detectUIChanges(normalized, previous);
    let regressionRun = null;
    if (diff.hasChanges) {
      log("UI changes detected — running regression", "step");
      regressionRun = await runRegression({
        url: normalized,
        includeUrlScan: true,
        includeFlows: true,
        triggeredBy: "ui-change",
      });
    }
    res.json({ ...diff, regressionRun });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/export/:runId", async (req, res) => {
  try {
    const format = (req.query.format || "json").toLowerCase();
    const hist = await readHistory();
    const run = (hist.runs || []).find((r) => r.id === req.params.runId);
    if (!run) return res.status(404).json({ error: "Run not found" });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="qa-genie-${run.id}.json"`);
      return res.send(JSON.stringify(run, null, 2));
    }

    if (format === "markdown") {
      const lines = [
        `# QA Genie report — ${run.id}`,
        "",
        `- **When:** ${run.timestamp}`,
        `- **Total:** ${run.summary?.total ?? 0} · **Passed:** ${run.summary?.passed ?? 0} · **Failed:** ${run.summary?.failed ?? 0}`,
        "",
        "## URL scan / automated checks",
        ...((run.urlScanResults || []).map(
          (r) => `- ${r.passed ? "✅" : "❌"} ${r.name || r.testId}${r.error ? ` — ${r.error}` : ""}`
        )),
        "",
        "## Flows",
        ...((run.flowResults || []).map((r) => `- ${r.passed ? "✅" : "❌"} ${r.name || r.flowId}`)),
      ];
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="qa-genie-${run.id}.md"`);
      return res.send(lines.join("\n"));
    }

    if (format === "html") {
      const rows = [...(run.urlScanResults || []), ...(run.flowResults || [])]
        .map((r) => {
          const ok = r.passed;
          const name = r.name || r.testId || r.flowId || "—";
          const img = r.screenshot
            ? `<br/><img alt="failure" src="data:image/png;base64,${r.screenshot}" style="max-width:480px"/>`
            : "";
          return `<tr style="background:${ok ? "#e8f5e9" : "#ffebee"}"><td>${name}</td><td>${ok ? "PASS" : "FAIL"}</td><td>${(r.error || "").replace(/</g, "&lt;")}${img}</td></tr>`;
        })
        .join("");
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report ${run.id}</title></head><body>
<h1>QA Genie</h1><p>${run.timestamp} — passed ${run.summary?.passed}/${run.summary?.total}</p>
<table border="1" cellpadding="8"><thead><tr><th>Test</th><th>Result</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="qa-genie-${run.id}.html"`);
      return res.send(html);
    }

    res.status(400).json({ error: "format must be html, json, or markdown" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.runRegression = runRegression;
module.exports = router;
