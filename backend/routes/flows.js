const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const aiService = require("../services/aiService");
const { runFlow } = require("../services/agentRunner");
const { resolveFlowBaseUrl } = require("../services/flowBaseUrl");
const { log } = require("../services/logEmitter");

const dataPath = path.join(__dirname, "..", "data", "flows.json");
/** One flow run at a time so rapid clicks do not stack Gemini + Playwright for 15+ minutes. */
let flowRunInProgress = false;

async function readFlows() {
  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw);
}

async function writeFlows(data) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf8");
}

router.get("/", async (_req, res) => {
  try {
    const data = await readFlows();
    res.json(data.flows || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, steps, baseUrl: flowBase } = req.body || {};
    if (!name || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: "name and steps[] required" });
    }
    const data = await readFlows();
    const flow = {
      id: `flow-${uuidv4()}`,
      name: String(name),
      steps: steps.map(String),
      lastResult: null,
      createdAt: new Date().toISOString(),
    };
    if (flowBase != null && String(flowBase).trim()) {
      flow.baseUrl = String(flowBase).trim();
    }
    data.flows = data.flows || [];
    data.flows.push(flow);
    await writeFlows(data);
    res.json(flow);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/edge-cases", async (req, res) => {
  try {
    const { description } = req.body || {};
    if (!description) return res.status(400).json({ error: "description required" });
    const cases = await aiService.generateEdgeCases(String(description));
    res.json({ edgeCases: cases });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, steps, baseUrl: flowBase } = req.body || {};
    const hasBaseKey = Object.prototype.hasOwnProperty.call(req.body || {}, "baseUrl");
    if (name == null && steps == null && !hasBaseKey) {
      return res.status(400).json({ error: "Provide name, steps, and/or baseUrl to update" });
    }
    if (steps != null && (!Array.isArray(steps) || steps.length === 0)) {
      return res.status(400).json({ error: "steps must be a non-empty array when provided" });
    }
    const data = await readFlows();
    const flow = (data.flows || []).find((f) => f.id === req.params.id);
    if (!flow) return res.status(404).json({ error: "Flow not found" });
    if (name != null) {
      const n = String(name).trim();
      if (!n) return res.status(400).json({ error: "name cannot be empty" });
      flow.name = n;
    }
    if (steps != null) flow.steps = steps.map(String);
    if (hasBaseKey) {
      if (flowBase == null || flowBase === "") {
        delete flow.baseUrl;
      } else {
        flow.baseUrl = String(flowBase).trim();
      }
    }
    flow.lastResult = null;
    await writeFlows(data);
    res.json(flow);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/script", async (req, res) => {
  try {
    const data = await readFlows();
    const flow = (data.flows || []).find((f) => f.id === req.params.id);
    if (!flow) return res.status(404).json({ error: "Flow not found" });
    const baseUrl = resolveFlowBaseUrl(flow, req.body?.baseUrl);
    const code = await aiService.convertFlowToScript(flow, baseUrl);
    res.json({ flowId: flow.id, code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function runSingleFlow(flow, requestBaseUrl) {
  const baseUrl = resolveFlowBaseUrl(flow, requestBaseUrl);
  log(`Running flow in MCP mode: ${flow.name}`, "step");
  const agentResult = await runFlow(flow, baseUrl);
  const cases = (agentResult.results || []).map((r) => ({
    kind: "happy_path",
    title: r.name,
    passed: r.passed,
    durationMs: r.duration || null,
    errorMessage: r.error || null,
  }));
  const happyPassed = agentResult.passed;
  const overallPassed = agentResult.passed;
  const friendlyFailure = overallPassed
    ? null
    : {
        headline: "The flow failed during agentic MCP execution.",
        stepSummary: agentResult.results.find((r) => !r.passed)?.name || flow.name,
        stepNumber: null,
        flowStepText: null,
        scriptCommentLabel: null,
        whatHappened: agentResult.results.find((r) => !r.passed)?.error || "Assertion failed.",
        suggestions: ["Re-run with a more explicit step description.", "Check if UI labels changed from expected text."],
        progress: null,
        technical: { failureLine: null, waitingFor: null, errorSnippet: agentResult.results.find((r) => !r.passed)?.error || null },
        oneLineSummary: `Flow failed: ${flow.name}`,
      };

  return {
    flowId: flow.id,
    name: flow.name,
    passed: overallPassed,
    output: "",
    exitCode: overallPassed ? 0 : 1,
    timedOut: false,
    friendlyFailure,
    report: {
      summary: {
        total: cases.length,
        passedCount: cases.filter((c) => c.passed).length,
        failedCount: cases.filter((c) => !c.passed).length,
        happyPassed,
        negativePassed: 0,
        negativeFailed: 0,
        negativeTotal: 0,
        includeNegativeTests: false,
      },
      cases,
    },
    screenshot: agentResult.screenshot || null,
  };
}

router.post("/run", async (req, res) => {
  if (flowRunInProgress) {
    return res.status(409).json({
      error:
        "A flow run is already in progress. Wait for it to finish, or increase timeouts only if needed (PLAYWRIGHT_RUN_TIMEOUT_MS).",
    });
  }
  flowRunInProgress = true;
  try {
    const requestBase = req.body?.baseUrl;
    const data = await readFlows();
    const flows = data.flows || [];
    const results = [];
    for (const flow of flows) {
      const r = await runSingleFlow(flow, requestBase);
      results.push(r);
      const rs = r.report?.summary;
      flow.lastResult = r.passed
        ? { passed: true, at: new Date().toISOString(), ...(rs ? { reportSummary: rs } : {}) }
        : {
            passed: false,
            at: new Date().toISOString(),
            failureSummary: r.friendlyFailure?.oneLineSummary || "Run failed.",
            ...(rs ? { reportSummary: rs } : {}),
          };
    }
    await writeFlows(data);
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    flowRunInProgress = false;
  }
});

router.post("/:id/run", async (req, res) => {
  if (flowRunInProgress) {
    return res.status(409).json({
      error:
        "A flow run is already in progress. Wait for it to finish before starting another.",
    });
  }
  flowRunInProgress = true;
  try {
    const data = await readFlows();
    const flow = (data.flows || []).find((f) => f.id === req.params.id);
    if (!flow) return res.status(404).json({ error: "Flow not found" });
    const r = await runSingleFlow(flow, req.body?.baseUrl);
    const rs = r.report?.summary;
    flow.lastResult = r.passed
      ? { passed: true, at: new Date().toISOString(), ...(rs ? { reportSummary: rs } : {}) }
      : {
          passed: false,
          at: new Date().toISOString(),
          failureSummary: r.friendlyFailure?.oneLineSummary || "Run failed.",
          ...(rs ? { reportSummary: rs } : {}),
        };
    await writeFlows(data);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    flowRunInProgress = false;
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const data = await readFlows();
    data.flows = (data.flows || []).filter((f) => f.id !== req.params.id);
    await writeFlows(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
