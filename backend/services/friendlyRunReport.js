/**
 * Turn Playwright CLI output into short, non-technical explanations for QA Genie users.
 */

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

/** Prefer the stack frame that points at the failing line (often last hit). */
function pickFailureLine(output) {
  const hits = findSpecStackLines(output);
  if (!hits.length) return null;
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

/**
 * @param {string} output - raw Playwright stdout/stderr
 * @param {string} specContent - final written spec (wrapped) source
 * @param {{ steps?: string[] }} flow - saved flow with plain-English steps
 */
function buildFriendlyFailure(output, specContent, flow) {
  const plain = stripAnsi(output);
  const failureLine = pickFailureLine(plain);
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
      completedSteps.push({ number: i + 1, text: steps[i] });
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
    completedSteps,
    note:
      stepNum != null
        ? "Each step listed above finished without an error before the test stopped at the failed step (same order as your checklist)."
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

function buildFriendlyFailureOrNull(passed, output, specContent, flow) {
  if (passed) return null;
  try {
    return buildFriendlyFailure(output, specContent || "", flow || {});
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
