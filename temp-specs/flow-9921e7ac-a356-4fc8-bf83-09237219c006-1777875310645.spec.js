const { test, expect } = require('@playwright/test');

const APP_ORIGIN = 'https://dev.ges.store';

test('Register flow', async ({ page }) => {
    // Step 1: Go to /login
    await page.goto(`${APP_ORIGIN}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    const secureAccessGateHeading = page.getByRole('heading', { name: /secure access|password to continue/i });
    const secureAccessGateText = page.getByText(/enter the password to continue/i);
    // Wait for the gate to appear, checking for either a heading or specific text
    await expect(secureAccessGateHeading.or(secureAccessGateText)).toBeVisible({ timeout: 10000 });
    
    // Fill the password field, typically identified by its type or general input role
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    
    // Click the continue button, tolerating different casing or exact text
    await page.getByRole('button', { name: /continue|submit/i }).first().click();
    
    // Wait for the secure access gate to disappear, indicating successful bypass
    await expect(secureAccessGateHeading).not.toBeVisible({ timeout: 15000 });

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    // Use .or() to robustly find either a link or a button labeled "Create an Account"
    await page.getByRole('link', { name: /create\s+an?\s+account/i })
        .or(page.getByRole('button', { name: /create\s+an?\s+account/i }))
        .first()
        .click();
    await page.waitForLoadState('domcontentloaded'); // Wait for the new page to load after click

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button
    // Verify landing on the "Find Your Company" page by checking for its heading
    await expect(page.getByRole('heading', { name: /find your company/i })).toBeVisible();
    
    // Fill the "Company Name" field, identified by its label
    await page.getByLabel(/company name/i).fill('lamb');
    
    // Click the search button
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForLoadState('domcontentloaded'); // Wait for search results to load

    // Step 5: select the 3rd result
    // Wait for search results to be visible (e.g., a heading indicating results section)
    await expect(page.getByRole('heading', { name: /search results|company search results/i })).toBeVisible();
    
    // Locate all 'Select' buttons and click the 3rd one (index 2 for 0-indexed arrays)
    const selectButtons = page.getByRole('button', { name: /^select$/i });
    await expect(selectButtons.nth(2)).toBeEnabled(); // Ensure the 3rd button is enabled before clicking
    await selectButtons.nth(2).click();
    await page.waitForLoadState('domcontentloaded'); // Wait for the next page after selecting a company

    // Step 6: create an account with valid username password
    // Verify we are on the account creation/registration form by checking for a relevant heading
    await expect(page.getByRole('heading', { name: /create account|register/i })).toBeVisible(); 
    
    // Fill the email/username field
    await page.getByLabel(/email address|username/i).first().fill('testuser_ges@example.com');
    
    // Fill the password field
    await page.getByLabel(/^password$/i).first().fill('TestP@ssword123!');
    
    // Fill the confirm password field
    await page.getByLabel(/confirm password|re-enter password/i).first().fill('TestP@ssword123!');
    
    // Click the final registration/create account button
    await page.getByRole('button', { name: /register|create account|submit/i }).first().click();
    
    // Optional: Add an assertion here to confirm successful registration, e.g.,
    // await expect(page.getByText(/account created successfully|welcome/i)).toBeVisible();
});