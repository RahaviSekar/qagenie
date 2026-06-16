/**
 * Pull concrete values and UI hints from plain-English flow steps for script generation.
 *
 * Optional selector hint on any step:
 *   Click Create an Account >> getByRole('link', { name: /create an account/i })
 */

function parseStepLine(raw) {
  const s = String(raw || "").trim();
  if (!s) return { instruction: "", locator: null, raw: s };

  const arrow = s.match(/^(.+?)\s*>>\s*(.+)$/);
  if (arrow) {
    return { instruction: arrow[1].trim(), locator: arrow[2].trim(), raw: s };
  }

  const bracket = s.match(/^(.+?)\s*\[locator:\s*(.+?)\]\s*$/i);
  if (bracket) {
    return { instruction: bracket[1].trim(), locator: bracket[2].trim(), raw: s };
  }

  return { instruction: s, locator: null, raw: s };
}

function parseFlowSteps(steps) {
  return (Array.isArray(steps) ? steps : []).map(parseStepLine);
}

function extractSecureAccessPassword(steps) {
  for (const s of steps || []) {
    const line = String(s);
    if (!/secure\s*access|password\s+to\s+continue/i.test(line)) continue;
    let m = line.match(/give\s+this\s+password\s+(\S+)/i);
    if (m) return m[1].trim();
    m = line.match(/password\s+([A-Za-z0-9!@#$%^&*._-]{8,})/i);
    if (m && !/continue|button|click/i.test(m[1])) return m[1].trim();
  }
  return null;
}

function extractCompanySearchTerm(steps) {
  for (const s of steps || []) {
    const m = String(s).match(/type\s+(\w+)\s+in\s+company\s+name/i);
    if (m) return m[1];
  }
  return null;
}

function extractQuotedPhrases(steps) {
  const out = [];
  for (const s of steps || []) {
    const m = String(s).matchAll(/"([^"]+)"/g);
    for (const hit of m) {
      const phrase = hit[1].trim();
      if (phrase && !out.includes(phrase)) out.push(phrase);
    }
  }
  return out;
}

function isEcommerceFlow(steps) {
  const blob = (steps || []).join("\n").toLowerCase();
  return /add\s+to\s+cart|navigation|category|product|decor|mirror|flyout|cart/i.test(blob);
}

/** Short label for QA-facing progress lists */
function summarizeStepForReport(stepText) {
  const t = String(stepText || "").toLowerCase();
  if (/go to|navigate|base\s*url|open.*url/i.test(t) && !/\/login|sign\s*in|log\s*in/i.test(t)) {
    return "Starting page opened";
  }
  if (/go to|\/login|navigate/i.test(t) && /\/login|sign\s*in|log\s*in/i.test(t)) return "Login page opened";
  if (/secure\s*access/i.test(t)) return "Secure Access password entered";
  if (/create\s+an?\s+account/i.test(t)) return "Create an Account link clicked";
  if (/company\s+name|find your company|search\s+button/i.test(t)) return "Company search (e.g. lamb)";
  if (/scroll|select.*1st|first\s+result/i.test(t)) return "First company selected from results";
  if (/confirm.*create your account/i.test(t)) return "Confirm & Create Your Account";
  if (/personal information|first name|last name|email/i.test(t) && !/account information/i.test(t)) {
    return "Personal Information filled";
  }
  if (/account information|confirm password|user type|create account\s*button/i.test(t)) {
    return "Account Information (password, user type, submit)";
  }
  if (/top navigation|click\s+"[^"]+"/i.test(t) || /navigation.*click/i.test(t)) {
    const q = String(stepText || "").match(/"([^"]+)"/);
    return q ? `Nav: ${q[1]}` : "Top navigation";
  }
  if (/add\s+to\s+cart/i.test(t) && /check|flyout|verify/i.test(t)) return "Added to Cart flyout checked";
  if (/add\s+to\s+cart/i.test(t)) return "Add to Cart clicked";
  if (/first product|product image/i.test(t)) return "First product opened";
  return String(stepText || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function buildFlowContextBlock(flow) {
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];
  const parsed = parseFlowSteps(steps);
  const lines = ["STRUCTURED FACTS FROM USER CHECKLIST (use exactly — do not invent):"];

  parsed.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.instruction}`);
    if (p.locator) {
      lines.push(`   MUST use this Playwright locator for step ${i + 1} (do not guess): page.${p.locator.replace(/^page\./, "")}`);
    }
  });

  const gate = extractSecureAccessPassword(steps);
  if (gate) {
    lines.push(`\nSecure Access gate (step 2 only — NOT registration password):`);
    lines.push(`  Password: ${gate}`);
    lines.push(
      `  await page.locator('input[type="password"]').first().fill('${gate}'); await page.getByRole('button', { name: /continue/i }).click();`
    );
  }
  const company = extractCompanySearchTerm(steps);
  if (company) {
    lines.push(`\nCompany search term (exact): "${company}"`);
    lines.push("Wait up to 120000ms for search results before clicking Select.");
  }

  const hasRegistration = steps.some((s) =>
    /personal information|account information|confirm password/i.test(String(s))
  );
  if (hasRegistration) {
    lines.push(`
REGISTRATION FORM (dev.ges.store — visible labels on screen):
  Personal Information: "First Name *", "Last Name *", "Email Address *", "Email Confirmation *", "Phone Number *"
  Account Information: "Password *", "Confirm Password *", "User Type *" (e.g. Exhibitor / 3rd Party/EAC)
Use fillPersonalInfo() and fillAccountPasswords() helpers if present, OR:
  page.getByLabel(/^first name/i), /^last name/i, /^email address$/i), /^email confirmation/i), /^phone/i)
  page.getByLabel(/^password$/i) and /^confirm password/i) for ACCOUNT passwords (label is literally "Password", not "account password")
  Password must meet requirements: use at least 8 chars with letter, number, special — e.g. Abc!123456789
  User type: getByLabel(/user type/i) or getByText(/exhibitor/i).click() or selectOption on combobox
NEVER use getByLabel(/account password|new password/i) — those labels do not exist on this site.
NEVER use h1 for "Find Your Company" — use getByLabel(/company name/i).`);
  }

  if (isEcommerceFlow(steps)) {
    const quoted = extractQuotedPhrases(steps);
    lines.push("\nE-COMMERCE / CATALOG NAVIGATION (use ONLY menu names from the user checklist):");
    for (const label of quoted) {
      const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = /\s/.test(label) ? esc.replace(/\s+/g, "\\s+") : `^${esc}$`;
      lines.push(
        `  "${label}" → await clickTopNavLink(page, ${JSON.stringify(label)}); (helper: header / a.main-menu-link / link — NOT getByRole('navigation'), many stores lack that landmark)`
      );
    }
    lines.push(`  After page.goto, call await waitForStorefront(page) to pass Cloudflare/bot checks before clicking menu items.`);
    lines.push(`  NEVER use broad partial regex like /decor/i (matches "HOME DECOR"). Use /^decor$/i or the full quoted label.`);
    lines.push(`  NEVER invent nav categories (Furniture, Sofas, etc.) unless the user wrote them in a step.`);
    lines.push(`  First product: await openFirstProductDetail(page) — listing pages have no Add to Cart; must open a URL containing /p/ first.`);
    lines.push(`  Add to Cart: await clickAddToCart(page) after openFirstProductDetail (PDP only).`);
    lines.push(`  Flyout check: await expect(page.getByText(/added\\s+to\\s+cart!?/i)).toBeVisible({ timeout: 15000 })`);
  }

  return lines.join("\n");
}

module.exports = {
  parseStepLine,
  parseFlowSteps,
  extractSecureAccessPassword,
  extractCompanySearchTerm,
  extractQuotedPhrases,
  isEcommerceFlow,
  summarizeStepForReport,
  buildFlowContextBlock,
};
