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

// Helper function to wait for storefront to be ready (handles Cloudflare/bot checks)


// Helper function to click top navigation links


test("Add to Cart — happy path", async ({ page }) => {
  const baseURL = 'https://www.graciousgarage.com';

  // Step 1: Go to the Base URL for this flow
  // Step 1: Go to the Base URL for this flow
  await page.goto(baseURL);
  await waitForStorefront(page);

  // Step 2: in the top navigation click "Decor"
  // Step 2: in the top navigation click "Decor"
  await clickTopNavLink(page, 'Decor');
  await page.waitForLoadState('domcontentloaded');

  // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  // Assuming "Wall Mirrors" is a direct link under "Decor" and "Mirror" is a section header.
  // If "Mirror" is also a clickable element, the logic might need adjustment.
  // Based on typical site structure, we'll navigate directly to "Wall Mirrors".
  await clickTopNavLink(page, 'Wall Mirrors');
  await page.waitForLoadState('domcontentloaded');

  // Step 4: Click the image of the first product
  // Step 4: Click the image of the first product
  const firstProduct = page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first();
  await expect(firstProduct).toBeVisible({ timeout: 15000 });
  await firstProduct.click();
  await page.waitForLoadState('domcontentloaded');

  // Step 5: Click "Add to Cart" button
  // Step 5: Click "Add to Cart" button
  const addToCartButton = page.getByRole('button', { name: /add\s+to\s+cart/i }).first();
  await expect(addToCartButton).toBeVisible({ timeout: 15000 });
  await addToCartButton.click();

  // Step 6: Check Added to Cart! flyout is coming or not
  // Step 6: Check Added to Cart! flyout is coming or not
  await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
});