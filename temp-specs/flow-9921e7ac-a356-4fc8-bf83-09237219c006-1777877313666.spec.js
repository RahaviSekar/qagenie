const { test, expect } = require('@playwright/test');

test('Register flow', async ({ page }) => {
  const origin = 'https://dev.ges.store';

  // Step 1: Go to /login
  await page.goto(`${origin}/login`);
  await page.waitForLoadState('domcontentloaded');

  // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  await page.getByRole('button', { name: /continue|submit/i }).click();
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

  // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
  await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();

  // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
  await page.getByLabel(/company\s*name/i).fill('lamb');
  await page.getByRole('button', { name: /search/i }).click();

  // Step 5: scroll down to see the search results and click the select button of the 1st result
  // Using a long timeout for the search results heading to account for the "upto 2 mins" wait.
  await expect(page.getByRole('heading', { name: /search\s+results/i })).toBeVisible({ timeout: 120000 });
  await page.getByRole('button', { name: /^select$/i }).nth(0).click({ timeout: 45000 });

  // Step 6: Click Confirm & Create Your Account button
  await page.getByRole('button', { name: /confirm\s*&\s*create\s*your\s*account/i }).click();

  // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
  // Wait for the first field of the Personal Information section to be visible.
  await page.getByLabel(/first\s*name|given\s*name/i).waitFor({ state: 'visible', timeout: 45000 });
  await page.getByLabel(/first\s*name|given\s*name/i).fill('Test');
  await page.getByLabel(/last\s*name|family\s*name/i).fill('User');
  const timestamp = new Date().getTime();
  const email = `testuser+${timestamp}@example.com`; // Using a unique email to prevent conflicts
  await page.getByLabel(/email\s*address/i).fill(email);
  await page.getByLabel(/email\s*confirmation/i).fill(email);
  await page.getByLabel(/phone\s*number/i).fill('1234567890');

  // Step 8: In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
  const password = 'Password123!'; // Example password meeting typical strong requirements
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByLabel(/confirm\s*password/i).fill(password);

  // Attempt to select 'user type'. Assuming it's a combobox (dropdown).
  // If no specific user type is mentioned, selecting the first non-placeholder option (index: 1) is a common practice.
  const userTypeSelector = page.getByRole('combobox', { name: /user\s*type/i });
  if (await userTypeSelector.isVisible()) {
    await userTypeSelector.selectOption({ index: 1 });
  } else {
    // If 'Select user type' is not a combobox or not found, a warning is logged.
    // For a real test, this would indicate a need to refine the locator based on the actual UI (e.g., radio buttons, custom select).
    console.warn("User type combobox not found or not visible. Skipping selection.");
  }

  await page.getByRole('button', { name: /create\s+account/i }).click();

  // Optional: Add an assertion here to verify successful account creation or redirect to a success page.
  // Example: await expect(page.getByText(/account created successfully|welcome/i)).toBeVisible();
});