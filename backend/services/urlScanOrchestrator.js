const { getMcpHost, runMcpAgent } = require("../mcp");
const aiService = require("./aiService");
const { toOrigin } = require("./flowBaseUrl");
const { log } = require("./logEmitter");

const BROWSER_TOOLS = [
  "browser_navigate",
  "browser_snapshot",
  "browser_click",
  "browser_fill",
  "browser_get_url",
  "browser_get_visible_text",
];

/**
 * URL Scan — MCP exploration → E2E scenario plan → Playwright suite → run → pass/fail report.
 */
async function runUrlScanE2E(url) {
  const origin = toOrigin(url) || url;
  const host = getMcpHost();
  host.reset();
  host.registerBuiltinServers(origin);

  log("URL scan: connecting MCP layer (browser + playwright + integrations)", "step");
  await host.connectExternalServers();

  let exploration = { done: false, history: [], error: null };
  try {
    await host.startBrowserSession(origin);

    await host.callTool("browser_navigate", { url });

    log("URL scan phase 1 — live browser exploration (MCP)", "step");
    exploration = await runMcpAgent(host, {
      goal: `Explore ${url} end-to-end. Identify main user journeys (auth, search, forms, navigation). Use browser_snapshot before major actions. Try safe interactions only. Do not submit destructive actions.`,
      allowedTools: BROWSER_TOOLS,
      maxSteps: Number(process.env.MCP_SCAN_EXPLORE_STEPS) || 10,
      baseUrl: origin,
    });
    const snap = await host.callTool("browser_snapshot", {});
    const visible = await host.callTool("browser_get_visible_text", {});

    const explorationSummary = [
      `URL: ${url}`,
      `Agent steps: ${exploration.history.length}`,
      exploration.error ? `Agent error: ${exploration.error}` : "",
      `Visible text sample: ${(visible.text || "").slice(0, 2000)}`,
      `History: ${JSON.stringify(exploration.history.slice(-6))}`,
    ]
      .filter(Boolean)
      .join("\n");

    log("URL scan phase 2 — plan 6–10 E2E scenarios", "step");
    let scenarios = await aiService.planUrlScanScenarios(url, explorationSummary);
    if (!scenarios.length) {
      scenarios = [
        {
          name: "Site loads and shows primary content",
          steps: [`Navigate to ${url}`, "Wait for page to load"],
          assertion: "Main content is visible, not an error page",
          priority: "critical",
        },
      ];
    }

    log(`URL scan phase 3 — generate Playwright suite (${scenarios.length} scenarios)`, "step");
    const gen = await host.callTool("playwright_generate_url_scan_spec", {
      url,
      scenariosJson: JSON.stringify(scenarios),
    });

    log("URL scan phase 4 — run Playwright E2E suite", "step");
    const run = await host.callTool("playwright_run_spec", { specPath: gen.specPath });

    const results = (run.report?.cases || []).map((c) => ({
      testId: c.title,
      name: c.title,
      passed: c.passed,
      error: c.errorMessage,
      duration: c.durationMs,
      screenshot: null,
    }));

    return {
      testCases: scenarios,
      results,
      report: run.report,
      summary: {
        total: run.report?.summary?.total ?? results.length,
        passed: run.report?.summary?.passedCount ?? results.filter((r) => r.passed).length,
        failed: run.report?.summary?.failedCount ?? results.filter((r) => !r.passed).length,
        duration: results.reduce((a, r) => a + (r.duration || 0), 0),
      },
      exploration: { steps: exploration.history.length, error: exploration.error },
      specPath: gen.specPath,
      aiSource: "mcp-e2e-playwright",
    };
  } finally {
    await host.endBrowserSession();
  }
}

module.exports = { runUrlScanE2E };
