const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
    // MANDATORY app origin for ALL navigation: https://dev.ges.store

    // Step 1: Go to /login
    await page.goto('https://dev.ges.store/login');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    // Detect the Secure Access gate by its prominent text
    const secureAccessPrompt = page.getByText(/enter the password to continue/i);
    await expect(secureAccessPrompt).toBeVisible({ timeout: 10000 }); // Wait for the prompt to be visible

    // Fill the password field (common selector for password input)
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');

    // Click the continue button
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for the Secure Access gate to disappear, indicating successful bypass
    await expect(secureAccessPrompt).not.toBeVisible({ timeout: 15000 });

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('domcontentloaded'); // Ensure page is loaded after clicking the link

    // Step 4: search lamb in search company field
    // Using getByPlaceholder as a common way to find search fields
    const companySearchField = page.getByPlaceholder(/search company/i);
    await companySearchField.fill('lamb');

    // Step 5: select the 3rd result
    // This assumes search results appear in a dynamic list, often with semantic roles like 'listbox' and 'option'.
    // We wait for the 3rd option to be visible before clicking it.
    const thirdSearchResult = page.locator('[role="listbox"] [role="option"]').nth(2);
    await thirdSearchResult.waitFor({ state: 'visible', timeout: 10000 }); // Wait for the 3rd result to appear
    await thirdSearchResult.click();
    await page.waitForLoadState('domcontentloaded'); // Wait for any navigation or content update after selection

    // Step 6: create an account with valid username password
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`; // Generate a unique username
    const password = 'TestP@ssw0rd123!'; // A valid password with mixed case, number, special char

    // Fill username field
    await page.getByLabel(/username|email/i).fill(username); // Common labels for username/email
    // Fill password field
    await page.getByLabel(/^password$/i).fill(password); // Exact match for 'password' label
    // Fill confirm password field (assuming it's present)
    await page.getByLabel(/confirm password|re-enter password/i).fill(password);

    // Click the registration/create account button
    await page.getByRole('button', { name: /register|sign up|create account/i }).first().click();

    // Optional: Add an assertion here to verify successful account creation,
    // e.g., checking for a success message or redirect to a dashboard/profile page.
    // await expect(page.getByText(/account created successfully/i)).toBeVisible();
    // await expect(page).toHaveURL(/dashboard|success/);
});