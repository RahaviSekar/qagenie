
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

const BASE_URL = 'https://dev.ges.store';
const SECURE_ACCESS_PASSWORD = 'FiP93&@1U94L';
const COMPANY_SEARCH_TERM = 'lamb';
// Password must meet requirements: at least 8 chars with letter, number, special
const REGISTRATION_PASSWORD = 'Abc!123456789';

test("Register — happy path", async ({ page }) => {
  // Step 1: Go to /login
  await page.goto(BASE_URL + '/login');
  await page.waitForLoadState('domcontentloaded');

  // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="password"]').first().fill(SECURE_ACCESS_PASSWORD);
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

  // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
  await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();

  // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
  await page.getByLabel(/company\s*name/i).waitFor({ state: 'visible', timeout: 45000 });
  await page.getByLabel(/company\s*name/i).fill(COMPANY_SEARCH_TERM);
  await page.getByRole('button', { name: /search/i }).click();
  await expect(page.getByRole('heading', { name: /search\s+results/i })).toBeVisible({ timeout: 120000 }); // Wait up to 2 minutes

  // Step 5: scroll down to see the search results and click the select button of the 1st result
  await page.getByRole('heading', { name: /search\s+results/i }).scrollIntoViewIfNeeded(); // Ensure results are visible if page is long
  await page.getByRole('button', { name: /^select$/i }).first().click();

  // Step 6: Click Confirm & Create Your Account button
  await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();

  // Wait for the registration form to load, using the first field as an indicator
  await page.getByLabel(/^first name/i).waitFor({ state: 'visible', timeout: 45000 });

  // Generate a unique email address
  const timestamp = Date.now();
  const email = `testuser+${timestamp}@example.com`;

  // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
  await page.getByLabel(/^first name/i).fill('Playwright');
  await page.getByLabel(/^last name/i).fill('Testuser');
  await page.getByLabel(/^email address$/i).fill(email);
  await page.getByLabel(/^email confirmation/i).fill(email);
  await page.getByLabel(/^phone number/i).fill('1234567890');

  // Step 8: In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
  await fillAccountPasswords(page, "Abc!123456789");
  await page.getByLabel(/^confirm\s*password/i).fill(REGISTRATION_PASSWORD);

  // Assuming 'User Type' is a select element as per common UI patterns and hints.
  // We'll select 'Exhibitor' as an example.
  await page.getByLabel(/user type/i).selectOption({ label: 'Exhibitor' });

  await page.getByRole('button', { name: /create\s+account/i }).click();

  // Optional: Add an assertion here to verify successful registration, e.g.,
  // await expect(page.getByText(/your account has been created/i)).toBeVisible();
});

test('POS: Register with an alternate, longer company search term', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test.user.longsearch+${timestamp}@example.com`;
    const password = `LongTermP@ss${timestamp}`; // Password meets requirements: 8+ chars, letter, number, special

    await page.goto('https://dev.ges.store/login');

    // Secure Access Gate
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click Create an Account
    await page.getByRole('link', { name: /create an account/i }).click();

    // Find Your Company page - Longer, alternate search term
    await page.getByLabel(/company name/i).fill('global exhibition services');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for the search results to appear, specifically the first select button
    await page.getByRole('button', { name: /select/i }).first().waitFor({ timeout: 120000 });
    await page.getByRole('button', { name: /select/i }).first().click(); // Select the first result

    // Click Confirm & Create Your Account
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information
    await page.getByLabel(/^first name/i).fill('Alexander');
    await page.getByLabel(/^last name/i).fill('Longsearch');
    await page.getByLabel(/^email address$/i).fill(email);
    await page.getByLabel(/^email confirmation/i).fill(email);
    await page.getByLabel(/^phone/i).fill('987-654-3210');

    // Fill Account Information
    await fillAccountPasswords(page, "Abc!123456789");
    await page.getByLabel(/^confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption({ label: 'Exhibitor' }); // Example: Select Exhibitor

    // Click Create Account
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful progression (e.g., redirection to a dashboard or success page)
    await expect(page).toHaveURL(/.*(dashboard|success|account-created)/i, { timeout: 30000 });
});

test('POS: Register with a different valid user type (3rd Party/EAC)', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test.user.thirdparty+${timestamp}@example.com`;
    const password = `ThirdP@rtyP@ss${timestamp}`; // Password meets requirements

    await page.goto('https://dev.ges.store/login');

    // Secure Access Gate
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click Create an Account
    await page.getByRole('link', { name: /create an account/i }).click();

    // Find Your Company page - Original search term
    await page.getByLabel(/company name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for the search results to appear
    await page.getByRole('button', { name: /select/i }).first().waitFor({ timeout: 120000 });
    await page.getByRole('button', { name: /select/i }).first().click(); // Select the first result

    // Click Confirm & Create Your Account
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information
    await page.getByLabel(/^first name/i).fill('Bartholomew');
    await page.getByLabel(/^last name/i).fill('Thirdparty');
    await page.getByLabel(/^email address$/i).fill(email);
    await page.getByLabel(/^email confirmation/i).fill(email);
    await page.getByLabel(/^phone/i).fill('111-222-3333');

    // Fill Account Information - Select "3rd Party/EAC" user type
    await fillAccountPasswords(page, "Abc!123456789");
    await page.getByLabel(/^confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption({ label: '3rd Party/EAC' }); // Select 3rd Party/EAC

    // Click Create Account
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful progression
    await expect(page).toHaveURL(/.*(dashboard|success|account-created)/i, { timeout: 30000 });
});

test('POS: Register with a company name searched with mixed case', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test.user.mixedcase+${timestamp}@example.com`;
    const password = `MixedC@seP@ss${timestamp}`; // Password meets requirements

    await page.goto('https://dev.ges.store/login');

    // Secure Access Gate
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click Create an Account
    await page.getByRole('link', { name: /create an account/i }).click();

    // Find Your Company page - Mixed case search term
    await page.getByLabel(/company name/i).fill('Lamb'); // Using mixed case for search
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for the search results to appear
    await page.getByRole('button', { name: /select/i }).first().waitFor({ timeout: 120000 });
    await page.getByRole('button', { name: /select/i }).first().click(); // Select the first result

    // Click Confirm & Create Your Account
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information
    await page.getByLabel(/^first name/i).fill('Charlotte');
    await page.getByLabel(/^last name/i).fill('Mixedcase');
    await page.getByLabel(/^email address$/i).fill(email);
    await page.getByLabel(/^email confirmation/i).fill(email);
    await page.getByLabel(/^phone/i).fill('555-444-1234');

    // Fill Account Information
    await fillAccountPasswords(page, "Abc!123456789");
    await page.getByLabel(/^confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption({ label: 'Exhibitor' }); // Example: Select Exhibitor

    // Click Create Account
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful progression
    await expect(page).toHaveURL(/.*(dashboard|success|account-created)/i, { timeout: 30000 });
});

test('NEG: Incorrect Secure Access Password on login', async ({ page }) => {
  await page.goto('https://dev.ges.store/login');
  await page.locator('input[type="password"]').first().fill('wrongPassword123');
  await page.getByRole('button', { name: /continue/i }).click();

  // Expect to remain on the login page or see an error message
  // Assuming an error message will appear for incorrect password.
  await expect(page.getByText(/incorrect password|invalid password/i)).toBeVisible({ timeout: 15000 });
  await expect(page.url()).toBe('https://dev.ges.store/login', { timeout: 5000 });
});

test('NEG: Mismatched Account Passwords during registration', async ({ page }) => {
  await page.goto('https://dev.ges.store/login');
  await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  await page.getByRole('button', { name: /continue/i }).click();

  await page.getByRole('link', { name: /create an account/i }).click();
  await expect(page).toHaveURL('https://dev.ges.store/create-account/find-company', { timeout: 15000 });

  await page.getByLabel(/company name/i).fill('lamb');
  await page.getByRole('button', { name: /search/i }).click();
  await page.locator('button:has-text("Select")').first().waitFor({ state: 'visible', timeout: 120000 });
  await page.locator('button:has-text("Select")').first().click();

  await page.getByRole('button', { name: /confirm & create your account/i }).click();
  await expect(page).toHaveURL('https://dev.ges.store/create-account/register', { timeout: 15000 });

  // Fill Personal Information
  await page.getByLabel(/^first name/i).fill('Test');
  await page.getByLabel(/^last name/i).fill('User');
  await page.getByLabel(/^email address$/i).fill('test.user@ges.com');
  await page.getByLabel(/^email confirmation/i).fill('test.user@ges.com');
  await page.getByLabel(/^phone/i).fill('5551234567');

  // Fill Account Information with mismatched passwords
  await fillAccountPasswords(page, "Abc!123456789");
  await page.getByLabel(/^confirm password/i).fill('Abc!987654321'); // Mismatched
  await page.getByLabel(/user type/i).selectOption({ label: 'Exhibitor' });

  await page.getByRole('button', { name: /create account/i }).click();

  // Expect a validation message indicating passwords do not match
  await expect(page.getByText(/passwords do not match|password confirmation does not match/i)).toBeVisible({ timeout: 15000 });
  // Ensure the page does not advance to a success state
  await expect(page.url()).not.toContain('/success', { timeout: 5000 });
});

test('NEG: Invalid Email Format during registration', async ({ page }) => {
  await page.goto('https://dev.ges.store/login');
  await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  await page.getByRole('button', { name: /continue/i }).click();

  await page.getByRole('link', { name: /create an account/i }).click();
  await expect(page).toHaveURL('https://dev.ges.store/create-account/find-company', { timeout: 15000 });

  await page.getByLabel(/company name/i).fill('lamb');
  await page.getByRole('button', { name: /search/i }).click();
  await page.locator('button:has-text("Select")').first().waitFor({ state: 'visible', timeout: 120000 });
  await page.locator('button:has-text("Select")').first().click();

  await page.getByRole('button', { name: /confirm & create your account/i }).click();
  await expect(page).toHaveURL('https://dev.ges.store/create-account/register', { timeout: 15000 });

  // Fill Personal Information with invalid email format
  await page.getByLabel(/^first name/i).fill('Test');
  await page.getByLabel(/^last name/i).fill('User');
  await page.getByLabel(/^email address$/i).fill('invalid-email-format'); // Invalid email
  await page.getByLabel(/^email confirmation/i).fill('invalid-email-format'); // Invalid email
  await page.getByLabel(/^phone/i).fill('5551234567');

  // Fill Account Information with valid data to isolate email error
  await fillAccountPasswords(page, "Abc!123456789");
  await page.getByLabel(/^confirm password/i).fill('Abc!123456789');
  await page.getByLabel(/user type/i).selectOption({ label: 'Exhibitor' });

  await page.getByRole('button', { name: /create account/i }).click();

  // Expect a validation message for invalid email format
  await expect(page.getByText(/please enter a valid email address|invalid email format/i)).toBeVisible({ timeout: 15000 });
  // Ensure the page does not advance to a success state
  await expect(page.url()).not.toContain('/success', { timeout: 5000 });
});