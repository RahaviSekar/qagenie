const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://example.com/login');

    // 2. Click "Create account"
    // We assume "Create account" is a link that navigates to a registration page.
    await page.getByRole('link', { name: 'Create account' }).click();

    // Wait for the page to navigate to the registration URL.
    // Adjust '/register' if the actual path is different, e.g., '/signup'.
    await page.waitForURL('https://example.com/register');

    // 3. Search "lamb" in the "Search company" field
    // Assuming the company search field has a placeholder 'Search company'.
    await page.getByPlaceholder('Search company').fill('lamb');

    // Playwright's auto-waiting will wait for the options to appear.
    // If results are particularly slow, an explicit wait like
    // await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10000 });
    // could be added here.

    // 4. Select the 3rd result
    // We assume search results are presented as selectable options (e.g., in a combobox/autocomplete).
    // .nth(2) selects the third element because Playwright uses 0-based indexing.
    await page.getByRole('option').nth(2).click();

    // 5. Create an account with valid username and password
    // Fill out the registration form fields using resilient locators.
    await page.getByLabel('Username').fill('testuser_pw');
    await page.getByLabel('Email').fill('testuser_pw@example.com');
    await page.getByLabel('Password').fill('SecureP@ss123!');
    await page.getByLabel('Confirm Password').fill('SecureP@ss123!'); // Or 'Repeat Password'

    // Click the "Register" button to submit the form.
    await page.getByRole('button', { name: 'Register' }).click();

    // Verification: Expect to be redirected to a dashboard or success page.
    // This assertion includes a reasonable timeout for potential slow navigation after submission.
    await expect(page).toHaveURL('https://example.com/dashboard', { timeout: 15000 });
    // Alternatively, if a success message is displayed on the same page:
    // await expect(page.getByText('Account created successfully!')).toBeVisible({ timeout: 15000 });
});