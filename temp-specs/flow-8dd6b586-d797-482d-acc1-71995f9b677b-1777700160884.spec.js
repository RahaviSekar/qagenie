import { test, expect } from '@playwright/test';

test('Register flow', async ({ page }) => {
  const baseURL = 'https://dev.ges.store';

  // Generate unique credentials
  const uniqueEmail = `testuser+${Date.now()}@example.com`;
  const password = 'SecurePassword123!';
  const firstName = 'John';
  const lastName = 'Doe';

  // 1. Go to /login
  await page.goto(`${baseURL}/login`);

  // 2. Click create account
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Ensure we are on the registration page or form is visible
  await expect(page).toHaveURL(`${baseURL}/register`);

  // 3. Search "lamb" in search company field
  const companySearchField = page.getByPlaceholder('Search company');
  await companySearchField.fill('lamb');

  // 4. Select the 3rd result
  // Wait for the results to appear and then click the 3rd option
  // Assuming search results appear as elements with role 'option' and contain 'Lamb'
  const thirdCompanyResult = page.getByRole('option', { name: /Lamb/i }).nth(2);
  await thirdCompanyResult.waitFor({ state: 'visible', timeout: 10000 }); // Explicit timeout for result visibility
  await thirdCompanyResult.click();

  // 5. Create an account with valid username password
  // Fill registration form fields
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password', { exact: true }).fill(password); // Using exact: true for clarity if there are multiple password labels
  await page.getByLabel('Confirm Password').fill(password);

  // Click the Register button to submit the form
  await page.getByRole('button', { name: 'Register' }).click();

  // Assert successful registration - assuming it redirects to a dashboard or displays a success message
  // For example, checking for a specific URL or text on the page
  await expect(page).toHaveURL(`${baseURL}/dashboard`, { timeout: 15000 }); // Expect redirection to dashboard within 15 seconds
  await expect(page.getByText(`Welcome, ${firstName}!`)).toBeVisible(); // Or check for a welcome message
});