const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
    // Go to /login
    await page.goto('https://example.com/login');

    // If access password is asked give this FiP93&@1U94L
    const accessPasswordField = page.getByLabel('Access Password');
    const accessPasswordSubmitButton = page.getByRole('button', { name: 'Submit' }).or(page.getByRole('button', { name: 'Enter' }));

    if (await accessPasswordField.isVisible({ timeout: 5000 })) {
        await accessPasswordField.fill('FiP93&@1U94L');
        if (await accessPasswordSubmitButton.isVisible({ timeout: 2000 })) {
            await accessPasswordSubmitButton.click();
            await page.waitForLoadState('networkidle');
        }
    }

    // click Create an Account which is a hyperlink recides under this text "Login below or "
    await page.getByRole('link', { name: 'Create an Account' }).click();
    await page.waitForURL('**/register', { timeout: 10000 });

    // search lamb in search company field
    const searchCompanyField = page.getByLabel('Search Company').or(page.getByPlaceholder('Search Company'));
    await searchCompanyField.fill('lamb');
    await page.waitForTimeout(1000); // Give time for search results to appear

    // select the 3rd result
    await page.getByRole('listitem').nth(2).click(); // .nth(2) for the 3rd element (0-indexed)
    await page.waitForLoadState('domcontentloaded');

    // create an account with valid username password
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const password = 'Test@User123!'; 

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);

    const createAccountButton = page.getByRole('button', { name: 'Create Account' });
    const registerButton = page.getByRole('button', { name: 'Register' });

    if (await createAccountButton.isVisible({ timeout: 2000 })) {
        await createAccountButton.click();
    } else if (await registerButton.isVisible({ timeout: 2000 })) {
        await registerButton.click();
    } else {
        // Fallback for a generic submit button
        await page.getByRole('button', { name: /Submit|Continue/i }).click();
    }

    // Assert successful registration (example)
    await expect(page).toHaveURL(/success|dashboard|profile/i, { timeout: 15000 });
    await expect(page.getByText(/account created|registration successful|welcome/i)).toBeVisible({ timeout: 10000 });
});