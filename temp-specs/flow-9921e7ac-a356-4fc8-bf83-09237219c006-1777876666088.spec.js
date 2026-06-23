const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
    // Step 1: Go to /login
    await page.goto('https://dev.ges.store/login');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue|submit/i }).click();
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 }); // Wait for the gate to disappear

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
    await expect(page.getByRole('heading', { name: /find\s+your\s+company/i })).toBeVisible({ timeout: 15000 });
    await page.getByLabel(/company\s+name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for the search results to load, allowing up to 2 minutes as per instruction
    await page.waitForLoadState('domcontentloaded');

    // Step 5: scroll down to see the search results and click the select button of the 1st result
    await expect(page.getByRole('heading', { name: /search\s+results/i })).toBeVisible({ timeout: 120000 }); // Max 2 mins wait for results
    await page.getByRole('button', { name: /^select$/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 6: Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
    // In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
    const firstName = 'Test';
    const lastName = 'User';
    const email = `testuser${Date.now()}@example.com`; // Unique email
    const phoneNumber = '555-123-4567';
    const password = 'P@ssw0rd123!'; // Example password fulfilling common requirements

    // Personal Information
    await expect(page.getByRole('heading', { name: /personal\s+information/i })).toBeVisible();
    await page.getByLabel(/first\s+name/i).fill(firstName);
    await page.getByLabel(/last\s+name/i).fill(lastName);
    await page.getByLabel(/email\s+address/i).fill(email);
    await page.getByLabel(/email\s+confirmation/i).fill(email);
    await page.getByLabel(/phone\s+number/i).fill(phoneNumber);

    // Account Information
    await expect(page.getByRole('heading', { name: /account\s+information/i })).toBeVisible();
    await page.getByLabel(/^password$/i).fill(password); // Using ^$ to match exact "Password" label
    await page.getByLabel(/confirm\s+password/i).fill(password);

    // Select user type (assuming a select element with "user type" in its accessible name or label)
    // Common user types might be "Employee", "Customer", "Admin". We'll try "Employee" as a common default.
    // If it's a combobox (select element), use selectOption
    // If it's a custom dropdown, we might need to click to open it and then click an option.
    // For robustness, target the select element by label or a generic locator if getByRole fails.
    try {
        await page.getByRole('combobox', { name: /user\s+type/i }).selectOption({ label: 'Employee' });
    } catch (error) {
        // Fallback if 'Employee' is not available or if it's not a standard combobox, try selecting the first available option.
        // This might require more specific knowledge of the UI. For now, assuming standard combobox with 'Employee'.
        // If it's just a generic select without a clear label but has "UserType" in its id:
        console.warn(`Could not select 'Employee' for user type combobox, trying first option or generic select. Error: ${error.message}`);
        await page.locator('select[id*="UserType"], select[name*="UserType"]').first().selectOption({ index: 1 }); // Try first non-placeholder option
    }

    // Click Create Account button
    await page.getByRole('button', { name: /create\s+account/i }).click();

    // Optionally, add an assertion to confirm successful account creation, e.g.,
    // await expect(page.getByRole('heading', { name: /account\s+created\s+successfully/i })).toBeVisible({ timeout: 15000 });
});