
/** QA Genie — registration form helpers (labels match dev.ges.store: "Password *", "Confirm Password *") */
async function fillAccountPasswords(page, password) {
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/^confirm\s*password/i).fill(password);
}
async function fillPersonalInfo(page, data) {
  if (data.firstName) await page.getByLabel(/^first\s*name/i).fill(data.firstName);
  if (data.lastName) await page.getByLabel(/^last\s*name/i).fill(data.lastName);
  if (data.email) {
    await page.getByLabel(/^email\s*address$/i).fill(data.email);
    await page.getByLabel(/^email\s*confirmation/i).fill(data.email);
  }
  if (data.phone) await page.getByLabel(/^phone/i).fill(data.phone);
}

const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
  // Step 1: Go to /login
  await page.goto('https://dev.ges.store/login');
  await page.waitForLoadState('domcontentloaded');

  // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

  // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
  await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();

  // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
  await expect(page.getByLabel(/company\s+name/i)).toBeVisible({ timeout: 45000 });
  await page.getByLabel(/company\s+name/i).fill('lamb');
  await page.getByRole('button', { name: /search/i }).click();
  await expect(page.getByRole('heading', { name: /search\s+results/i })).toBeVisible({ timeout: 120000 });

  // Step 5: scroll down to see the search results and click the select button of the 1st result
  await page.getByRole('button', { name: /^select$/i }).nth(0).click();

  // Step 6: Click Confirm & Create Your Account button
  await page.getByRole('button', { name: /confirm\s*&\s*create\s+your\s+account/i }).click();

  // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
  await expect(page.getByLabel(/^first name/i)).toBeVisible({ timeout: 45000 });
  await page.getByLabel(/^first name/i).fill('John');
  await page.getByLabel(/^last name/i).fill('Doe');
  await page.getByLabel(/^email address$/i).fill('john.doe@example.com');
  await page.getByLabel(/^email confirmation/i).fill('john.doe@example.com');
  await page.getByLabel(/^phone/i).fill('1234567890');

  // Step 8: In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
  await fillAccountPasswords(page, "Abc!123456789");
  await page.getByLabel(/^confirm\s*password/i).fill('Abc!123456789');
  await page.getByLabel(/user\s+type/i).selectOption('Exhibitor');
  await page.getByRole('button', { name: /create\s+account/i }).click();

  // Optional: Add an assertion to check if the user is successfully logged in or redirected to the dashboard
  await expect(page).toHaveURL(/.*dashboard/); // Assuming a dashboard URL after successful registration
});