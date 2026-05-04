const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require("./logEmitter");
const { rewriteExampleComToBase, toDisplayBase } = require("./flowBaseUrl");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryDelayMs(message) {
  if (!message || typeof message !== "string") return null;
  const m = message.match(/retry in ([\d.]+)s/i);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000) + 500;
  return null;
}

function isModelNotFound(err) {
  const s = String(err?.message || err || "");
  return s.includes("404") || /not\s*found|NOT_FOUND/i.test(s) || s.includes("is not found for API version");
}

function isAuthError(err) {
  const s = String(err?.message || err || "");
  const code = err?.status || err?.statusCode;
  if (code === 401 || code === 403) return true;
  return /API key not valid|invalid api key|PERMISSION_DENIED|API_KEY_INVALID/i.test(s);
}

function isQuotaOrRateLimit(err) {
  const s = String(err?.message || err || "");
  return (
    err?.status === 429 ||
    s.includes("429") ||
    s.includes("Too Many Requests") ||
    s.includes("quota") ||
    s.includes("Quota exceeded") ||
    s.includes("RESOURCE_EXHAUSTED")
  );
}

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.");
  }
  return key;
}

/**
 * Model IDs must match the Gemini API (see https://ai.google.dev/gemini-api/docs/models ).
 * Older names like gemini-1.5-flash often 404 on v1beta — use versioned or current aliases.
 */
function modelChain() {
  const primary = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  const extra = (
    process.env.GEMINI_MODEL_FALLBACKS ||
    "gemini-2.0-flash,gemini-2.5-flash-lite,gemini-2.0-flash-lite"
  )
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const seen = new Set();
  const chain = [];
  for (const m of [primary, ...extra]) {
    if (!seen.has(m)) {
      seen.add(m);
      chain.push(m);
    }
  }
  return chain;
}

function getGenerativeModel(modelName) {
  const genai = new GoogleGenerativeAI(getApiKey());
  return genai.getGenerativeModel({ model: modelName });
}

function stripJsonFences(text) {
  if (!text) return "{}";
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

/** Shrinks crawl JSON so free-tier token limits are less likely to hit (429). */
function compressCrawlForAi(crawled, maxPages = 6) {
  const allPages = crawled.pages || [];
  const pages = allPages.slice(0, maxPages).map((p) => ({
    url: p.url,
    title: (p.title || "").slice(0, 200),
    metaDescription: (p.metaDescription || "").slice(0, 300),
    buttons: (p.buttons || []).slice(0, 12),
    forms: (p.forms || []).slice(0, 4),
    links: (p.links || []).slice(0, 18).map((l) => ({
      href: String(l.href || "").slice(0, 500),
      text: String(l.text || "").slice(0, 80),
    })),
    images: (p.images || []).slice(0, 4).map((img) => ({
      alt: (img.alt || "").slice(0, 120),
      broken: img.broken,
    })),
    error: p.error,
  }));
  return {
    url: crawled.url,
    pages,
    note: allPages.length > maxPages ? `Only first ${maxPages} of ${allPages.length} pages sent to AI to save quota.` : undefined,
  };
}

/** When Gemini is over quota, still return useful cases from the crawl. */
function heuristicTestCasesFromCrawl(crawled) {
  const base = crawled.url || "";
  const list = crawled.pages || [];
  const cases = [];
  let n = 1;
  const pad = (i) => String(i).padStart(3, "0");

  cases.push({
    id: `TC-${pad(n++)}`,
    name: "Site responds and loads",
    steps: [`Navigate to ${base}`, "Wait for the page to finish loading"],
    assertion: "No error page; main content area is visible",
    priority: "critical",
    type: "navigation",
  });

  for (const p of list.slice(0, 8)) {
    if (p.error) {
      cases.push({
        id: `TC-${pad(n++)}`,
        name: `Page reachable: ${p.url}`,
        steps: [`Navigate to ${p.url}`],
        assertion: "Page loads without fatal error",
        priority: "high",
        type: "navigation",
      });
      continue;
    }
    if (p.title) {
      cases.push({
        id: `TC-${pad(n++)}`,
        name: `Title present: ${(p.title || "").slice(0, 40)}`,
        steps: [`Navigate to ${p.url}`, "Check the browser tab title or main heading"],
        assertion: `Title or heading reflects the page (${(p.title || "").slice(0, 120)})`,
        priority: "medium",
        type: "navigation",
      });
    }
    const forms = p.forms || [];
    if (forms.length) {
      cases.push({
        id: `TC-${pad(n++)}`,
        name: `Forms on ${p.url}`,
        steps: [`Navigate to ${p.url}`, "Locate each form", "Verify required fields are marked or documented"],
        assertion: "Forms render and fields are usable",
        priority: "high",
        type: "form",
      });
    }
    const links = (p.links || []).filter((l) => l.href && !String(l.href).startsWith("#")).slice(0, 3);
    for (const l of links) {
      cases.push({
        id: `TC-${pad(n++)}`,
        name: `Link: ${(l.text || l.href || "").slice(0, 35)}`,
        steps: [`Navigate to ${p.url}`, `Follow link toward ${String(l.href).slice(0, 80)}`],
        assertion: "Destination loads or shows expected content",
        priority: "medium",
        type: "link",
      });
    }
  }

  return cases.slice(0, 24);
}

/**
 * Calls generateContent with model fallbacks. Auth errors fail fast.
 * On 429: one short retry, then next model (avoids long waits on an exhausted model).
 */
async function generateContentWithRetry(prompt, label = "AI") {
  const maxAttempts429 = 2;
  const models = modelChain();
  let lastErr;

  for (let mi = 0; mi < models.length; mi++) {
    const modelName = models[mi];
    const model = getGenerativeModel(modelName);

    for (let attempt = 1; attempt <= maxAttempts429; attempt++) {
      try {
        if (mi > 0 || attempt > 1) {
          log(`${label}: model "${modelName}" (attempt ${attempt})…`, "step");
        }
        const result = await model.generateContent(prompt);
        if (mi > 0) {
          log(`${label}: success with ${modelName}`, "success");
        }
        return result;
      } catch (e) {
        lastErr = e;
        if (isAuthError(e)) {
          log(`${label}: invalid API key or permission — fix GEMINI_API_KEY.`, "error");
          throw e;
        }
        if (isModelNotFound(e)) {
          log(`${label}: model "${modelName}" is not available on this API — skipping.`, "step");
          break;
        }
        if (isQuotaOrRateLimit(e)) {
          const delay = Math.min(
            25_000,
            parseRetryDelayMs(e.message) || 5000 * attempt
          );
          log(
            `${label}: rate limit / quota (${modelName}). ${attempt < maxAttempts429 ? `Retry in ${Math.round(delay / 1000)}s…` : "Trying next model…"}`,
            "error"
          );
          if (attempt < maxAttempts429) {
            await sleep(delay);
            continue;
          }
          break;
        }
        log(`${label}: ${modelName} — ${e.message}. Trying next model…`, "step");
        break;
      }
    }
  }

  throw lastErr || new Error("All Gemini models failed");
}

function warningForAiFailure(err) {
  if (isQuotaOrRateLimit(err)) {
    return "Gemini rate limit or quota exceeded on all tried models. Showing crawl-based test ideas only. Wait a few minutes, set GEMINI_MODEL / GEMINI_MODEL_FALLBACKS in .env, or enable billing. See https://ai.google.dev/gemini-api/docs/rate-limits";
  }
  if (isModelNotFound(err)) {
    return "Some model IDs are invalid (404). Defaults now use gemini-2.5-flash / gemini-2.0-flash. List valid names: https://ai.google.dev/api/rest/v1beta/models.list — showing crawl-based test ideas only.";
  }
  return `Gemini request failed: ${String(err?.message || err).slice(0, 200)} — showing crawl-based test ideas only.`;
}

async function generateTestCases(crawledPageData, scope) {
  const compressed = compressCrawlForAi(crawledPageData);
  const scopeText = Array.isArray(scope) && scope.length ? scope.join(", ") : "navigation, forms, buttons, links, accessibility";
  const payload = JSON.stringify(compressed);
  const prompt = `You are a QA engineer. Given this website structure as JSON, generate test cases for an AUTOMATED runner (not documentation).

Focus areas from tester: ${scopeText}

Website JSON (${payload.length} chars):
${payload}

CRITICAL — each "steps" entry must follow ONE of these patterns ONLY (no backticks, no Playwright code, no "e.g." snippets):
- Navigate to <full URL or path starting with />
- Click the link with text <short label, e.g. About or Gmail or Sign in>
- Type '<text>' into the main search input field
- Clear the search field OR Ensure the search field is empty
- Press Enter OR Submit the search
- Fill <field label> with <value>
- Assert: URL contains <substring>
- Assert: '<visible text>' is visible

Do NOT assert exact counts of fields/buttons from JSON (e.g. "9 fields") — the runner cannot verify that reliably.

Return ONLY a JSON array (no markdown). Each object must have:
- id: string (e.g. TC-001)
- name: string (short test name)
- steps: array of strings using ONLY the patterns above
- assertion: string (optional extra check, same simple style)
- priority: "critical" | "high" | "medium"
- type: "navigation" | "form" | "button" | "link" | "accessibility"`;

  try {
    log("Generating test cases with AI…", "step");
    const result = await generateContentWithRetry(prompt, "Test cases");
    const text = stripJsonFences(result.response.text());
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return a JSON array");
    }
    return { testCases: parsed, source: "gemini" };
  } catch (e) {
    log(`AI test case generation failed: ${e.message}`, "error");
    if (isAuthError(e)) throw e;
    log("Using heuristic test cases (Gemini unavailable for this request).", "step");
    return {
      testCases: heuristicTestCasesFromCrawl(crawledPageData),
      source: "heuristic",
      warning: warningForAiFailure(e),
    };
  }
}

async function generateEdgeCases(flowDescription) {
  const prompt = `You are a senior QA. Given this user flow in plain English, list edge case scenarios.

Flow:
${flowDescription}

Return ONLY a JSON array of objects with: name, steps (array of strings), assertion, why_important`;

  try {
    log("Generating edge cases with AI…", "step");
    const result = await generateContentWithRetry(prompt, "Edge cases");
    const text = stripJsonFences(result.response.text());
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    log(`Edge case generation failed: ${e.message}`, "error");
    if (isAuthError(e)) throw e;
    return [
      {
        name: "Offline / slow network",
        steps: ["Repeat the flow on slow 3G or with network throttling"],
        assertion: "App shows loading or error states without corrupting data",
        why_important: "Gemini unavailable — add AI edge cases after fixing API/quota. See https://ai.google.dev/gemini-api/docs/models",
      },
    ];
  }
}

async function convertFlowToNegativeScripts(flow, baseUrl) {
  const steps = Array.isArray(flow.steps) ? flow.steps.join("\n") : String(flow.steps);
  const displayBase = toDisplayBase(baseUrl);
  const prompt = `You are an expert Playwright (JavaScript) test author for **negative / adversarial** QA.

MANDATORY app origin for ALL navigation: ${displayBase}
Never use example.com, localhost, or any host other than this origin unless the user step explicitly names another full URL.

Flow name (context): ${flow.name || "Flow"}

Plain English happy-path steps (for context — do NOT repeat the full happy path; write separate negative tests only):
${steps}

Write **3 to 5** additional Playwright \`test(...)\` blocks in CommonJS style.
Rules:
1. Do NOT include \`const { test, expect } = require('@playwright/test');\` — those are already declared in the file your code will be appended to.
2. Each test title MUST start with exactly \`NEG: \` (e.g. \`NEG: Submit empty email\`).
3. Each test must try an **invalid** action (empty required field, mismatched passwords, obviously weak password, invalid email format, skip required selection, wrong secure-access password then expect failure, etc.) that a real user might attempt.
4. Each test must **assert the application handles it correctly**: visible validation message, error toast, aria-invalid, submit stays disabled, or URL does not advance — use \`expect(...)\` with timeouts 15000–45000ms as appropriate.
5. Tests must be **self-contained**: use \`page.goto\` to the same origin paths as needed (often /login or entry from the flow). Repeat secure-access / gate steps if that screen appears.
6. Return ONLY the raw \`test('NEG: ...', async ({ page }) => { ... });\` blocks (no markdown fences, no imports). Use \`expect\` from the Playwright test scope (already in scope; do not import).`;

  try {
    log("Generating negative Playwright scenarios…", "step");
    const result = await generateContentWithRetry(prompt, "Negative flow scripts");
    let code = result.response.text().trim();
    code = stripJsonFences(code);
    if (code.startsWith("javascript") || code.startsWith("js\n")) {
      code = code.replace(/^js(?:script)?\n?/i, "").trim();
    }
    return rewriteExampleComToBase(code, toDisplayBase(baseUrl));
  } catch (e) {
    log(`Negative script generation failed: ${e.message}`, "error");
    if (isAuthError(e)) throw e;
    return "";
  }
}

async function convertFlowToScript(flow, baseUrl) {
  const steps = Array.isArray(flow.steps) ? flow.steps.join("\n") : String(flow.steps);
  const displayBase = toDisplayBase(baseUrl);
  const happyTitle = `${flow.name || "Flow"} — happy path`;
  const prompt = `You are an expert Playwright (JavaScript) test author.

MANDATORY app origin for ALL navigation: ${displayBase}
Never use example.com, localhost, or any host other than this origin unless the user step explicitly names another full URL.

Flow name: ${flow.name || "Flow"}

Plain English steps (one per line):
${steps}

Write a single Playwright test file content that:
1. Uses CommonJS ONLY: const { test, expect } = require('@playwright/test'); — do NOT use import/export
2. Uses exactly ONE test block. The test title string MUST be exactly (copy verbatim): ${JSON.stringify(happyTitle)}
3. Uses page.goto with absolute URLs built ONLY from origin ${displayBase} + path (e.g. ${displayBase}/login). After each goto, await page.waitForLoadState('domcontentloaded') unless already implied.
4. Locators MUST tolerate real UIs: for links/buttons from plain-English steps, use getByRole with a **RegExp** and **case-insensitive** match, not a fixed string, unless the user quoted exact text. Examples:
   - Step says "click create account" → page.getByRole('link', { name: /create\\s+an?\\s+account/i }).first() OR try button too: .getByRole('button', { name: /create\\s+an?\\s+account/i })
   - Prefer .first() when multiple matches are possible. Chain .or() between link and button if helpful.
5. **Site password / "Secure Access" gates** (interstitial before the real page): Do NOT rely only on getByLabel(/secure access password/i)—the field is often a bare password input or only shows bullet placeholder text in the a11y name. **CRITICAL:** Do NOT use \`expect(locatorA.or(locatorB)).toBeVisible()\` when BOTH can appear at once (e.g. heading "Secure Access" AND paragraph "Enter the password to continue")—Playwright strict mode fails because the union matches **two** elements. Use **one** locator for visibility, e.g. \`await expect(page.getByRole('heading', { name: /secure\\s+access/i })).toBeVisible({ timeout: 15000 })\` only, then fill \`page.locator('input[type="password"]').first()\`, click \`getByRole('button', { name: /continue|submit/i })\`, then \`await expect(page.getByRole('heading', { name: /secure\\s+access/i })).not.toBeVisible({ timeout: 15000 })\` before login/register steps.
6. **"Select the Nth search result" / numbered list rows**: NEVER use a page-wide locator union (e.g. all listitems + all links + all buttons) with .nth(N)—DOM order will match **breadcrumbs, header, pagination, disabled links** first. On many sites each row has **button "Select"** under a **"Search Results"** heading—prefer \`page.getByRole('button', { name: /^select$/i }).nth(N - 1)\` after \`await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible()\`, or scope with \`page.getByRole('region', { name: /search results/i })\` / main + heading if the app exposes it. Ensure the target is **enabled** before .click().
7. **Long registration forms (Personal / Account information, etc.)**: Do NOT gate the step on \`expect(page.getByRole('heading', { name: /personal|account\\s+information/i })).toBeVisible()\`—many UIs use styled divs or captions, not role=heading, so the check fails. Prefer \`await page.getByLabel(/first\\s*name|given\\s*name/i).waitFor({ state: 'visible', timeout: 45000 })\` (or the first field named in the user step), then fill labels from the user text. After slow searches, use **timeouts of 45000–120000ms** on the next critical locator when the user mentions long waits.
8. For placeholders/labels from steps, use RegExp with /i when the wording might differ slightly from the DOM.
9. Before each major block that carries out one line of the user's checklist, insert a comment exactly: // Step N: brief summary — where N is 1 for the first user line above, 2 for the second, and so on (must match checklist order).
10. Does NOT use test.describe unless needed; one test block is fine
11. Return ONLY the raw JavaScript source code, no markdown fences`;

  try {
    log("Converting flow to Playwright script with AI…", "step");
    const result = await generateContentWithRetry(prompt, "Flow script");
    let code = result.response.text().trim();
    code = stripJsonFences(code);
    if (code.startsWith("javascript") || code.startsWith("js\n")) {
      code = code.replace(/^js(?:script)?\n?/i, "").trim();
    }
    return rewriteExampleComToBase(code, toDisplayBase(baseUrl));
  } catch (e) {
    log(`Flow to script failed: ${e.message}`, "error");
    if (isAuthError(e)) throw e;
    const u = toDisplayBase(baseUrl);
    log("Emitting minimal Playwright stub (Gemini unavailable).", "step");
    return `
  await page.goto(${JSON.stringify(u)}, { waitUntil: 'domcontentloaded' });
  // TODO: Gemini could not generate steps (${String(e?.message || e).slice(0, 120)})
  // Set GEMINI_MODEL=gemini-2.5-flash and check https://ai.google.dev/gemini-api/docs/models
`;
  }
}

module.exports = {
  generateTestCases,
  generateEdgeCases,
  convertFlowToScript,
  convertFlowToNegativeScripts,
  compressCrawlForAi,
  heuristicTestCasesFromCrawl,
};
