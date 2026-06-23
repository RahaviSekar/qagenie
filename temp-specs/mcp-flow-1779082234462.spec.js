const { test, expect } = require('@playwright/test');

test("Add to Cart — happy path", async ({ page }) => {
    // Step 1: Go to the base url
    await page.goto('https://www.graciousgarage.com');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: in the top navigation click "Decor"
    await page.getByRole('link', { name: /decor/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // Step 3: inside "Decor" click "Wall Mirrors" under "Mirror" section
    await page.getByRole('link', { name: /wall\s+mirrors/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // Step 4: Click the image of the first product
    // This locator assumes product items are typically wrapped in a common container class (e.g., '.product-item' or '.product-card')
    // and that the main clickable area (often a link wrapping the image and/or title) leads to the product detail page.
    await page.locator('.product-item').first().getByRole('link').first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 5: Click "Add to Cart" button
    await page.getByRole('button', { name: /add\s+to\s+cart/i }).click();

    // Step 6: Check Added to Cart! flyout is coming or not
    // Assumes a visible message or flyout containing the text "Added to Cart!" appears after adding to cart.
    await expect(page.getByText(/added\s+to\s+cart!/i)).toBeVisible();
});

test('POS: Add to Cart from a different product category (e.g., Furniture -> Sofas)', async ({ page }) => {
  await page.goto('https://www.graciousgarage.com');

  // Navigate to 'Furniture' from the top navigation
  await page.getByRole('link', { name: 'Furniture', exact: true }).click();

  // Navigate to 'Sofas' within the Furniture section
  await page.getByRole('link', { name: 'Sofas', exact: true }).click();

  // Click the image/link of the first product listed in the Sofas category
  // Assuming products are in a grid and links contain '/product/' in their href
  await page.locator('div.product-grid a[href*="/product/"]').nth(0).click();

  // Click the "Add to Cart" button on the product detail page
  await page.getByRole('button', { name: 'Add to Cart' }).click();

  // Check if the "Added to Cart!" flyout is visible
  await expect(page.getByText('Added to Cart!', { exact: true })).toBeVisible();
});

test('POS: Add the second product from the "Wall Mirrors" category', async ({ page }) => {
  await page.goto('https://www.graciousgarage.com');

  // Navigate to 'Decor' from the top navigation
  await page.getByRole('link', { name: 'Decor', exact: true }).click();

  // Navigate to 'Wall Mirrors' within the Decor section
  await page.getByRole('link', { name: 'Wall Mirrors', exact: true }).click();

  // Click the image/link of the second product listed in the Wall Mirrors category
  // Using nth(1) to select the second item (0-indexed)
  await page.locator('div.product-grid a[href*="/product/"]').nth(1).click();

  // Click the "Add to Cart" button on the product detail page
  await page.getByRole('button', { name: 'Add to Cart' }).click();

  // Check if the "Added to Cart!" flyout is visible
  await expect(page.getByText('Added to Cart!', { exact: true })).toBeVisible();
});

test('POS: Add multiple quantities (e.g., 3) of the first Wall Mirror product', async ({ page }) => {
  await page.goto('https://www.graciousgarage.com');

  // Navigate to 'Decor' from the top navigation
  await page.getByRole('link', { name: 'Decor', exact: true }).click();

  // Navigate to 'Wall Mirrors' within the Decor section
  await page.getByRole('link', { name: 'Wall Mirrors', exact: true }).click();

  // Click the image/link of the first product listed in the Wall Mirrors category
  await page.locator('div.product-grid a[href*="/product/"]').nth(0).click();

  // Locate the quantity input field and set its value to 3
  // Using getByLabel with a regex for 'Quantity' to find the input
  await page.getByLabel(/quantity/i).fill('3');

  // Click the "Add to Cart" button on the product detail page
  await page.getByRole('button', { name: 'Add to Cart' }).click();

  // Check if the "Added to Cart!" flyout is visible
  await expect(page.getByText('Added to Cart!', { exact: true })).toBeVisible();
});

test('NEG: Attempt to add to cart without selecting a mandatory product variation (Color)', async ({ page }) => {
    // 1. Go to the base url
    await page.goto('https://www.graciousgarage.com', { timeout: 30000 });

    // 2. in the top navigation click "Decor"
    await page.getByRole('link', { name: 'Decor', exact: true }).click();

    // Navigate to a product that requires a variation selection, e.g., "Decorative Floral Gold Wall Decor" from Wall Art
    await page.getByRole('link', { name: 'Wall Art', exact: true }).click();
    await page.getByRole('link', { name: 'Decorative Floral Gold Wall Decor' }).click();

    // 4. Click "Add to Cart" button without selecting a color
    // The default state for the 'Color' dropdown is "Choose an option...", which is not a valid selection.
    await page.getByRole('button', { name: 'Add to cart' }).click();

    // 5. Assert: Expect a validation message and no "Added to Cart!" success notification.
    await expect(page.getByText('Please select some product options before adding this product to your cart.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('alert', { name: /has been added to your cart/i })).not.toBeVisible({ timeout: 15000 });
});

test('NEG: Attempt to add an excessively large quantity to cart', async ({ page }) => {
    // 1. Go to the base url
    await page.goto('https://www.graciousgarage.com', { timeout: 30000 });

    // 2. in the top navigation click "Decor"
    await page.getByRole('link', { name: 'Decor', exact: true }).click();

    // 3. inside "Decor" click "Wall Mirrors" under "Mirror" section
    await page.getByRole('link', { name: 'Wall Mirrors', exact: true }).click();

    // 4. Click the image of the first product
    await page.locator('.product-image').first().click();

    // Fill quantity field with an excessively large number
    await page.getByLabel('Qty').fill('99999999');

    // 5. Click "Add to Cart" button
    await page.getByRole('button', { name: 'Add to cart' }).click();

    // 6. Assert: Expect an error message related to stock limits or quantity, and no "Added to Cart!" success notification.
    await expect(page.getByText(/You cannot add that amount to the cart/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('alert', { name: /has been added to your cart/i })).not.toBeVisible({ timeout: 15000 });
});

test('NEG: Attempt to interact with "Add to Cart" on a non-product (404) page', async ({ page }) => {
    // 1. Go to a non-existent URL within the app origin
    await page.goto('https://www.graciousgarage.com/non-existent-product-flow/', { timeout: 30000 });

    // 2. Assert: Expect the page to display a "Page not found" message
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible({ timeout: 15000 });

    // 3. Assert: The "Add to Cart" button should not be present on a 404 page.
    await expect(page.getByRole('button', { name: 'Add to cart' })).not.toBeVisible({ timeout: 15000 });
});