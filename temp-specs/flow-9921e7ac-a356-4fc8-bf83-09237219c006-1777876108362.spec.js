const { test, expect } = require('@playwright/test');

const APP_ORIGIN = 'https://dev.ges.store';
const SECURE_ACCESS_PASSWORD = 'FiP93&@1U94L';

test('Register flow', async ({ page }) => {
    // Step 1: Go to /login
    await page.goto(`${APP_ORIGIN}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    const secureAccessHeading = page.getByRole('heading', { name: /secure access|password to continue/i });
    await expect(secureAccessHeading).toBeVisible();
    await page.locator('input[type="password"]').first().fill(SECURE_ACCESS_PASSWORD);
    await page.getByRole('button', { name: /continue|submit/i }).click();
    await expect(secureAccessHeading).not.toBeVisible({ timeout: 15000 }); // Wait for the gate to disappear

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button
    await expect(page.getByRole('heading', { name: /find your company/i })).toBeVisible();
    await page.getByPlaceholder(/company name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    // Await for search results to load, often indicated by a change in DOM or a specific element appearing
    await page.waitForLoadState('domcontentloaded'); // Ensure page is ready after search

    // Step 5: scroll down to see the search results and click the select button of the 1st result
    // Wait for the "Search Results" section to be visible
    await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible();
    await page.getByRole('button', { name: /^select$/i }).first().click();

    // Step 6: Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // Generate a unique email for the test
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('555-123-4567');

    // Step 8: In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
    // Using a strong password adhering to common requirements (e.g., uppercase, lowercase, number, special char)
    const newAccountPassword = 'User123!@#';
    await page.getByLabel(/^password$/i).fill(newAccountPassword);
    await page.getByLabel(/confirm password/i).fill(newAccountPassword);
    // Assuming 'User Type' is a standard select dropdown. Selects the second option (index 1).
    await page.getByLabel(/user type/i).selectOption({ index: 1 });
    await page.getByRole('button', { name: /create account/i }).click();

    // Optionally, add an assertion to confirm successful account creation or redirection
    // Example: await expect(page.getByText(/account created successfully/i)).toBeVisible();
    // Or: await expect(page).toHaveURL(`${APP_ORIGIN}/dashboard`); // Assuming redirection to a dashboard
    await page.waitForLoadState('domcontentloaded');
});