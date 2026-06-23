import { test, expect } from '@playwright/test';

const BASE_URL = 'https://dev.ges.store';

test('Register flow', async ({ page }) => {
    // 1. Go to /login
    await page.goto(`${BASE_URL}/login`);

    // 2. Click create account
    // This assumes 'Create an account' is a link that navigates to the registration page.
    await page.getByRole('link', { name: 'Create an account' }).click();

    // 3. Search "lamb" in search company field
    // Assuming the company search input has a placeholder 'Search company'.
    await page.getByPlaceholder('Search company').fill('lamb');

    // 4. Select the 3rd result
    // Playwright automatically waits for elements to be visible and enabled before interacting.
    // However, for dynamic search results, explicitly waiting for the element to appear
    // before attempting to click it can improve stability.
    // This assumes results are rendered as list items and 'lamb' yields at least 3.
    const thirdResult = page.getByRole('listitem').nth(2);
    await thirdResult.waitFor({ state: 'visible', timeout: 10000 }); // Wait up to 10 seconds for the result to appear
    await thirdResult.click();

    // 5. Create an account with valid username password
    // Using a timestamp to generate a unique email address for each test run
    // to prevent conflicts if the application requires unique emails.
    const timestamp = new Date().getTime();
    const username = `testuser${timestamp}@example.com`;
    const password = `SecureP@ss${timestamp}`;

    await page.getByLabel('Email').fill(username);
    // Using { exact: true } to differentiate 'Password' from 'Confirm Password' labels
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);

    // Assuming the submit button for registration is labeled 'Register' or 'Create Account'.
    await page.getByRole('button', { name: 'Register' }).click();

    // Optional: Add an assertion here to confirm successful registration.
    // For example, check for a success message, a redirect to a dashboard,
    // or the absence of an error message.
    // await expect(page.url()).not.toContain('/register'); // Expect to navigate away from register page
    // await expect(page.getByText('Registration successful!')).toBeVisible(); // Expect a success message
});