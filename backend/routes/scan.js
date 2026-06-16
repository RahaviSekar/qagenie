const express = require("express");
const router = express.Router();
const { runUrlScanE2E } = require("../services/urlScanOrchestrator");
const { log } = require("../services/logEmitter");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

async function appendRegressionRun(run) {
  const file = path.join(__dirname, "..", "data", "regressionHistory.json");
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw);
  data.runs = data.runs || [];
  data.runs.unshift(run);
  data.runs = data.runs.slice(0, 50);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

router.post("/", async (req, res) => {
  try {
    const { url, scope } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }
    let normalized;
    try {
      normalized = new URL(url.startsWith("http") ? url : `https://${url}`).href;
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    log(`URL scan (MCP E2E): ${normalized}`, "info");
    const scanRun = await runUrlScanE2E(normalized);
    const testCases = scanRun.testCases || [];
    const results = scanRun.results || [];
    const passed = scanRun.summary?.passed ?? results.filter((r) => r.passed).length;
    const failed = scanRun.summary?.failed ?? results.length - passed;

    const historyRun = {
      id: `run-${uuidv4()}`,
      timestamp: new Date().toISOString(),
      triggeredBy: "url-scan",
      urlScanResults: results,
      flowResults: [],
      summary: {
        total: scanRun.summary?.total ?? results.length,
        passed,
        failed,
        duration: scanRun.summary?.duration ?? 0,
      },
    };
    await appendRegressionRun(historyRun);

    res.json({
      testCases,
      results,
      report: scanRun.report,
      summary: historyRun.summary,
      crawledPages: null,
      regressionRunId: historyRun.id,
      aiSource: scanRun.aiSource || "mcp-e2e-playwright",
      exploration: scanRun.exploration,
      specPath: scanRun.specPath,
      aiWarning: null,
    });
  } catch (e) {
    log(String(e.message || e), "error");
    res.status(500).json({ error: e.message || "Scan failed" });
  }
});

module.exports = router;
