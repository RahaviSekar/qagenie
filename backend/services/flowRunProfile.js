const { getTestTimeoutMs, computeRunTimeoutMs } = require("./playwrightCli");

function getMaxScenarioTestsPerKind() {
  const n = Number(process.env.FLOW_MAX_SCENARIO_TESTS_PER_KIND);
  if (Number.isFinite(n) && n > 0) return Math.min(6, Math.floor(n));
  return 3;
}

/**
 * Long waits in plain-English steps → higher Playwright timeouts.
 */
function inferFlowRunProfile(flow) {
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];
  const text = steps.join("\n").toLowerCase();
  const slowHints = /\b(\d+\s*min|upto\s*\d+|up to\s*\d+|wait.*min|120\s*000|120000)\b/i.test(text);
  const stepCount = steps.length;

  let testTimeoutMs = getTestTimeoutMs();
  if (slowHints) testTimeoutMs = Math.max(testTimeoutMs, 300_000);
  if (stepCount >= 6) testTimeoutMs = Math.max(testTimeoutMs, 240_000);

  return {
    testTimeoutMs,
    slowHints,
    stepCount,
    maxPos: getMaxScenarioTestsPerKind(),
    maxNeg: getMaxScenarioTestsPerKind(),
  };
}

function computeRunTimeoutForSpec(testCount, testTimeoutMs) {
  return computeRunTimeoutMs(testCount, testTimeoutMs);
}

module.exports = {
  inferFlowRunProfile,
  getMaxScenarioTestsPerKind,
  computeRunTimeoutForSpec,
};
