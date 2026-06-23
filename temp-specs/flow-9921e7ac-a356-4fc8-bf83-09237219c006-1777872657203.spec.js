const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
    // Base URL for the application
    const BASE_URL = 'https://example.com';

    // 1. Go to /login
    await page.goto(`${BASE_URL}/login`, { timeout: 60000 });

    // 2. If access password is asked give this FiP93&@1U94L
    const accessPasswordField = page.getByLabel('Access Password');
    // Check if the access password field is visible within 5 seconds
    if (await accessPasswordField.isVisible({ timeout: 5000 })) {
        console.log('Access password field detected. Entering password.');
        await accessPasswordField.fill('FiP93&@1U94L');
        // Assuming there's a 'Submit' button or similar after entering the password
        await page.getByRole('button', { name: 'Submit' }).click();
        // Wait for the page to settle after submitting the password (e.g., navigation or content load)
        await page.waitForLoadState('networkidle', { timeout: 10000 });
    } else {
        console.log('Access password field not detected. Proceeding directly.');
    }

    // 3. click create account
    await page.getByRole('link', { name: 'Create Account' }).click();
    // Wait for navigation to the registration page
    await page.waitForURL(`${BASE_URL}/register`, { timeout: 10000 });

    // 4. search lamb in search company field
    // Attempt to locate the company search field by label or placeholder
    const companySearchField = page.getByLabel('Company Name', { exact: true })
                                   .or(page.getByPlaceholder('Search Company'));
    await companySearchField.waitFor({ state: 'visible', timeout: 10000 });
    await companySearchField.fill('lamb');

    // Give a short moment for search results to populate (e.g., via AJAX)
    await page.waitForTimeout(1000);

    // 5. select the 3rd result
    // Assuming search results appear as selectable items, e.g., with role="option"
    const thirdResult = page.getByRole('option').nth(2); // .nth(2) corresponds to the 3rd item (0-indexed)
    await thirdResult.waitFor({ state: 'visible', timeout: 10000 });
    await thirdResult.click();

    // Give a short moment for the selection to process and potentially update the form
    await page.waitForTimeout(500);

    // 6. create an account with valid username password
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const email = `testuser_${timestamp}@example.com`; // Often email is required for registration
    const password = `SecureP@ssw0rd!${timestamp}`; // Generate a unique password

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email); // Assuming there's an Email field
    await page.getByLabel('Password', { exact: true }).fill(password); // Use exact to differentiate if multiple 'Password' labels
    await page.getByLabel('Confirm Password').fill(password);

    // Click the registration button
    const registerButton = page.getByRole('button', { name: 'Register' })
                               .or(page.getByRole('button', { name: 'Create Account' }));
    await registerButton.click();

    // Verify successful registration. This might be a redirect to a dashboard or a success page.
    // Adjust the URL pattern to match your application's success state.
    await expect(page).toHaveURL(/.*(success|dashboard)/, { timeout: 15000 });
    console.log(`Successfully registered account for username: ${username}`);
});