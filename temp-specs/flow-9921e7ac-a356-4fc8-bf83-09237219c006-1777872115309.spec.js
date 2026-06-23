import { test, expect } from '@playwright/test';

test('Register flow', async ({ page }) => {
  // 1. Go to /login
  await page.goto('https://example.com/login');
  // Wait for the URL to be stable after navigation
  await page.waitForURL('https://example.com/login');

  // 2. Click "Create Account"
  // Assuming 'Create Account' is a link on the login page
  await page.getByRole('link', { name: 'Create Account' }).click();
  // Wait for navigation to the registration page, assuming /register
  await page.waitForURL('https://example.com/register');

  // 3. Search for "lamb" in the "Search company" field
  // Assuming the search field has a placeholder 'Search company'
  const companySearchField = page.getByPlaceholder('Search company');
  await companySearchField.fill('lamb');

  // 4. Select the 3rd result
  // Playwright's auto-waiting handles waiting for results to appear.
  // This locator assumes search results are semantically list items.
  // .nth(2) targets the third item (0-indexed).
  await page.getByRole('listitem').nth(2).click({ timeout: 10000 }); // Increased timeout as search results might take longer to load and become interactive

  // 5. Create an account with valid username, email, and password
  const uniqueId = Date.now(); // Generate a unique ID for the user
  await page.getByLabel('Username').fill(`testuser_${uniqueId}`);
  await page.getByLabel('Email').fill(`testuser_${uniqueId}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill('StrongP@ssword123!'); // Using `exact: true` for label to differentiate from "Confirm Password"
  await page.getByLabel('Confirm Password').fill('StrongP@ssword123!');

  // Click the 'Register' or 'Sign Up' button
  await page.getByRole('button', { name: 'Register' }).click();

  // Optional: Add an assertion for successful registration
  // For example, wait for navigation to a dashboard page or a success message to appear.
  // This line is commented out as the exact success state is unknown without more app details,
  // but it's crucial for a complete and robust test.
  // await page.waitForURL('https://example.com/dashboard', { timeout: 15000 });
  // await expect(page.getByText('Account created successfully!')).toBeVisible();
});