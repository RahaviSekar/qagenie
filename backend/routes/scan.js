const express = require("express");
const router = express.Router();
const { runUrlScan } = require("../services/agentRunner");
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

    log(`URL scan requested: ${normalized}`, "info");
    log("Launching MCP browser...", "step");
    const scanRun = await runUrlScan(normalized);
    const testCases = scanRun.testCases || [];
    const results = scanRun.results || [];
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    const historyRun = {
      id: `run-${uuidv4()}`,
      timestamp: new Date().toISOString(),
      triggeredBy: "url-scan",
      urlScanResults: results,
      flowResults: [],
      summary: {
        total: results.length,
        passed,
        failed,
        duration: results.reduce((a, r) => a + (r.duration || 0), 0),
      },
    };
    await appendRegressionRun(historyRun);

    res.json({
      testCases,
      results,
      summary: historyRun.summary,
      crawledPages: null,
      regressionRunId: historyRun.id,
      aiSource: "gemini-vision-mcp",
      aiWarning: null,
    });
  } catch (e) {
    log(String(e.message || e), "error");
    res.status(500).json({ error: e.message || "Scan failed" });
  }
});

module.exports = router;
