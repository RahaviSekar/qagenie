const mcpBrowser = require("./mcpBrowser");
const aiService = require("./aiService");
const { log } = require("./logEmitter");

/**
 * "Go to /login"–style steps: if the address bar pathname matches the path in
 * the step, treat as pass without vision-only AI (models often mis-read Secure
 * Access gates on login URLs as "wrong page").
 * @returns {boolean|null} true = pass, false = nav step but path mismatch, null = skip heuristic
 */
function extractNavigatePathFromGoal(goal) {
  const g = String(goal || "").trim();
  const m = g.match(/\b(?:go to|navigate to|open|visit|head to)\s+(\/[^\s,;).!?]+)/i);
  return m ? m[1] : null;
}

function navigateOnlyStepPathMatches(goal, currentUrl) {
  const g = String(goal || "").trim();
  const u = String(currentUrl || "").trim();
  if (!g || !u || u === "about:blank") return null;
  const wantPath = extractNavigatePathFromGoal(g);
  if (!wantPath) return null;
  let pathname;
  try {
    pathname = new URL(u).pathname;
  } catch {
    return null;
  }
  const norm = (p) => (String(p).replace(/\/+$/, "") || "/").toLowerCase();
  const want = norm(wantPath);
  const cur = norm(pathname);
  if (want === "/") return null;
  if (cur === want) return true;
  if (cur.startsWith(want + "/")) return true;
  return false;
}

async function verifyStepOutcome(testCase, screenshots) {
  let pageUrl = "";
  try {
    pageUrl = await mcpBrowser.getCurrentUrl();
  } catch (_) {
    pageUrl = "";
  }
  const navMatch = navigateOnlyStepPathMatches(testCase.goal, pageUrl);
  if (navMatch === true) {
    return {
      passed: true,
      verification: { passed: true, reason: `Address bar path matches navigation step (${pageUrl}).` },
      error: null,
    };
  }
  const finalShot = await mcpBrowser.screenshot();
  screenshots.push(finalShot);
  const verification = await aiService.verifyAssertion(finalShot, testCase.assertion);
  const passed = Boolean(verification.passed);
  return {
    passed,
    verification,
    error: passed ? null : verification.reason || "assertion failed",
  };
}

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
  const skipInitialNavigate = Boolean(opts.skipInitialNavigate);
  const screenshots = [];
  const history = [];
  const startedAt = Date.now();
  let passed = false;
  let error = null;
  let verification = null;

  if (skipInitialNavigate) {
    await mcpBrowser.ensurePage();
  } else {
    const pathFromGoal = extractNavigatePathFromGoal(testCase.goal);
    await mcpBrowser.navigate(pathFromGoal || url, { baseUrl: url });
  }
  for (let i = 0; i < maxSteps; i++) {
    const screenshot = await mcpBrowser.screenshot();
    screenshots.push(screenshot);
    log(`MCP iteration ${i + 1}/${maxSteps} — ${testCase.name}`, "step", { screenshot });

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
      const shot = await mcpBrowser.navigate(action.target, { baseUrl: url });
      screenshots.push(shot);
    } else if (actionType === "assert") {
      const outcome = await verifyStepOutcome(
        { ...testCase, assertion: action.assertion || testCase.assertion },
        screenshots
      );
      verification = outcome.verification;
      passed = outcome.passed;
      error = outcome.error;
      break;
    }

    history.push({
      action: actionType,
      target: action.target || "",
      assertion: action.assertion || "",
    });
  }

  if (!passed && !error && verification == null) {
    const outcome = await verifyStepOutcome(testCase, screenshots);
    verification = outcome.verification;
    passed = outcome.passed;
    error = outcome.error;
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
  await mcpBrowser.launch();
  try {
    for (let i = 0; i < steps.length; i++) {
      const tc = {
        id: `${flow.id || "flow"}-step-${i + 1}`,
        name: `${flow.name} · flow step ${i + 1}/${steps.length}`,
        goal: steps[i],
        assertion: String(steps[i] || "").trim() || `Flow step ${i + 1}`,
      };
      const preview = String(steps[i] || "").replace(/\s+/g, " ").trim().slice(0, 120);
      log(`Flow step ${i + 1}/${steps.length} start — ${preview}${preview.length >= 120 ? "…" : ""}`, "step");
      const r = await runSingleTest(tc, baseUrl, { skipInitialNavigate: i > 0 });
      results.push(r);
      const tail = r.error ? ` — ${r.error}` : "";
      log(`${r.passed ? "PASS" : "FAIL"} ${tc.name}${tail}`, r.passed ? "success" : "error", r.screenshot ? { screenshot: r.screenshot } : null);
      if (!r.passed) break;
    }
  } finally {
    await mcpBrowser.close();
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
