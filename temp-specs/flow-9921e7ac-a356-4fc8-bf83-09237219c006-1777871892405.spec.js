import { test, expect } from '@playwright/test';

test('Register flow', async ({ page }) => {
  // 1. Go to /login
  await page.goto('https://example.com/login');

  // 2. click create account
  // Assuming 'Create an account' is a link that navigates to the registration page.
  await page.getByRole('link', { name: 'Create an account' }).click();

  // 3. search lamb in search company field
  // Assuming there's an input field with the placeholder text 'Search company'.
  await page.getByPlaceholder('Search company').fill('lamb');

  // 4. select the 3rd result
  // Wait for the search results to appear and for the 3rd item (index 2) to be visible.
  // Assuming results are presented as list items.
  await expect(page.getByRole('listitem').nth(2)).toBeVisible({ timeout: 10000 });
  await page.getByRole('listitem').nth(2).click();

  // 5. create an account with valid username password
  // Assuming input fields are labeled 'Username' and 'Password'.
  await page.getByLabel('Username').fill('testuser');
  // Using { exact: true } for the Password label to ensure we target only the password field,
  // avoiding potential conflicts with a 'Confirm Password' field if it exists.
  await page.getByLabel('Password', { exact: true }).fill('Password123!');

  // Assuming a button with the text 'Create Account' is used to submit the form.
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Optional: Add an assertion here to verify successful registration, e.g.:
  // await expect(page.getByText('Registration successful!')).toBeVisible();
});