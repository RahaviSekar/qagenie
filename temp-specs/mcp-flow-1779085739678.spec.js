const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://www.graciousgarage.com';

/**
 * Waits for the storefront to be ready by checking for a common element like the 'Home' link.
 * This helps in passing potential Cloudflare/bot checks and ensuring the main UI is loaded.
 * @param {import('@playwright/test').Page} page
 */
async function waitForStorefront(page) {
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible({ timeout: 45000 });
}

/**
 * Clicks a top navigation link by its exact accessible name.
 * Assumes the link is directly clickable without needing to navigate through a 'navigation' landmark.
 * @param {import('@playwright/test').Page} page
 * @param {string} name - The exact text name of the link to click.
 */
async function clickTopNavLink(page, name) {
    await page.getByRole('link', { name, exact: true }).first().click();
}

test("Add to Cart — happy path", async ({ page }) => {
    // Step 1: Go to the base url
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await waitForStorefront(page);

    // Step 2: in the top navigation click "Decor"
    await clickTopNavLink(page, 'Decor');
    await page.waitForLoadState('domcontentloaded');

    // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
    await clickTopNavLink(page, 'Wall Mirrors');
    await page.waitForLoadState('domcontentloaded');

    // Step 4: Click the image of the first product
    await page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 5: Click "Add to Cart" button
    await page.getByRole('button', { name: /add\s+to\s+cart/i }).first().click();

    // Step 6: Check Added to Cart! flyout is coming or not
    await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
});