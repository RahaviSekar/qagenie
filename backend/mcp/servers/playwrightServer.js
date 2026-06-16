const fs = require("fs").promises;
const path = require("path");
const aiService = require("../../services/aiService");
const { combineHappyAndNegative } = require("../../services/specWrap");
const { runPlaywrightSpec, projectRoot } = require("../../services/playwrightCli");
const { buildReportFromTestRows } = require("../../services/flowExecutor");
const { inferFlowRunProfile } = require("../../services/flowRunProfile");
const { sanitizeGeneratedFlowScript } = require("../../services/flowScriptSanitizer");
const { stringProp } = require("../toolSchema");

const tempSpecsDir = path.join(projectRoot, "temp-specs");

/** Playwright MCP server — generate and execute automation scripts. */
function createPlaywrightTools() {
  return [
    {
      name: "playwright_generate_flow_spec",
      description:
        "Convert a saved business flow (name + plain-English steps) into Playwright JavaScript tests. Returns spec source path.",
      inputSchema: {
        type: "object",
        properties: {
          flowName: stringProp("Flow name"),
          stepsJson: stringProp("JSON array of step strings"),
          baseUrl: stringProp("Site origin, e.g. https://app.example.com"),
          includeScenarios: { type: "boolean", description: "Add POS/NEG scenario tests (5–10 total)" },
        },
        required: ["flowName", "stepsJson", "baseUrl"],
      },
      async handler({ flowName, stepsJson, baseUrl, includeScenarios }) {
        const steps = JSON.parse(stepsJson);
        const flow = { name: flowName, steps };
        const happyCode = await aiService.convertFlowToScript(flow, baseUrl);
        let extra = "";
        if (includeScenarios) {
          const profile = inferFlowRunProfile(flow);
          const [pos, neg] = await Promise.all([
            aiService.convertFlowToPositiveScripts(flow, baseUrl, { maxTests: profile.maxPos }),
            aiService.convertFlowToNegativeScripts(flow, baseUrl, { maxTests: profile.maxNeg }),
          ]);
          extra = [pos, neg].filter(Boolean).join("\n\n");
        }
        let body = combineHappyAndNegative(flowName, happyCode, extra);
        body = sanitizeGeneratedFlowScript(body, flow);
        await fs.mkdir(tempSpecsDir, { recursive: true });
        const specPath = path.join(tempSpecsDir, `mcp-flow-${Date.now()}.spec.js`);
        await fs.writeFile(specPath, body, "utf8");
        const testCount = (body.match(/\btest\s*\(/g) || []).length;
        return { ok: true, specPath, testCount, preview: body.slice(0, 500) };
      },
    },
    {
      name: "playwright_generate_url_scan_spec",
      description:
        "Generate a Playwright spec for E2E URL scan from exploration notes and scenario list (JSON).",
      inputSchema: {
        type: "object",
        properties: {
          url: stringProp("Scanned site URL"),
          scenariosJson: stringProp("JSON array of { name, steps[], assertion }"),
        },
        required: ["url", "scenariosJson"],
      },
      async handler({ url, scenariosJson }) {
        const scenarios = JSON.parse(scenariosJson);
        const code = await aiService.generateUrlScanPlaywrightSuite(url, scenarios);
        await fs.mkdir(tempSpecsDir, { recursive: true });
        const specPath = path.join(tempSpecsDir, `mcp-scan-${Date.now()}.spec.js`);
        await fs.writeFile(specPath, code, "utf8");
        const testCount = (code.match(/\btest\s*\(/g) || []).length;
        return { ok: true, specPath, testCount };
      },
    },
    {
      name: "playwright_run_spec",
      description: "Run a Playwright spec file and return pass/fail per test.",
      inputSchema: {
        type: "object",
        properties: { specPath: stringProp("Absolute or project-relative .spec.js path") },
        required: ["specPath"],
      },
      async handler({ specPath, testTimeoutMs }) {
        let testCount = 1;
        try {
          const body = await fs.readFile(specPath, "utf8");
          testCount = Math.max(1, (body.match(/\btest\s*\(/g) || []).length);
        } catch (_) {}
        const run = await runPlaywrightSpec(specPath, {
          jsonReport: true,
          maxFailures: 50,
          testCount,
          testTimeoutMs: testTimeoutMs || undefined,
        });
        const report = buildReportFromTestRows(run.testRows, true);
        return {
          ok: run.passed,
          exitCode: run.exitCode,
          timedOut: run.timedOut,
          report,
          output: (run.output || "").slice(0, 12_000),
        };
      },
    },
  ];
}

module.exports = { createPlaywrightTools };
