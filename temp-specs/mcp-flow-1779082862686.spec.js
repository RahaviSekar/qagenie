const { test, expect } = require('@playwright/test');

test("Add to Cart — happy path", async ({ page }) => {
  // Step 1: Go to the base url
  await page.goto('https://www.graciousgarage.com');
  await page.waitForLoadState('domcontentloaded');

  // Step 2: in the top navigation click "Decor"
  await page.getByRole('navigation').getByRole('link', { name: /^Decor$/i }).first().click();
  await page.waitForLoadState('domcontentloaded');

  // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
  await page.getByRole('link', { name: /Wall\s+Mirrors/i }).first().click();
  await page.waitForLoadState('domcontentloaded');

  // Step 4: Click the image of the first product
  await page.getByRole('main').getByRole('link').filter({ has: page.locator('img') }).first().click();
  await page.waitForLoadState('domcontentloaded');

  // Step 5: Click "Add to Cart" button
  await page.getByRole('button', { name: /add\s+to\s+cart/i }).first().click();

  // Step 6: Check Added to Cart! flyout is coming or not
  await expect(page.getByText(/added\s+to\s+cart!?/i)).toBeVisible({ timeout: 15000 });
});