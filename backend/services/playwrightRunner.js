const chromium = require("@sparticuz/chromium-min");
const { chromium: playwrightChromium } = require("playwright-core");
const { log } = require("./logEmitter");

/** Strip code samples and hints so natural-language intent stays. */
function sanitizeStep(raw) {
  let t = String(raw);
  t = t.replace(/`[^`]*`/g, " ");
  t = t.replace(/\(e\.g\.,[^)]*\)/gi, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fillMainSearchLikeField(page, text) {
  const locators = [
    () => page.locator('textarea[name="q"]').first(),
    () => page.locator('input[name="q"]').first(),
    () => page.getByRole("combobox", { name: /search/i }),
    () => page.getByRole("textbox", { name: /search/i }),
    () => page.locator("textarea").first(),
    () => page.locator('input[type="search"]').first(),
  ];
  for (const getLoc of locators) {
    const el = getLoc();
    try {
      await el.waitFor({ state: "visible", timeout: 4000 });
      await el.fill(text, { timeout: 8000 });
      return;
    } catch (_) {}
  }
  throw new Error("Could not find a search/main text field to type into");
}

async function clickByLinkOrButtonName(page, nameFragment) {
  const re = new RegExp(escapeRe(nameFragment.trim()), "i");
  await page
    .getByRole("link", { name: re })
    .first()
    .click({ timeout: 12_000 })
    .catch(async () => {
      await page.getByRole("button", { name: re }).first().click({ timeout: 12_000 });
    })
    .catch(async () => {
      await page.getByText(nameFragment, { exact: false }).first().click({ timeout: 12_000 });
    });
}

function parseStep(step, baseUrl) {
  const s = String(step).toLowerCase().trim();
  return { raw: step, s, baseUrl };
}

async function runStep(page, step, baseUrl) {
  const rawOriginal = String(step);
  const raw = sanitizeStep(rawOriginal);
  const { s } = parseStep(raw, baseUrl);

  if (/^navigate to |^go to |^visit |^open |^goto /.test(s) || s.startsWith("goto ")) {
    let target = raw.replace(/^(navigate to|go to|visit|open|goto)\s*/i, "").trim();
    if (!/^https?:\/\//i.test(target)) {
      target = new URL(target.replace(/^\/+/, "/"), baseUrl).href;
    }
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 20_000 });
    return;
  }

  if (/wait for (the )?page to (load|finish)/i.test(raw) || (s.includes("wait") && s.includes("load"))) {
    await page.waitForLoadState("domcontentloaded", { timeout: 15_000 });
    return;
  }

  if (s.includes("press enter") || s.includes("hit enter") || /\bsubmit (the )?search\b/i.test(raw)) {
    await page.keyboard.press("Enter");
    await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
    return;
  }

  const typeQuoted = raw.match(
    /^(?:type|enter)\s+[\u2018\u2019'"]([^\u2018\u2019'"]+)[\u2018\u2019'"]\s+into/i
  );
  if (typeQuoted) {
    await fillMainSearchLikeField(page, typeQuoted[1]);
    return;
  }

  const typeLoose = raw.match(
    /^(?:type|enter)\s+(.+?)\s+into\s+(?:the\s+)?(?:main\s+)?(?:search\s+)?(?:input|field|box|textarea)/i
  );
  if (typeLoose) {
    let val = typeLoose[1].trim();
    const q = val.match(/^['"\u2018\u2019](.+?)['"\u2018\u2019]$/);
    if (q) val = q[1];
    await fillMainSearchLikeField(page, val);
    return;
  }

  if (
    /clear\s+(the\s+)?(search|field|input|box)|empty\s+(the\s+)?(search|query|field)|ensure\s+(the\s+)?search.*empty|field\s+is\s+empty/i.test(
      raw
    )
  ) {
    await fillMainSearchLikeField(page, "");
    return;
  }

  const fillMatch = raw.match(/fill\s+['"]?([^'"]+?)['"]?\s+with\s+['"]?(.+)/i);
  if (fillMatch) {
    const field = fillMatch[1].trim();
    const value = fillMatch[2].replace(/['"]$/g, "").trim();
    await page.getByLabel(new RegExp(escapeRe(field), "i")).fill(value, { timeout: 8000 }).catch(async () => {
      await page.getByPlaceholder(new RegExp(escapeRe(field), "i")).fill(value, { timeout: 8000 });
    });
    return;
  }

  if (/click/i.test(raw) && /with text|link with|named/i.test(raw)) {
    const m = raw.match(/with text\s+(.+?)(?:\s*\(|\s*$)/i) || raw.match(/named\s+(.+?)(?:\s*\(|\s*$)/i);
    if (m && m[1]) {
      const label = m[1].replace(/['"]/g, "").trim();
      if (label.length > 0 && label.length < 120) {
        await clickByLinkOrButtonName(page, label);
        return;
      }
    }
  }

  const clickMatch = raw.match(/^click\s+(.+)/i);
  if (clickMatch) {
    let label = clickMatch[1]
      .replace(/^(on\s+|the\s+)?(link|button)\s+/i, "")
      .replace(/['"]/g, "")
      .trim();
    const short = label.match(/['"]([^'"]+)['"]/);
    if (short) label = short[1];
    if (label.length > 100) label = label.slice(0, 80);
    await page.getByRole("button", { name: new RegExp(escapeRe(label), "i") }).first().click({ timeout: 10_000 }).catch(async () => {
      await clickByLinkOrButtonName(page, label);
    });
    return;
  }

  if (s.includes("wait") && (s.includes("network") || s.includes("idle"))) {
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
    return;
  }

  if (s.includes("assert") && s.includes("url")) {
    const m = raw.match(/contains\s+['"]?([^'"]+)['"]?/i);
    const part = (m ? m[1] : "").trim();
    const url = page.url();
    if (!part) throw new Error("Assert URL: specify what URL should contain");
    if (!url.toLowerCase().includes(part.toLowerCase())) {
      throw new Error(`Expected URL to contain "${part}", got "${url}"`);
    }
    return;
  }

  if (/assert.*\b(\d+)\b.*field|field.*count|number of.*field/i.test(raw)) {
    const wantM = raw.match(/\b(\d+)\b/);
    if (wantM) {
      const want = parseInt(wantM[1], 10);
      const count = await page.locator("input, textarea, select").count();
      if (count !== want) {
        throw new Error(`Expected about ${want} fields on page, found ${count} (counts vary by locale — prefer softer assertions in AI output).`);
      }
      return;
    }
  }

  if (s.includes("visible") || (s.includes("assert") && /see|shown|displayed|present/i.test(raw))) {
    const m = raw.match(/['"]([^'"]+)['"]/);
    const txt = m ? m[1] : raw.replace(/^assert:?\s*/i, "").replace(/^(that|the)\s+/i, "").trim();
    if (txt.length > 2 && txt.length < 200) {
      const loc = page.getByText(txt, { exact: false }).first();
      await loc.waitFor({ state: "visible", timeout: 10_000 });
      return;
    }
  }

  if (/^assert:/i.test(raw.trim()) && /form|structure|json|schema|specified in/i.test(raw)) {
    log("Skipping non-executable structural assert (runner limitation).", "info");
    return;
  }

  throw new Error(`Could not interpret step: ${rawOriginal.slice(0, 200)}${rawOriginal.length > 200 ? "…" : ""}`);
}

async function runTestCases(testCases, baseUrl) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return [];
  }
  log(`Running ${testCases.length} generated checks (best-effort)…`, "step");
const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  await chromium.executablePath(
    process.env.SPARTICUZ_CHROMIUM_URL ||
    "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar"
  );

const browser = await playwrightChromium.launch({
  args: [
    ...chromium.args,
    "--disable-blink-features=AutomationControlled",
  ],
  executablePath: execPath,
  headless: true,
});
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();
  const results = [];

  try {
    for (const tc of testCases) {
      const start = Date.now();
      try {
        await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
        const steps = Array.isArray(tc.steps) ? tc.steps : [];
        for (const st of steps) {
          await runStep(page, st, baseUrl);
        }
        if (tc.assertion) {
          await runStep(page, `assert: ${tc.assertion}`, baseUrl);
        }
        results.push({
          testId: tc.id || tc.name,
          name: tc.name || tc.id,
          passed: true,
          error: null,
          duration: Date.now() - start,
          screenshot: null,
        });
        log(`PASS ${tc.id || tc.name}`, "success");
      } catch (err) {
        let screenshot = null;
        try {
          const buf = await page.screenshot({ type: "png" });
          screenshot = buf.toString("base64");
        } catch (_) {}
        results.push({
          testId: tc.id || tc.name,
          name: tc.name || tc.id,
          passed: false,
          error: err.message,
          duration: Date.now() - start,
          screenshot,
        });
        log(`FAIL ${tc.id || tc.name}: ${err.message}`, "error");
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

module.exports = { runTestCases, runStep, sanitizeStep };
