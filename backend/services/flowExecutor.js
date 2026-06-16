const fs = require("fs").promises;
const path = require("path");
const aiService = require("./aiService");
const { combineHappyAndNegative } = require("./specWrap");
const { runPlaywrightSpec, projectRoot } = require("./playwrightCli");
const { buildFriendlyFailureOrNull } = require("./friendlyRunReport");
const { humanizePlaywrightError } = require("./humanizeError");
const { sanitizeGeneratedFlowScript } = require("./flowScriptSanitizer");
const { log } = require("./logEmitter");

const tempSpecsDir = path.join(projectRoot, "temp-specs");

function classifyTestTitle(title) {
  const t = String(title || "");
  if (/^NEG:\s*/i.test(t)) return "negative";
  if (/^POS:\s*/i.test(t)) return "positive";
  return "happy_path";
}

function buildReportFromTestRows(testRows, includeScenarioTests) {
  const cases = (testRows || []).map((row) => ({
    kind: classifyTestTitle(row.title),
    title: row.title || "Unnamed test",
    passed: row.status === "passed" || row.status === "skipped",
    durationMs: row.durationMs ?? null,
    errorMessage: row.errorMessage || null,
    plainSummary: row.passed ? null : humanizePlaywrightError(row.errorMessage),
  }));

  const happy =
    cases.find((c) => /happy\s*path/i.test(c.title)) || cases.find((c) => c.kind === "happy_path");
  const negatives = cases.filter((c) => c.kind === "negative");
  const positives = cases.filter((c) => c.kind === "positive");

  const passedCount = cases.filter((c) => c.passed).length;
  const failedCount = cases.length - passedCount;

  return {
    summary: {
      total: cases.length,
      passedCount,
      failedCount,
      happyPassed: happy ? happy.passed : cases.length > 0 && cases.every((c) => c.passed),
      negativePassed: negatives.filter((c) => c.passed).length,
      negativeFailed: negatives.filter((c) => !c.passed).length,
      negativeTotal: negatives.length,
      positivePassed: positives.filter((c) => c.passed).length,
      positiveFailed: positives.filter((c) => !c.passed).length,
      positiveTotal: positives.length,
      includeNegativeTests: includeScenarioTests,
    },
    cases,
  };
}

/**
 * Plain English flow → Playwright spec → run all tests → structured pass/fail report.
 */
async function runFlowWithPlaywright(flow, baseUrl, options = {}) {
  const includeScenarioTests = Boolean(options.includeNegativeTests);
  await fs.mkdir(tempSpecsDir, { recursive: true });

  log(`Generating Playwright script for: ${flow.name}`, "step");
  const happyCode = await aiService.convertFlowToScript(flow, baseUrl);

  let extraCode = "";
  if (includeScenarioTests) {
    log("Generating positive & negative Playwright scenarios (5–10 checks)…", "step");
    const [positiveCode, negativeCode] = await Promise.all([
      aiService.convertFlowToPositiveScripts(flow, baseUrl),
      aiService.convertFlowToNegativeScripts(flow, baseUrl),
    ]);
    extraCode = [positiveCode, negativeCode].filter(Boolean).join("\n\n");
  }

  let specBody = combineHappyAndNegative(flow.name || "Flow", happyCode, extraCode);
  specBody = sanitizeGeneratedFlowScript(specBody, flow);
  const specName = `${flow.id || "flow"}-${Date.now()}.spec.js`;
  const specPath = path.join(tempSpecsDir, specName);
  await fs.writeFile(specPath, specBody, "utf8");

  const testCount = (specBody.match(/\btest\s*\(/g) || []).length;
  log(`Running ${testCount} Playwright test(s)…`, "step");

  const runResult = await runPlaywrightSpec(specPath, {
    jsonReport: true,
    maxFailures: Math.max(testCount, 20),
    testCount,
  });

  let report = buildReportFromTestRows(runResult.testRows, includeScenarioTests);
  if (!report.cases.length && !runResult.passed) {
    report = {
      summary: {
        total: 1,
        passedCount: 0,
        failedCount: 1,
        happyPassed: false,
        negativePassed: 0,
        negativeFailed: 0,
        negativeTotal: 0,
        positivePassed: 0,
        positiveFailed: 0,
        positiveTotal: 0,
        includeNegativeTests: includeScenarioTests,
      },
      cases: [
        {
          kind: "happy_path",
          title: `${flow.name} — happy path`,
          passed: false,
          durationMs: null,
          errorMessage: (runResult.output || "Playwright run failed").slice(0, 500),
        },
      ],
    };
  }
  const overallPassed = report.summary.failedCount === 0 && report.summary.total > 0;

  const friendlyFailure = buildFriendlyFailureOrNull(overallPassed, runResult.output, specBody, flow, {
    specPath,
  });

  return {
    flowId: flow.id,
    name: flow.name,
    passed: overallPassed,
    output: (runResult.output || "").slice(0, 24_000),
    exitCode: runResult.exitCode,
    timedOut: runResult.timedOut,
    friendlyFailure,
    report,
    specPath,
    screenshot: null,
  };
}

module.exports = { runFlowWithPlaywright, buildReportFromTestRows, classifyTestTitle };
