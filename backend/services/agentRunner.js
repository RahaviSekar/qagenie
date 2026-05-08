const mcpBrowser = require("./mcpBrowser");
const aiService = require("./aiService");
const { log } = require("./logEmitter");

function normalizeCase(raw, i) {
  return {
    id: raw.id || `TC-${String(i + 1).padStart(3, "0")}`,
    name: raw.name || `Generated case ${i + 1}`,
    goal: raw.assertion || "Validate expected behavior",
    assertion: raw.assertion || "Expected behavior is visible",
  };
}

function fallbackCasesForUrl(url) {
  return [
    {
      id: "TC-001",
      name: "Page loads successfully",
      goal: "Confirm the page has loaded and is usable",
      assertion: "A visible webpage is rendered and not blank",
    },
    {
      id: "TC-002",
      name: "Primary interaction is available",
      goal: "Find and interact with one primary element on the page",
      assertion: "At least one meaningful interactive element is available",
    },
    {
      id: "TC-003",
      name: "Basic navigation remains stable",
      goal: "Verify navigation state is stable after one interaction",
      assertion: "The page still appears usable after interaction and did not break visually",
    },
  ];
}

async function runSingleTest(testCase, url, opts = {}) {
  const maxSteps = opts.maxSteps || 10;
  const screenshots = [];
  const history = [];
  const startedAt = Date.now();
  let passed = false;
  let error = null;
  let verification = null;

  await mcpBrowser.navigate(url);
  for (let i = 0; i < maxSteps; i++) {
    const screenshot = await mcpBrowser.screenshot();
    screenshots.push(screenshot);
    log(`Step ${i + 1}: deciding next action for ${testCase.name}`, "step", { screenshot });

    let action;
    try {
      action = await aiService.decideNextAction(screenshot, testCase.goal, history);
    } catch (e) {
      error = e.message;
      break;
    }

    const actionType = String(action.action || "").toLowerCase();
    if (actionType === "done") {
      break;
    }

    if (actionType === "click") {
      const r = await mcpBrowser.click(action.target);
      if (!r.success) error = r.error || "click failed";
      if (r.screenshot) screenshots.push(r.screenshot);
      if (error) break;
    } else if (actionType === "fill") {
      const r = await mcpBrowser.fill(action.target, action.value || "");
      if (!r.success) error = r.error || "fill failed";
      if (r.screenshot) screenshots.push(r.screenshot);
      if (error) break;
    } else if (actionType === "navigate") {
      const shot = await mcpBrowser.navigate(action.target);
      screenshots.push(shot);
    } else if (actionType === "assert") {
      const finalShot = await mcpBrowser.screenshot();
      screenshots.push(finalShot);
      verification = await aiService.verifyAssertion(finalShot, action.assertion || testCase.assertion);
      passed = Boolean(verification.passed);
      if (!passed && verification.reason) error = verification.reason;
      break;
    }

    history.push({
      action: actionType,
      target: action.target || "",
      assertion: action.assertion || "",
    });
  }

  if (!passed && !error && verification == null) {
    const finalShot = await mcpBrowser.screenshot();
    screenshots.push(finalShot);
    verification = await aiService.verifyAssertion(finalShot, testCase.assertion);
    passed = Boolean(verification.passed);
    if (!passed) error = verification.reason || "assertion failed";
  }

  return {
    testId: testCase.id,
    name: testCase.name,
    passed,
    steps_taken: history.length,
    duration: Date.now() - startedAt,
    screenshots,
    screenshot: screenshots[screenshots.length - 1] || null,
    error,
  };
}

async function runUrlScan(url) {
  await mcpBrowser.launch();
  try {
    const firstShot = await mcpBrowser.navigate(url);
    log("Analyzing page using MCP visual context", "step", { screenshot: firstShot });
    const rawCases = await aiService.analyzePageFromScreenshot(firstShot, url);
    let testCases = (Array.isArray(rawCases) ? rawCases : []).slice(0, 8).map(normalizeCase);
    if (testCases.length === 0) {
      log("AI returned no runnable cases; using MCP fallback checks.", "step");
      testCases = fallbackCasesForUrl(url);
    }
    const results = [];
    for (const tc of testCases) {
      log(`Running ${tc.name}`, "step");
      const r = await runSingleTest(tc, url);
      results.push(r);
      log(`${r.passed ? "PASS" : "FAIL"} ${tc.name}`, r.passed ? "success" : "error", r.screenshot ? { screenshot: r.screenshot } : null);
    }
    return { testCases, results };
  } finally {
    await mcpBrowser.close();
  }
}

async function runFlow(flow, baseUrl) {
  const steps = Array.isArray(flow.steps) ? flow.steps : [];
  const results = [];
  for (let i = 0; i < steps.length; i++) {
    const tc = {
      id: `${flow.id || "flow"}-step-${i + 1}`,
      name: `${flow.name} · step ${i + 1}`,
      goal: steps[i],
      assertion: `Step outcome achieved: ${steps[i]}`,
    };
    const r = await runSingleTest(tc, baseUrl);
    results.push(r);
    if (!r.passed) break;
  }
  return {
    flowId: flow.id,
    name: flow.name,
    passed: results.every((r) => r.passed),
    stepsTaken: results.reduce((n, r) => n + (r.steps_taken || 0), 0),
    results,
    screenshot: results[results.length - 1]?.screenshot || null,
  };
}

module.exports = {
  runSingleTest,
  runUrlScan,
  runFlow,
};
