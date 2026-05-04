const express = require("express");
const router = express.Router();
const crawler = require("../services/crawler");
const aiService = require("../services/aiService");
const { runTestCases } = require("../services/playwrightRunner");
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
    const crawled = await crawler.crawl(normalized);
    const gen = await aiService.generateTestCases(crawled, scope);
    const testCases = gen.testCases;
    const results = await runTestCases(testCases.slice(0, 8), normalized);
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    const run = {
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
    await appendRegressionRun(run);

    res.json({
      testCases,
      results,
      summary: run.summary,
      crawledPages: crawled.pages.length,
      regressionRunId: run.id,
      aiSource: gen.source,
      aiWarning: gen.warning || null,
    });
  } catch (e) {
    log(String(e.message || e), "error");
    res.status(500).json({ error: e.message || "Scan failed" });
  }
});

module.exports = router;
