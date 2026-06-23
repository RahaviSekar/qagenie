
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

/** HomeClick / graciousgarage — use a.main-menu-link; scroll + retry (avoids "outside viewport") */
async function clickTopNavLink(page, label) {
  await dismissCookieBanner(page);
  qaStep(page, `Click top nav: "${label}"`);
  const escaped = String(label).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp("^" + escaped + "$", "i");
  const menuLinks = page.locator("a.main-menu-link", { hasText: re });
  const n = await menuLinks.count();
  for (let i = 0; i < n; i++) {
    const link = menuLinks.nth(i);
    const box = await link.boundingBox().catch(() => null);
    if (!box || box.width < 2 || box.height < 2) continue;
    await link.scrollIntoViewIfNeeded();
    try {
      await link.click({ timeout: 15000 });
      qaStep(page, `Navigated after "${label}"`);
      return;
    } catch (_) {
      await link.click({ force: true, timeout: 10000 });
      qaStep(page, `Navigated after "${label}" (force click)`);
      return;
    }
  }
  const fallback = page.getByRole("link", { name: re }).first();
  await fallback.scrollIntoViewIfNeeded();
  await fallback.click({ force: true, timeout: 20000 });
  qaStep(page, `Navigated after "${label}"`);
}

/** Subcategory / megamenu links (e.g. Wall Mirrors) — not the main-menu strip */
async function clickCategoryLink(page, label) {
  await dismissCookieBanner(page);
  qaStep(page, `Click category: "${label}"`);
  const escaped = String(label).replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp("^" + escaped + "$", "i");
  const link = page.getByRole("link", { name: re });
  await link.first().scrollIntoViewIfNeeded();
  try {
    await link.first().click({ timeout: 20000 });
  } catch (_) {
    await link.first().click({ force: true, timeout: 15000 });
  }
  qaStep(page, `Opened category "${label}"`);
}

const { test, expect } = require('@playwright/test');

/** Live progress in QA Genie Activity log (stdout → [QA Genie] lines) */
function qaStep(page, message) {
  const url = typeof page?.url === "function" ? page.url() : "";
  console.log(`[QA Genie] ${message}${url ? " | " + url : ""}`);
}





/** HomeClick / graciousgarage — use a.main-menu-link; scroll + retry (avoids "outside viewport") */


/** Subcategory / megamenu links (e.g. Wall Mirrors) — not the main-menu strip */

const baseURL = 'https://www.graciousgarage.com';

/**
 * Helper function to wait for the storefront to be fully loaded and ready for interaction.
 * This is crucial for bypassing initial load states, Cloudflare/bot checks, etc.
 * For graciousgarage.com, waiting for `networkidle` is a robust approach.
 * @param {import('@playwright/test').Page} page The Playwright page object.
 */


/**
 * Helper function to click a top-level navigation link.
 * It uses `getByRole('link', { name: linkText, exact: true })` as specified.
 * @param {import('@playwright/test').Page} page The Playwright page object.
 * @param {string} linkText The exact text of the navigation link to click.
 */


test("Add to Cart — happy path", async ({ page }) => {
    // Step 1: Go to the base url
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded'); // Explicit wait after initial goto
    await waitForStorefront(page); // Pass Cloudflare/bot checks before interacting

    // Step 2: in the top navigation click "Decor"
    await clickTopNavLink(page, 'Decor');

    // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
    // The instructions imply "Wall Mirrors" is directly clickable after navigating to "Decor".
    await clickTopNavLink(page, 'Wall Mirrors');

    // Step 4: Click the image of the first product
    // Locate the first product link that contains an image within the main content area.
    await page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first().click();
    await page.waitForLoadState('domcontentloaded'); // Wait for the product detail page to load

    // Step 5: Click "Add to Cart" button
    // Locate the "Add to Cart" button using a case-insensitive regex for flexibility.
    await page.getByRole('button', { name: /add\s+to\s+cart/i }).first().click();

    // Step 6: Check Added to Cart! flyout is coming or not
    // Assert that the "Added to Cart!" flyout text becomes visible within a reasonable timeout.
    await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
});