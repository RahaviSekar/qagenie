const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://example.com/login');

    // 2. If Secure Access password is asked, give this FiP93&@1U94L
    const secureAccessPasswordField = page.getByLabel('Secure Access password');
    // Check if the secure access password field is visible with a reasonable timeout
    if (await secureAccessPasswordField.isVisible({ timeout: 5000 })) {
        await secureAccessPasswordField.fill('FiP93&@1U94L');
        // Assuming a common submit button after entering the secure password
        await page.getByRole('button', { name: /Submit|Continue/i }).click();
    }

    // 3. Click "Create an Account" hyperlink
    // Using getByRole for resilience, targeting a link by its accessible name
    await page.getByRole('link', { name: 'Create an Account' }).click();

    // 4. Search "lamb" in the "search company" field
    // Using getByPlaceholder for resilience, targeting an input by its placeholder text
    await page.getByPlaceholder('Search company').fill('lamb');

    // 5. Select the 3rd result
    // Assuming search results are rendered as list items (getByRole('listitem')).
    // .nth(2) targets the third item (0-indexed).
    await page.getByRole('listitem').nth(2).click();

    // 6. Create an account with valid username and password
    // Using getByLabel for input fields for robust targeting
    await page.getByLabel('Username').fill('registeruser123');
    await page.getByLabel('Password', { exact: true }).fill('MyStrongP@ssw0rd!'); // Use exact to differentiate from 'Confirm Password'
    // Assuming a confirmation password field is common for registration
    await page.getByLabel('Confirm Password').fill('MyStrongP@ssw0rd!');
    
    // Click the final registration button
    // Using getByRole for resilience, targeting a button by its accessible name
    await page.getByRole('button', { name: 'Register' }).click();

    // Optional: Add an expectation here to confirm successful registration, e.g.:
    // await expect(page.getByText('Account created successfully')).toBeVisible();
});