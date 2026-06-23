const { test, expect } = require('@playwright/test');

test('Register', async ({ page }) => {
    const BASE_URL = 'https://dev.ges.store';

    // Step 1: Go to /login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: You will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    const secureAccessGateHeading = page.getByRole('heading', { name: /secure access|password to continue/i });
    
    // Ensure the secure access gate is visible before interacting
    await expect(secureAccessGateHeading).toBeVisible({ timeout: 10000 });

    // Fill the password field (using a generic input[type="password"] locator)
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    
    // Click the "Continue" button
    await page.getByRole('button', { name: /continue|submit/i }).click();

    // Wait for the secure access gate to disappear, indicating successful bypass
    await expect(secureAccessGateHeading).not.toBeVisible({ timeout: 15000 });
    // After the gate disappears, a new page might load or content changes, so ensure DOM is loaded
    await page.waitForLoadState('domcontentloaded');

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button
    await page.getByRole('textbox', { name: /company\s+name/i }).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('domcontentloaded'); // Wait for search results to load

    // Step 5: select the 3rd result
    // This step assumes search results are interactive elements (e.g., div with role, li, a, button)
    // and we need to click the third one.
    // The locator targets common patterns for clickable result items and selects the 3rd one (0-indexed).
    await page.locator('div[role="listitem"], li[role="listitem"], a[role="link"], button[role="button"]')
        .nth(2) // Selects the 3rd element (0-indexed means 2)
        .click();
    await page.waitForLoadState('domcontentloaded'); // After selecting the company, likely navigates or updates

    // Step 6: create an account with valid username password
    // Generate a unique username for each test run
    const username = `testuser${Date.now()}${Math.floor(Math.random() * 1000)}@gesstore.com`;
    const password = 'SecurePassword123!'; // A strong, valid password

    // Fill username/email field
    await page.getByRole('textbox', { name: /username|email/i }).fill(username);
    
    // Fill password fields using input type for robustness, assuming two password fields (password, confirm password)
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill(password); // First password field
    await passwordFields.nth(1).fill(password);  // Second password field (confirm password)

    // Click the "Create Account" or "Register" button
    await page.getByRole('button', { name: /create\s+account|register|submit/i }).click();

    // Optional: Add an assertion here to verify successful account creation,
    // e.g., redirect to a dashboard, a success message, or a specific URL.
    // For example:
    // await expect(page.getByText(/account created successfully|welcome/i)).toBeVisible({ timeout: 15000 });
    // await expect(page.url()).not.toContain('/register'); // Check that we've navigated away from the registration page
});