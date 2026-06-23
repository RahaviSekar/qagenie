const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://www.graciousgarage.com';

// Helper function to handle initial storefront loading and potential bot checks.
// For graciousgarage.com, we'll wait for a key element in the header.
async function waitForStorefront(page) {
  // Wait for the main site logo/name link to be visible, indicating the page has loaded and passed any initial checks.
  await page.getByRole('link', { name: 'Gracious Garage' }).first().waitFor({ state: 'visible', timeout: 15000 });
}

// Helper function for clicking top navigation links with exact text match.
// This helper is for navigation items found in the main menu (header).
async function clickTopNavLink(page, label) {
  await page.getByRole('link', { name: label, exact: true }).first().click();
}

test("Add to Cart — happy path", async ({ page }) => {
  // Step 1: Go to the base url
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await waitForStorefront(page);

  // Step 2: in the top navigation click "Decor"
  await clickTopNavLink(page, 'Decor');
  await page.waitForLoadState('domcontentloaded'); // Wait for the Decor category page to load

  // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  // As per instructions, 'Wall Mirrors' is the clickable link, 'Mirror' is a section context.
  await clickTopNavLink(page, 'Wall Mirrors');
  await page.waitForLoadState('domcontentloaded'); // Wait for the Wall Mirrors product listing page to load

  // Step 4: Click the image of the first product
  // Locator targets the first link within the main content area that contains an image.
  await page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first().click();
  await page.waitForLoadState('domcontentloaded'); // Wait for the product detail page to load

  // Step 5: Click "Add to Cart" button
  // Locator targets the "Add to Cart" button, allowing for case-insensitivity and variations in whitespace.
  await page.getByRole('button', { name: /add\s+to\s+cart/i }).first().click();

  // Step 6: Check Added to Cart! flyout is coming or not
  // Expect a text indicating successful addition to cart to become visible, with a generous timeout.
  await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
});