import { test, expect } from '@playwright/test';

test('Register flow', async ({ page }) => {
  // Go to /login
  await page.goto('https://example.com/login');

  // click create account
  // Assuming a link leads to the registration form/page
  await page.getByRole('link', { name: 'Create account' }).click();

  // search lamb in search company field
  // Assuming a placeholder text for the company search input
  await page.getByPlaceholder('Search company').fill('lamb');

  // Wait for the search results to appear.
  // Assuming results are presented as elements with role 'option' within a listbox.
  // We wait for the first option to be visible before attempting to click the third.
  await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 5000 });

  // select the 3rd result (Playwright locators are 0-indexed, so nth(2) for the 3rd item)
  await page.getByRole('option').nth(2).click();

  // create an account with valid username password
  // Using getByLabel for robust selection of form input fields
  await page.getByLabel('Username').fill('testuser_pw');
  await page.getByLabel('Password').fill('SecurePass123!');

  // Click the register button
  // Assuming a button with the text 'Register' is used to submit the form
  await page.getByRole('button', { name: 'Register' }).click();

  // Optional: Add an assertion here to verify successful registration,
  // e.g., checking for a success message or navigation to a dashboard.
  // await expect(page.getByText('Account created successfully')).toBeVisible();
  // await expect(page).toHaveURL('https://example.com/dashboard');
});