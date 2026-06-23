import { test, expect } from '@playwright/test';

test('User can register for a new account', async ({ page }) => {
    const baseURL = 'https://dev.ges.store';
    const username = `testuser_${Date.now()}`; // Generate a unique username
    const password = 'Password123!'; // Example valid password

    // 1. Go to /login
    await page.goto(`${baseURL}/login`, { timeout: 60000 });

    // 2. Click 'Create Account'
    await page.getByRole('link', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(`${baseURL}/register`); // Verify navigation to the registration page

    // 3. Search 'lamb' in the search company field
    const companySearchField = page.getByPlaceholder('Search company...');
    await expect(companySearchField).toBeVisible({ timeout: 10000 }); // Ensure field is visible
    await companySearchField.fill('lamb');

    // Wait for search results to appear.
    // This locator attempts to be resilient by looking for common patterns of autocomplete options.
    // In a real application, you'd inspect the DOM to find the most specific and stable locator.
    const companyResultLocator = page.locator('div[role="option"], li[role="option"], div.company-search-result');
    await companyResultLocator.nth(2).waitFor({ state: 'visible', timeout: 15000 }); // Wait for the 3rd result to be visible

    // 4. Select the 3rd result
    await companyResultLocator.nth(2).click();

    // Optional: Add an assertion to confirm the company was selected, e.g.,
    // if a selected company name appears on the page.
    // await expect(page.getByText('LAMB WESTON HOLDINGS INC', { exact: true })).toBeVisible();

    // 5. Create an account with valid username and password
    await page.getByLabel('Email address').fill(username + '@example.com');
    await page.getByLabel('Password', { exact: true }).fill(password); // Using exact: true to differentiate from "Confirm Password"
    await page.getByLabel('Confirm Password').fill(password);

    // If there's a 'terms and conditions' checkbox, uncomment and adjust locator:
    // await page.getByRole('checkbox', { name: 'I agree to the terms and conditions' }).click();

    await page.getByRole('button', { name: 'Register' }).click();

    // Verify successful registration by checking for redirection to a dashboard or a success message.
    // Adjust the URL or text to match the actual post-registration behavior.
    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 20000 }); // Example: redirects to dashboard
    // Alternatively, if a success message appears:
    // await expect(page.getByText('Account created successfully!')).toBeVisible({ timeout: 10000 });
});