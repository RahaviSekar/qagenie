/**
 * Turn Playwright CLI output into short, non-technical explanations for QA Genie users.
 */

const fs = require("fs");
const path = require("path");
const { summarizeStepForReport } = require("./flowStepParser");

const projectRoot = path.join(__dirname, "..", "..");

const ANSI_RE = /\u001b\[[0-9;]*m/g;

function stripAnsi(text) {
  return String(text || "").replace(ANSI_RE, "");
}

/** All .spec.js:line:col positions in document order */
function findSpecStackLines(output) {
  const plain = stripAnsi(output);
  const re = /([a-zA-Z0-9._-]+\.spec\.js):(\d+):(\d+)/g;
  const hits = [];
  let m;
  while ((m = re.exec(plain)) !== null) {
    hits.push({ file: m[1], line: parseInt(m[2], 10), col: parseInt(m[3], 10) });
  }
  return hits;
}

/** End line (1-based) of the happy-path test block in the spec file. */
function findHappyPathEndLine(specContent) {
  if (!specContent) return null;
  const lines = specContent.split(/\r?\n/);
  let happyStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\btest\s*\(/.test(lines[i]) && /happy\s*path/i.test(lines[i])) {
      happyStart = i;
      break;
    }
  }
  if (happyStart < 0) return null;
  for (let i = happyStart + 1; i < lines.length; i++) {
    if (/\btest\s*\(/.test(lines[i]) && !/happy\s*path/i.test(lines[i])) {
      return i;
    }
  }
  return lines.length;
}

/** Prefer failure inside the happy-path test — not invented POS/NEG tests. */
function pickFailureLine(output, specContent) {
  const hits = findSpecStackLines(output);
  if (!hits.length) return null;
  const happyEnd = findHappyPathEndLine(specContent);
  if (happyEnd != null) {
    const inHappy = hits.filter((h) => h.line <= happyEnd);
    if (inHappy.length) return inHappy[inHappy.length - 1].line;
  }
  return hits[hits.length - 1].line;
}

/**
 * Map 1-based line in final spec file to the nearest preceding step comment, if any.
 */
function findNearestStepComment(specContent, failureLine) {
  if (!failureLine || !specContent) return null;
  const lines = specContent.split(/\r?\n/);
  let best = null;
  const max = Math.min(failureLine, lines.length);
  for (let i = 0; i < max; i++) {
    const line = lines[i];
    const stepM = line.match(/\/\/\s*Step\s+(\d+)\s*[:\.\-]?\s*(.*)$/i);
    const numM = line.match(/\/\/\s*(\d+)\.\s+(.*)$/);
    if (stepM) {
      best = {
        stepNumber: parseInt(stepM[1], 10),
        label: (stepM[2] || "").trim(),
        specLine: i + 1,
      };
    } else if (numM && !/\/\/\s*\d{4}-\d{2}/.test(line)) {
      const n = parseInt(numM[1], 10);
      if (n >= 1 && n <= 99) {
        best = {
          stepNumber: n,
          label: (numM[2] || "").trim(),
          specLine: i + 1,
        };
      }
    }
  }
  return best;
}

function extractWaitingFor(output) {
  const plain = stripAnsi(output);
  const lines = plain.split(/\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    const m = t.match(/^-\s*waiting\s+for\s+(.+)$/i) || t.match(/waiting\s+for\s+(.+)/i);
    if (m) return m[1].trim().slice(0, 500);
  }
  return null;
}

function extractFirstErrorLine(output) {
  const plain = stripAnsi(output);
  const m = plain.match(/^(TimeoutError|Error|AssertionError):[^\n]*/m);
  if (m) return m[0].trim().slice(0, 300);
  const lines = plain.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (/Error:/i.test(l) && l.length < 400) return l;
  }
  return null;
}

function classify(plain) {
  const lower = plain.toLowerCase();
  const waiting = extractWaitingFor(plain);

  if (/has already been declared|syntaxerror:.*\.spec\.js/i.test(lower)) {
    return {
      kind: "spec_syntax",
      headline: "The generated test file had invalid syntax and could not run.",
      body:
        "This was a duplicate helper in the script (e.g. qaStep declared twice). Restart the server and Run again — your checklist does not need to change.",
      tips: ["Restart the backend, then click Run again.", "If it persists, use Script to download and inspect the file."],
      waiting,
    };
  }

  if (/outside of the viewport|element is outside of the viewport/i.test(lower)) {
    return {
      kind: "viewport_click",
      headline: "The menu link was found but Playwright could not click it in the visible area.",
      body:
        "Common on storefronts: a cookie banner, sticky header, or a duplicate hidden mobile menu link. The updated script dismisses cookies, scrolls the real a.main-menu-link into view, and retries the click.",
      tips: [
        "Restart the server and Run again — watch the Activity log for lines like “Accepted cookie banner” and “Click top nav: Decor”.",
        "Keep PLAYWRIGHT_HEADED=true if the site uses bot checks.",
      ],
      waiting,
    };
  }

  if (
    /performing security verification|verify you are not a bot|security service to protect|just a moment|checking your browser before accessing/i.test(
      lower
    )
  ) {
    return {
      kind: "bot_challenge",
      headline: "The site showed a bot / security check — not your real storefront.",
      body:
        'Automated Chrome hit Cloudflare (or similar) before menu items like "Decor" could load. Your flow steps are fine; the browser never reached the page in your screenshot.',
      tips: [
        "Add PLAYWRIGHT_HEADED=true to .env, restart the server, and re-run (visible browser often passes checks).",
        "Ask your team for a staging URL without bot protection, or allowlist QA automation traffic.",
        "If it still fails, the site may block all automation — use a manual recorder or locator hints on a reachable environment.",
      ],
      waiting,
    };
  }

  if (/aborted: exceeded playwright_run_timeout|\[qa genie\] aborted/i.test(plain)) {
    return {
      kind: "run_wall_timeout",
      headline: "The full test run was stopped because it ran too long.",
      body:
        "QA Genie limits how long a browser test can run so the app does not freeze. The page may be very slow, or the test may be stuck repeating an action.",
      tips: [
        "Try a shorter flow or fewer steps.",
        "Ask your team to raise PLAYWRIGHT_RUN_TIMEOUT_MS in the server environment if runs legitimately need more time.",
      ],
    };
  }

  if (/navigation timeout|timeout \d+ms exceeded.*goto|waiting until.*load/i.test(lower) && /goto|navigate/i.test(lower)) {
    return {
      kind: "nav_timeout",
      headline: "The page took too long to open or finish loading.",
      body:
        "The browser tried to open a URL but the page did not become ready in time. The site might be down, very slow, or blocking automated access.",
      tips: ["Check that the site loads in a normal browser.", "Confirm the base URL and path are correct."],
    };
  }

  if (/timeouterror|timeout \d+ms exceeded/i.test(lower)) {
    if (/\.click\(|locator\.click/i.test(lower) || /waiting for.*click/i.test(lower)) {
      return {
        kind: "timeout_click",
        headline: "The test tried to click something, but that control was not ready in time.",
        body:
          "Usually the page layout is different than expected, the button or link is hidden or disabled, or the test targeted the wrong item (for example, a breadcrumb instead of a search result).",
        tips: [
          "Edit the flow step to describe the button or row more clearly (for example, “under Search Results, click Select on the third company”).",
          "Run the same steps manually once to confirm what appears on screen.",
        ],
        waiting,
      };
    }
    if (/\.fill\(|locator\.fill|waiting for.*getbyrole\('textbox/i.test(lower)) {
      return {
        kind: "timeout_fill",
        headline: "The test could not find or fill in a form field in time.",
        body:
          "The field may have a different label than the test expected, or a previous screen (such as a password gate) was not completed.",
        tips: ["Use the same words you see on the page for labels and buttons.", "Mention any pop-up or “Secure Access” step explicitly in your flow."],
        waiting,
      };
    }
    return {
      kind: "timeout_generic",
      headline: "Something on the page did not appear or respond in time.",
      body:
        "The automated browser waited for a control or condition that never became ready. The site may load slowly or the page may differ from what the test assumed.",
      tips: ["Check the Technical details for what the tool was waiting for.", "Simplify the step or add more specific wording."],
      waiting,
    };
  }

  if (/strict mode violation/i.test(lower)) {
    if (/\.or\(/i.test(lower) && /toBeVisible/i.test(lower) && /secure access|password to continue/i.test(lower)) {
      return {
        kind: "strict_gate_or",
        headline: "The password gate check was written in a way that matched two things at once.",
        body:
          "The automated test combined a heading and a sentence (for example “Secure Access” and “Enter the password to continue”) with “either/or.” On your page both are visible, so Playwright sees two elements instead of one and stops with strict mode.",
        tips: [
          "Re-run the flow: QA Genie’s script template was updated so new runs use a single heading check for that screen.",
          "You do not need to change your checklist wording for this specific error.",
        ],
        waiting,
      };
    }
    if (/getbyrole\(['"]link['"]/i.test(lower) && /decor|furniture|mirror|navigation/i.test(lower)) {
      return {
        kind: "strict_nav",
        headline: "The menu link matched more than one item on the page (strict mode).",
        body:
          'A partial name like /decor/i can match both "Decor" and "HOME DECOR". The test must use the exact menu label (e.g. /^decor$/i) and .first(), often scoped to the top navigation.',
        tips: [
          'Re-run the flow — new scripts use exact menu names from your checklist.',
          'Optional: add a locator hint on the step, e.g. click "Decor" >> getByRole(\'navigation\').getByRole(\'link\', { name: /^decor$/i }).first()',
        ],
        waiting,
      };
    }
    return {
      kind: "strict",
      headline: "More than one element matched what the test tried to use.",
      body: "The page has several similar buttons or links, so the test is not sure which one to choose.",
      tips: ["Describe which area of the page to use (for example, “in the search results, not the top menu”)."],
      waiting,
    };
  }

  if (/net::err_|econnrefused|getaddrinfo|certificate|ssl/i.test(lower)) {
    return {
      kind: "network",
      headline: "The browser could not reach the website or had a connection problem.",
      body: "This is often a wrong URL, firewall, VPN, or SSL issue—not a mistake in your written steps.",
      tips: ["Open the same URL in a normal browser on the same machine.", "Check VPN and corporate proxies."],
    };
  }

  if (/expect\(.*\)\.toBeVisible|expect\(.*\)\.toHaveURL/i.test(lower)) {
    if (
      /getbyrole\(['"]heading['"]/i.test(lower) &&
      (/element\(s\)\s+not\s+found|0\s+elements|not\s+found/i.test(lower) || /timeout:\s*\d+ms/i.test(lower))
    ) {
      return {
        kind: "assertion_heading_missing",
        headline: "The test looked for a section title as a “heading” on the page, but nothing matched.",
        body:
          "The generated script often checks for text like “Personal Information” using an accessibility role that only real headings have. Your screen may use different wording, a styled div instead of a heading, or the section may still be loading.",
        tips: [
          "Re-run the flow after saving—new scripts wait on form fields instead of section headings when possible.",
          "If it still fails, shorten that step to the exact field labels you see (for example “fill First name, Last name, Email”).",
        ],
        waiting,
      };
    }
    return {
      kind: "assertion",
      headline: "The test expected to see something on the page, but it did not happen.",
      body: "An automatic check (for example, text or a URL) did not match what appeared after the previous actions.",
      tips: ["Adjust the flow or expectations if the product changed.", "See Technical details for the exact check that failed."],
    };
  }

  const errLine = extractFirstErrorLine(plain);
  return {
    kind: "unknown",
    headline: "The automated browser test reported an error.",
    body: errLine
      ? "Details are summarized below; the technical log has the full message."
      : "See Technical details for the raw log from the browser test.",
    tips: ["If this keeps happening, share the Technical details with your development team."],
    waiting,
  };
}

/** Playwright writes bot-check page snapshots here — stdout often omits them. */
function appendLatestErrorContext(plain, specPath) {
  if (!specPath) return plain;
  try {
    const slug = path.basename(specPath).replace(/\.spec\.js$/i, "").slice(0, 28);
    const resultsRoot = path.join(projectRoot, "test-results");
    if (!fs.existsSync(resultsRoot)) return plain;
    const dirs = fs
      .readdirSync(resultsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.includes(slug))
      .map((d) => d.name)
      .sort()
      .reverse();
    for (const dir of dirs) {
      const ctxPath = path.join(resultsRoot, dir, "error-context.md");
      if (fs.existsSync(ctxPath)) {
        const full = fs.readFileSync(ctxPath, "utf8");
        // Omit the huge accessibility snapshot — it contains unrelated strings (e.g. Cloudflare footer links)
        // that falsely trigger bot-page classification.
        const snap = full.indexOf("\n# Page snapshot\n");
        const clipped = snap > 0 ? full.slice(0, snap) : full.slice(0, 6000);
        return `${plain}\n\n${clipped}`;
      }
    }
  } catch (_) {
    /* ignore */
  }
  return plain;
}

/**
 * @param {string} output - raw Playwright stdout/stderr
 * @param {string} specContent - final written spec (wrapped) source
 * @param {{ steps?: string[] }} flow - saved flow with plain-English steps
 * @param {{ specPath?: string }} [opts]
 */
function buildFriendlyFailure(output, specContent, flow, opts = {}) {
  const plain = appendLatestErrorContext(stripAnsi(output), opts.specPath);
  const failureLine = pickFailureLine(plain, specContent);
  const comment = findNearestStepComment(specContent, failureLine);
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];
  const flowStepIndex = comment && comment.stepNumber >= 1 && comment.stepNumber <= steps.length ? comment.stepNumber - 1 : null;
  const flowStepText = flowStepIndex != null ? steps[flowStepIndex] : null;

  const cls = classify(plain);
  const waiting = cls.waiting || extractWaitingFor(plain);

  const stepNum = comment?.stepNumber ?? null;
  const completedSteps = [];
  if (stepNum != null && stepNum > 1 && steps.length) {
    const upto = Math.min(stepNum - 1, steps.length);
    for (let i = 0; i < upto; i++) {
      completedSteps.push({
        number: i + 1,
        text: steps[i],
        summary: summarizeStepForReport(steps[i]),
      });
    }
  }

  const stepParts = [];
  if (comment?.stepNumber != null) {
    stepParts.push(`Script step ${comment.stepNumber}`);
  }
  if (flowStepText) {
    stepParts.push(`Your checklist: “${flowStepText}”`);
  } else if (comment?.label) {
    stepParts.push(comment.label);
  }

  const stepSummary =
    stepParts.length > 0
      ? stepParts.join(" — ")
      : failureLine
        ? `The failure was detected around line ${failureLine} of the generated browser test (no step comment was found above that line).`
        : "We could not tell exactly which line of the generated test failed.";

  const oneLine = (() => {
    const bit = flowStepText || comment?.label;
    if (!bit) return cls.headline.slice(0, 220);
    const shortBit = bit.length > 72 ? `${bit.slice(0, 72)}…` : bit;
    const h = cls.headline.slice(0, 120);
    if (h.toLowerCase() === shortBit.toLowerCase() || h.toLowerCase().includes(shortBit.slice(0, 28).toLowerCase())) {
      return h.slice(0, 220);
    }
    return `${h} — ${shortBit}`.slice(0, 220);
  })();

  const progress = {
    totalSteps: steps.length > 0 ? steps.length : null,
    failedAtStepNumber: stepNum,
    failedStepText: flowStepText || null,
    completedSteps: cls.kind === "bot_challenge" ? [] : completedSteps,
    failedStepSummary: flowStepText ? summarizeStepForReport(flowStepText) : null,
    note:
      cls.kind === "bot_challenge"
        ? "The automated browser was stopped on a security / bot check page (Cloudflare). Your store menu never loaded — this is not a wrong “Decor” locator."
        : stepNum != null
          ? `Steps 1–${stepNum - 1} of your checklist finished in the browser before the run stopped at step ${stepNum}. That usually means a wrong locator on the failed step, not that earlier pages failed.`
          : "We could not tie this error to a numbered step because the generated script had no clear // Step N comment above the failure line.",
  };

  return {
    headline: cls.headline,
    stepSummary,
    stepNumber: comment?.stepNumber ?? null,
    flowStepText: flowStepText || null,
    scriptCommentLabel: comment?.label || null,
    whatHappened: cls.body,
    suggestions: cls.tips || [],
    progress,
    technical: {
      failureLine: failureLine || null,
      waitingFor: waiting || null,
      errorSnippet: extractFirstErrorLine(plain),
    },
    oneLineSummary: oneLine,
  };
}

function buildFriendlyFailureOrNull(passed, output, specContent, flow, opts = {}) {
  if (passed) return null;
  try {
    return buildFriendlyFailure(output, specContent || "", flow || {}, opts);
  } catch {
    return {
      headline: "The automated test did not finish successfully.",
      stepSummary: "See Technical details for more information.",
      stepNumber: null,
      flowStepText: null,
      scriptCommentLabel: null,
      whatHappened: "Something went wrong while running the browser test.",
      suggestions: ["Open Technical details and share the log if you need help from a developer."],
      progress: {
        totalSteps: null,
        failedAtStepNumber: null,
        failedStepText: null,
        completedSteps: [],
        note: "Step-by-step progress could not be recovered.",
      },
      technical: { failureLine: null, waitingFor: null, errorSnippet: stripAnsi(output).slice(0, 200) },
      oneLineSummary: "Flow run failed — see Technical details.",
    };
  }
}

module.exports = {
  stripAnsi,
  buildFriendlyFailure,
  buildFriendlyFailureOrNull,
};
