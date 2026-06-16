const fs = require("fs").promises;
const { getMcpHost } = require("../mcp");
const { buildFriendlyFailureOrNull } = require("./friendlyRunReport");
const { inferFlowRunProfile, computeRunTimeoutForSpec } = require("./flowRunProfile");
const { log } = require("./logEmitter");

/**
 * Business flow pipeline:
 * 1) Optional MCP browser preflight (verify site reachable)
 * 2) Plain English → Playwright script (playwright_generate_flow_spec)
 * 3) Run suite → structured pass/fail report
 */
async function runBusinessFlow(flow, baseUrl, options = {}) {
  const includeNegativeTests = Boolean(options.includeNegativeTests);
  const profile = inferFlowRunProfile(flow);
  const host = getMcpHost();
  host.reset();
  host.registerBuiltinServers(baseUrl);

  log("Flow pipeline: MCP preflight + Playwright generation & execution", "step");
  await host.connectExternalServers();

  const skipPreflight = String(process.env.MCP_FLOW_SKIP_PREFLIGHT || "").toLowerCase() === "true";
  if (!skipPreflight) {
    try {
      await host.startBrowserSession(baseUrl);
      await host.callTool("browser_navigate", { url: baseUrl });
      await host.callTool("browser_snapshot", {});
      log("Flow preflight: site opened successfully", "success");
    } catch (e) {
      log(`Flow preflight warning: ${e.message}`, "error");
    } finally {
      await host.endBrowserSession();
    }
  }

  log(`Flow “${flow.name}” @ ${baseUrl}`, "step");
  if (String(process.env.PLAYWRIGHT_HEADED || "").toLowerCase() === "true") {
    log("Using visible Chrome (PLAYWRIGHT_HEADED=true). Watch the Activity log for live [QA Genie] steps.", "step");
  }
  log(
    includeNegativeTests
      ? "Generating Playwright script (happy path + positive & negative — may take 1–3 min)…"
      : "Generating Playwright script…",
    "step"
  );
  const gen = await host.callTool("playwright_generate_flow_spec", {
    flowName: flow.name,
    stepsJson: JSON.stringify(flow.steps || []),
    baseUrl,
    includeScenarios: includeNegativeTests,
  });

  const estMin = Math.round(computeRunTimeoutForSpec(gen.testCount, profile.testTimeoutMs) / 60_000);
  log(
    `Flow pipeline: running ${gen.testCount} test(s) — up to ~${estMin} min allowed (${Math.round(profile.testTimeoutMs / 1000)}s per test)`,
    "step"
  );
  const run = await host.callTool("playwright_run_spec", {
    specPath: gen.specPath,
    testTimeoutMs: profile.testTimeoutMs,
  });

  const overallPassed = run.report?.summary?.failedCount === 0 && (run.report?.summary?.total ?? 0) > 0;
  let specBody = "";
  try {
    specBody = await fs.readFile(gen.specPath, "utf8");
  } catch (_) {}
  const friendlyFailure = buildFriendlyFailureOrNull(overallPassed, run.output || "", specBody, flow, {
    specPath: gen.specPath,
  });

  return {
    flowId: flow.id,
    name: flow.name,
    passed: overallPassed,
    output: run.output || "",
    exitCode: run.exitCode ?? (overallPassed ? 0 : 1),
    timedOut: run.timedOut ?? false,
    friendlyFailure,
    report: run.report,
    specPath: gen.specPath,
    screenshot: null,
    pipeline: "mcp-playwright",
  };
}

module.exports = { runBusinessFlow };
