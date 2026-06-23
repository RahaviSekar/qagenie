import { test, expect } from '@playwright/test';

test('User can register for a new account', async ({ page }) => {
  const baseURL = 'https://dev.ges.store';

  // Generate unique credentials for each test run
  const uniqueId = Date.now();
  const username = `testuser_${uniqueId}@example.com`;
  const password = `Password${uniqueId}!`;
  const firstName = 'Test';
  const lastName = 'User';

  // 1. Go to /login
  await page.goto(`${baseURL}/login`);

  // 2. click create account
  // Assuming 'Create an account' is a link on the login page.
  await page.getByRole('link', { name: 'Create an account' }).click();

  // Wait for the URL to change to the registration page, ensuring navigation is complete
  await page.waitForURL(`${baseURL}/register`, { timeout: 10000 });

  // 3. search lamb in search company field
  // Assuming the company search field has a placeholder 'Search company...'
  const companySearchInput = page.getByPlaceholder('Search company...');
  await companySearchInput.fill('lamb');

  // Wait for search results to appear. Assuming results are displayed as interactive options.
  // This locator targets generic `div` elements with `role="option"`, a common pattern for autocomplete suggestions.
  // Adjust this locator if the actual DOM uses `li` elements, or a specific class (e.g., '.search-result-item').
  const searchResultOptions = page.locator('div[role="option"]');

  // Wait for at least one search result to become visible
  await searchResultOptions.first().waitFor({ state: 'visible', timeout: 5000 });

  // 4. select the 3rd result (Playwright's nth is 0-indexed, so nth(2) for the 3rd item)
  await searchResultOptions.nth(2).click();

  // 5. create an account with valid username password
  // Fill in the personal details and credentials
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByLabel('Email').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password); // Use exact to differentiate from 'Confirm Password'
  await page.getByLabel('Confirm Password').fill(password);

  // Click the Register button to submit the form
  await page.getByRole('button', { name: 'Register' }).click();

  // Optional: Add an assertion to verify successful registration.
  // This example waits for the URL to change away from the registration page,
  // which is a common indicator of successful form submission and redirection.
  await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });
  // You might also assert for a success message on the page:
  // await expect(page.getByText('Account created successfully!')).toBeVisible({ timeout: 10000 });
});