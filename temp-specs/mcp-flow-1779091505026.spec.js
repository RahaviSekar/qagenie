/* QA_GENIE_ECOMMERCE_RUNTIME */

/** Live progress in QA Genie Activity log (stdout → [QA Genie] lines) */
function qaStep(page, message) {
  const url = typeof page?.url === "function" ? page.url() : "";
  console.log(`[QA Genie] ${message}${url ? " | " + url : ""}`);
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
  qaStep(page, `Click top nav: "${label}"`);
  const escaped = String(label).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp("^" + escaped + "$", "i");
  const menuLinks = page.locator("a.main-menu-link", { hasText: re });

  const visible = menuLinks.filter({ visible: true });
  if ((await visible.count()) > 0) {
    try {
      await visible.first().click({ timeout: 15000 });
      await page.waitForLoadState("domcontentloaded");
      qaStep(page, `Navigated after "${label}"`);
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
      qaStep(page, `Navigated after "${label}"`);
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
    qaStep(page, `Opening ${target} (menu link was off-screen)`);
    await page.goto(target, { waitUntil: "domcontentloaded" });
    qaStep(page, `Navigated after "${label}"`);
    return;
  }

  await page.evaluate((linkText) => {
    const re = new RegExp(
      "^" + String(linkText).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "$",
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
  qaStep(page, `Navigated after "${label}" (in-page click)`);
}

/** Subcategory / megamenu links (e.g. Wall Mirrors) */
async function clickCategoryLink(page, label) {
  await dismissCookieBanner(page);
  qaStep(page, `Click category: "${label}"`);
  const escaped = String(label).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp("^" + escaped + "$", "i");
  const links = page.getByRole("link", { name: re });
  const visible = links.filter({ visible: true });
  if ((await visible.count()) > 0) {
    await visible.first().click({ timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    qaStep(page, `Opened category "${label}"`);
    return;
  }
  const href = await links.first().getAttribute("href").catch(() => null);
  if (href) {
    const target = new URL(href, page.url()).toString();
    await page.goto(target, { waitUntil: "domcontentloaded" });
    qaStep(page, `Opened category "${label}" at ${target}`);
    return;
  }
  await links.first().click({ force: true, timeout: 15000 });
  qaStep(page, `Opened category "${label}"`);
}

const { test, expect } = require('@playwright/test');

// Helper function to pass Cloudflare/bot checks


// Helper function for top navigation links


test("Add to Cart — happy path", async ({ page }) => {
  // Step 1: Go to the Base URL for this flow
  // Step 1: Go to the Base URL for this flow
  await page.goto('https://www.graciousgarage.com');
  await page.waitForLoadState('domcontentloaded');
  await waitForStorefront(page);

  // Step 2: in the top navigation click "Decor"
  // Step 2: in the top navigation click "Decor"
  await clickTopNavLink(page, 'Decor');

  // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  await page.getByRole('link', { name: 'Mirror' }).first().click(); // Assuming "Mirror" is a submenu item under Decor
  await page.getByRole('link', { name: 'Wall Mirrors' }).first().click(); // Assuming "Wall Mirrors" is a submenu item under Mirror

  // Step 4: Click the image of the first product
  // Step 4: Click the image of the first product
  await page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first().click();

  // Step 5: Click "Add to Cart" button
  // Step 5: Click "Add to Cart" button
  await page.getByRole('button', { name: /add\s+to\s+cart/i }).first().click();

  // Step 6: Check Added to Cart! flyout is coming or not
  // Step 6: Check Added to Cart! flyout is coming or not
  await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
});