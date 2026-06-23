const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
  // 1. Go to /login
  await page.goto('https://example.com/login');

  // 2. Click 'Create Account'
  // Assuming 'Create Account' is a link or button on the login page.
  await page.getByRole('link', { name: 'Create Account' }).click();

  // 3. Search 'lamb' in the 'Search company' field
  // Assuming an input field with a placeholder 'Search company'.
  // Playwright's auto-waiting will wait for the element to be visible and enabled.
  await page.getByPlaceholder('Search company').fill('lamb');

  // 4. Select the 3rd result
  // Assuming the search results appear as list items that are clickable.
  // Using .nth(2) for the 3rd item (0-indexed).
  // Playwright will automatically wait for the element to appear and be actionable.
  await page.getByRole('listitem').nth(2).click();

  // 5. Create an account with valid username and password
  // Assuming a registration form with labels for 'Username', 'Email', 'Password', and 'Confirm Password'.
  await page.getByLabel('Username').fill('testuser_pw');
  await page.getByLabel('Email').fill('testuser_pw@example.com');
  // Using { exact: true } for 'Password' to differentiate from 'Confirm Password' if labels are similar.
  await page.getByLabel('Password', { exact: true }).fill('SecurePa$$w0rd123!');
  await page.getByLabel('Confirm Password').fill('SecurePa$$w0rd123!');

  // Click the 'Register' button to submit the form.
  await page.getByRole('button', { name: 'Register' }).click();

  // Optional: Add an assertion to verify successful registration.
  // For example, check for a success message or redirection to a dashboard.
  // await expect(page.getByText('Registration successful')).toBeVisible();
  // Or check the URL after successful registration.
  // await expect(page).toHaveURL('https://example.com/dashboard', { timeout: 10000 });
});