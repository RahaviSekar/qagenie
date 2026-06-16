const {
  extractSecureAccessPassword,
  extractQuotedPhrases,
  isEcommerceFlow,
} = require("./flowStepParser");

const ECOMMERCE_RUNTIME_MARKER = "/* QA_GENIE_ECOMMERCE_RUNTIME */";

const ECOMMERCE_HELPERS = `
/** Live progress in QA Genie Activity log (stdout → [QA Genie] lines) */
function qaStep(page, message) {
  const url = typeof page?.url === "function" ? page.url() : "";
  console.log(\`[QA Genie] \${message}\${url ? " | " + url : ""}\`);
}

async function dismissCookieBanner(page) {
  const buttons = page.getByRole("button", {
    name: /accept all|accept cookies|allow all|agree|i agree|got it|ok/i,
  });
  if (await buttons.first().isVisible({ timeout: 4000 }).catch(() => false)) {
    await buttons.first().click();
    qaStep(page, "Accepted cookie banner");
    await page.waitForTimeout(500);
  }
}

async function waitForStorefront(page, timeoutMs = 120000) {
  const bot = page.getByText(/performing security verification|verify you are not a bot|security service to protect/i);
  if (await bot.isVisible({ timeout: 8000 }).catch(() => false)) {
    qaStep(page, "Waiting for security check to finish…");
    await expect(bot).not.toBeVisible({ timeout: timeoutMs });
  }
  await dismissCookieBanner(page);
}

/** HomeClick / graciousgarage — hidden mobile duplicates break .first(); use visible + href fallback */
async function clickTopNavLink(page, label) {
  await dismissCookieBanner(page);
  qaStep(page, \`Click top nav: "\${label}"\`);
  const escaped = String(label).replace(/[.*+?^$()|[\\]\\\\]/g, "\\\\$&").replace(/\\s+/g, "\\\\s+");
  const re = new RegExp("^" + escaped + "$", "i");
  const menuLinks = page.locator("a.main-menu-link", { hasText: re });

  const visible = menuLinks.filter({ visible: true });
  if ((await visible.count()) > 0) {
    try {
      await visible.first().click({ timeout: 15000 });
      await page.waitForLoadState("domcontentloaded");
      qaStep(page, \`Navigated after "\${label}"\`);
      return;
    } catch (_) {
      /* try href navigation below */
    }
  }

  const n = await menuLinks.count();
  for (let i = 0; i < n; i++) {
    const link = menuLinks.nth(i);
    if (!(await link.isVisible().catch(() => false))) continue;
    try {
      await link.click({ timeout: 12000 });
      await page.waitForLoadState("domcontentloaded");
      qaStep(page, \`Navigated after "\${label}"\`);
      return;
    } catch (_) {
      /* next */
    }
  }

  const href =
    (await visible.first().getAttribute("href").catch(() => null)) ||
    (await menuLinks.first().getAttribute("href").catch(() => null));
  if (href) {
    const target = new URL(href, page.url()).toString();
    qaStep(page, \`Opening \${target} (menu link was off-screen)\`);
    await page.goto(target, { waitUntil: "domcontentloaded" });
    qaStep(page, \`Navigated after "\${label}"\`);
    return;
  }

  await page.evaluate((linkText) => {
    const re = new RegExp(
      "^" + String(linkText).replace(/[.*+?^$()|[\\]\\\\]/g, "\\\\$&").replace(/\\s+/g, "\\\\s+") + "$",
      "i"
    );
    for (const a of document.querySelectorAll("a.main-menu-link")) {
      if (!re.test((a.textContent || "").trim())) continue;
      const r = a.getBoundingClientRect();
      if (r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < window.innerHeight) {
        a.click();
        return;
      }
    }
    throw new Error("No visible main-menu-link for " + linkText);
  }, label);
  await page.waitForLoadState("domcontentloaded");
  qaStep(page, \`Navigated after "\${label}" (in-page click)\`);
}

/** Subcategory / megamenu links (e.g. Wall Mirrors) */
async function clickCategoryLink(page, label) {
  await dismissCookieBanner(page);
  qaStep(page, \`Click category: "\${label}"\`);
  const escaped = String(label).replace(/[.*+?^$()|[\\]\\\\]/g, "\\\\$&").replace(/\\s+/g, "\\\\s+");
  const re = new RegExp("^" + escaped + "$", "i");
  const links = page.getByRole("link", { name: re });
  const visible = links.filter({ visible: true });
  if ((await visible.count()) > 0) {
    await visible.first().click({ timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    qaStep(page, \`Opened category "\${label}"\`);
    return;
  }
  const href = await links.first().getAttribute("href").catch(() => null);
  if (href) {
    const target = new URL(href, page.url()).toString();
    await page.goto(target, { waitUntil: "domcontentloaded" });
    qaStep(page, \`Opened category "\${label}" at \${target}\`);
    return;
  }
  await links.first().click({ force: true, timeout: 15000 });
  qaStep(page, \`Opened category "\${label}"\`);
}

/** PLP has no Add to Cart — open first product whose href is /p/… (PDP) */
async function openFirstProductDetail(page) {
  await dismissCookieBanner(page);
  const closeFilter = page.getByRole("button", { name: /^✕$/ });
  if (await closeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeFilter.click().catch(() => {});
    await page.waitForTimeout(300);
  }
  qaStep(page, "Open first product (expect /p/… URL)");
  const link = page.locator('main a[href*="/p/"]').filter({ visible: true }).first();
  await expect(link).toBeVisible({ timeout: 50000 });
  await link.click({ timeout: 25000 });
  await expect(page).toHaveURL(new RegExp("/p/"), { timeout: 45000 });
  await page.waitForLoadState("domcontentloaded");
  qaStep(page, "Product detail page loaded");
}

async function clickAddToCart(page) {
  await dismissCookieBanner(page);
  qaStep(page, "Click Add to Cart");
  const btn = page.getByRole("button", { name: /add\\s+to\\s+cart/i }).filter({ visible: true }).first();
  try {
    await expect(btn).toBeVisible({ timeout: 30000 });
    await btn.click({ timeout: 20000 });
  } catch (_) {
    await page.getByRole("link", { name: /add\\s+to\\s+cart/i }).filter({ visible: true }).first().click({ timeout: 20000 });
  }
  qaStep(page, "Add to Cart clicked");
}
`;

/** AI often emits getByRole('navigation') — many storefronts (incl. HomeClick) do not use that landmark. */
function stripNavigationScopedLinkClicks(code, flow) {
  let c = code;
  const quoted = extractQuotedPhrases(flow?.steps || []);
  c = c.replace(
    /await\s+page\.getByRole\(\s*['"]navigation['"]\s*\)\.getByRole\(\s*['"]link['"]\s*,\s*\{\s*name:\s*\/\^?([^$}]+)\$?\/i\s*\}\s*\)(?:\.first\(\))?\.click\(\s*\)/gi,
    (_m, rawLabel) => {
      const label = String(rawLabel).replace(/\\s\+/g, " ").trim();
      if (isEcommerceFlow(flow?.steps) && quoted.includes(label)) {
        return `await clickTopNavLink(page, ${JSON.stringify(label)})`;
      }
      return `await page.getByRole('link', { name: /^${rawLabel}$/i }).first().click()`;
    }
  );
  return c;
}

/**
 * Remove markdown fences and stray "javascript" lines from Gemini output.
 */
function stripAiPlaywrightCode(text) {
  let c = String(text || "");
  c = c.replace(/```(?:javascript|js|typescript|ts)?\s*/gi, "");
  c = c.replace(/```\s*/g, "");
  c = c.replace(/^\s*(?:javascript|js|typescript|ts)\s*$/gim, "");
  return c.trim();
}

const REGISTRATION_HELPERS = `
/** QA Genie — registration form helpers (labels match dev.ges.store: "Password *", "Confirm Password *") */
async function fillAccountPasswords(page, password) {
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/^confirm\\s*password/i).fill(password);
}
async function fillPersonalInfo(page, data) {
  if (data.firstName) await page.getByLabel(/^first\\s*name/i).fill(data.firstName);
  if (data.lastName) await page.getByLabel(/^last\\s*name/i).fill(data.lastName);
  if (data.email) {
    await page.getByLabel(/^email\\s*address$/i).fill(data.email);
    await page.getByLabel(/^email\\s*confirmation/i).fill(data.email);
  }
  if (data.phone) await page.getByLabel(/^phone/i).fill(data.phone);
}
`;

const DEFAULT_ACCOUNT_PASSWORD = "Abc!123456789";

/** Wrong AI locator — real label is "Password *" under Account Information */
function fixWrongAccountPasswordLocator(line) {
  if (!/getByLabel/.test(line)) return line;
  const wrongAccountPassword =
    line.includes("account\\s*password") ||
    line.includes("new\\s*password") ||
    line.includes("create\\s*password") ||
    /getByLabel\(\s*\/account\s+password/i.test(line);
  if (!wrongAccountPassword) return line;
  let out = line.replace(
    /getByLabel\(\s*\/account\\s\*password\|new\\s\*password\/i\s*\)(?:\.first\(\))?/g,
    "getByLabel(/^password$/i)"
  );
  out = out.replace(
    /getByLabel\(\s*\/account\\s\*password\|new\\s\*password\|create\\s\*password\/i\s*\)(?:\.first\(\))?/g,
    "getByLabel(/^password$/i)"
  );
  return out;
}

function fixWrongAccountPasswordLocatorsInCode(code) {
  return code
    .split("\n")
    .map((line) => fixWrongAccountPasswordLocator(line))
    .join("\n");
}

function escapeRegexLiteral(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Avoid /decor/i matching "HOME DECOR"; add .first() on ambiguous nav link clicks */
function fixNavigationLinkLocators(code, flow) {
  const quoted = extractQuotedPhrases(flow?.steps || []);
  let c = code;

  for (const label of quoted) {
    if (!label || label.length > 80) continue;
    const pattern = /\s/.test(label) ? escapeRegexLiteral(label).replace(/\s+/g, "\\s+") : `^${escapeRegexLiteral(label)}$`;
    const loose = /\s/.test(label)
      ? escapeRegexLiteral(label).replace(/\s+/g, "\\s+")
      : escapeRegexLiteral(label);
    c = c.replace(
      new RegExp(
        `getByRole\\(\\s*['"]link['"]\\s*,\\s*\\{\\s*name:\\s*['"]${loose}['"]\\s*,\\s*exact:\\s*true\\s*\\}\\)`,
        "gi"
      ),
      `getByRole('link', { name: /${pattern}/i }).first()`
    );
    c = c.replace(
      new RegExp(`getByRole\\(\\s*['"]link['"]\\s*,\\s*\\{\\s*name:\\s*\\/${loose}\\/i\\s*\\}\\)`, "gi"),
      `getByRole('link', { name: /${pattern}/i }).first()`
    );
  }

  const lines = c.split("\n");
  c = lines
    .map((line) => {
      if (!/getByRole\(\s*['"]link['"]/.test(line) || !/\.click\(\)/.test(line)) return line;
      let out = line;
      if (!/\.first\(\)|\.nth\(/.test(out)) {
        out = out.replace(/\.click\(\)/, ".first().click()");
      }
      out = out.replace(
        /getByRole\(\s*['"]link['"]\s*,\s*\{\s*name:\s*\/([a-zA-Z0-9]+)\/i\s*\}/g,
        (m, word) => {
          if (m.includes("^")) return m;
          return `getByRole('link', { name: /^${word}$/i }`;
        }
      );
      return out;
    })
    .join("\n");

  c = c.replace(
    /await page\.getByRole\(\s*['"]navigation['"]\s*\)\.getByRole\(\s*['"]link['"]\s*,\s*\{\s*name:\s*\/\^([^/$]+)\$\/i\s*\}\)\.first\(\)\.click\(\)/g,
    "await clickTopNavLink(page, '$1')"
  );

  return c;
}

/** Remove every copy of a helper (AI often duplicates qaStep after our injected block). */
function stripFunctionDefinition(code, fnName) {
  let c = code;
  for (const kind of ["async function", "function"]) {
    const needle = `${kind} ${fnName}`;
    let idx = c.indexOf(needle);
    while (idx >= 0) {
      const brace = c.indexOf("{", idx);
      if (brace < 0) break;
      let depth = 0;
      let end = brace;
      for (let i = brace; i < c.length; i++) {
        if (c[i] === "{") depth++;
        else if (c[i] === "}") {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      let start = idx;
      while (start > 0 && c[start - 1] !== "\n") start--;
      while (start > 2 && /^\s*\*\/\s*$/.test(c.slice(Math.max(0, start - 4), start))) {
        const docStart = c.lastIndexOf("/**", start);
        if (docStart >= 0 && docStart >= start - 800) start = docStart;
        else break;
      }
      c = c.slice(0, start) + c.slice(end);
      idx = c.indexOf(needle);
    }
  }
  return c;
}

/** Keep only require(@playwright/test) … tests — drop duplicate helper blocks above it. */
function extractPlaywrightTestFile(code) {
  const m = code.match(
    /const\s*\{\s*test\s*,\s*expect\s*\}\s*=\s*require\s*\(\s*['"]@playwright\/test['"]\s*\)\s*;?/
  );
  if (m && m.index != null) return code.slice(m.index);
  return code;
}

function injectEcommerceRuntime(code, flow) {
  if (!isEcommerceFlow(flow?.steps)) return code;
  const runtimeFns = [
    "qaStep",
    "dismissCookieBanner",
    "waitForStorefront",
    "clickTopNavLink",
    "clickCategoryLink",
    "openFirstProductDetail",
    "clickAddToCart",
  ];
  let c = extractPlaywrightTestFile(code);
  c = c.replace(/\/\* QA_GENIE_ECOMMERCE_RUNTIME \*\/\s*/g, "");

  for (const fn of runtimeFns) {
    c = stripFunctionDefinition(c, fn);
  }
  c = c.replace(/const BASE_URL\s*=\s*[^;]+;\s*/g, "");
  c = `${ECOMMERCE_RUNTIME_MARKER}\n${ECOMMERCE_HELPERS}\n${c}`;

  if (!c.includes("waitForStorefront(page)")) {
    c = c.replace(
      /(await page\.goto\([^)]+\);[\s\S]*?await page\.waitForLoadState\(\s*['"]domcontentloaded['"]\s*\);)/,
      "$1\n  qaStep(page, 'Opened site');\n  await waitForStorefront(page);"
    );
  }

  const quoted = extractQuotedPhrases(flow?.steps || []);
  const topNavLabel = quoted.find((q) =>
    (flow?.steps || []).some((s) => /top navigation/i.test(String(s)) && String(s).includes(`"${q}"`))
  );

  for (const label of quoted) {
    if (!label) continue;
    const esc = escapeRegexLiteral(label);
    c = c.replace(
      new RegExp(
        `await page\\.getByRole\\(\\s*['"]link['"]\\s*,\\s*\\{\\s*name:\\s*\\/\\^${esc}\\$\\/i\\s*\\}\\)\\.first\\(\\)\\.click\\(\\)`,
        "gi"
      ),
      label === topNavLabel || (!/\s/.test(label) && label === quoted[0])
        ? `await clickTopNavLink(page, ${JSON.stringify(label)})`
        : `await clickCategoryLink(page, ${JSON.stringify(label)})`
    );
    if (/\s/.test(label)) {
      c = c.replace(
        new RegExp(`await clickTopNavLink\\(page, ${JSON.stringify(label)}\\)`, "g"),
        `await clickCategoryLink(page, ${JSON.stringify(label)})`
      );
    }
  }

  c = c.replace(
    /await\s+page\.getByRole\(\s*['"]main['"]\s*\)\.getByRole\(\s*['"]link['"]\s*\)\s*\.filter\(\s*\{\s*has:\s*page\.locator\(\s*['"]img['"]\s*\)\s*\}\s*\)\s*\.first\(\)\s*\.click\(\)/gi,
    "await openFirstProductDetail(page)"
  );
  c = c.replace(
    /await\s+page\.getByRole\(\s*['"]button['"]\s*,\s*\{\s*name:\s*\/add\\s\+to\\s\+cart\/i\s*\}\)(?:\.first\(\))?\s*\.click\(\)/gi,
    "await clickAddToCart(page)"
  );

  return c;
}

function useFillAccountPasswordsHelper(code, passwordLiteral) {
  let c = code;
  const pair =
    /await page\.getByLabel\(\s*\/\^password\$\/i\s*\)(?:\.first\(\))?\.fill\([^)]+\);\s*\n?\s*await page\.getByLabel\(\s*\/confirm\\s*password\/i\s*\)[^;]+;/g;
  c = c.replace(pair, `await fillAccountPasswords(page, ${passwordLiteral});`);
  c = c.replace(
    /await page\.getByLabel\(\s*\/\^password\$\/i\s*\)(?:\.first\(\))?\.fill\([^)]+\);/g,
    `await fillAccountPasswords(page, ${passwordLiteral});`
  );
  c = c.replace(/^\s*await page\.getByLabel\(\s*\/confirm\\s*password\/i\s*\)[^;]+;\s*$/gm, "");
  return c;
}

/**
 * Fix common AI mistakes in generated Playwright before run.
 */
function sanitizeGeneratedFlowScript(code, flow) {
  let c = stripAiPlaywrightCode(code);
  const steps = flow?.steps || [];
  const gatePassword = extractSecureAccessPassword(steps);
  const hasRegistration = steps.some((s) =>
    /personal information|personal info|account information|confirm password|^password/i.test(String(s))
  );

  if (gatePassword) {
    c = c.replace(
      /fill\(\s*['"][^'"]*['"]\s*\)\s*;?\s*\n?\s*\/\/.*secure/gi,
      `fill('${gatePassword}');`
    );
  }

  c = fixWrongAccountPasswordLocatorsInCode(c);
  c = fixNavigationLinkLocators(c, flow);
  c = injectEcommerceRuntime(c, flow);

  c = c.replace(
    /locator\(['"]h1['"]\)\.filter\(\{\s*hasText:\s*\/Find Your Company\/i\s*\}\)/g,
    "getByLabel(/company\\s*name/i)"
  );

  c = c.replace(
    /page\.waitForSelector\(\s*['"]h1:has-text\(["']Secure Access["']\)['"]\s*\)/g,
    "expect(page.getByRole('heading', { name: /secure\\s*access/i })).toBeVisible({ timeout: 30000 })"
  );

  if (hasRegistration && !c.includes("function fillAccountPasswords")) {
    c = useFillAccountPasswordsHelper(c, JSON.stringify(DEFAULT_ACCOUNT_PASSWORD));
    c = REGISTRATION_HELPERS + "\n" + c;
  }

  c = stripNavigationScopedLinkClicks(c, flow);

  return c;
}

module.exports = { stripAiPlaywrightCode, sanitizeGeneratedFlowScript };
