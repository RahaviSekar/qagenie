const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
  const APP_ORIGIN = 'https://dev.ges.store';

  // Step 1: Go to /login
  await page.goto(`${APP_ORIGIN}/login`);
  await page.waitForLoadState('domcontentloaded');

  // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  await page.getByRole('button', { name: /continue|submit/i }).click();
  // Wait for the secure access page to disappear
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

  // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
  await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();

  // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
  await expect(page.getByRole('heading', { name: /find\s+your\s+company/i })).toBeVisible({ timeout: 45000 });
  await page.getByLabel(/company\s+name/i).fill('lamb');
  await page.getByRole('button', { name: /search/i }).click();
  // Wait for search results to appear (up to 2 minutes as specified)
  await expect(page.getByRole('heading', { name: /search\s+results/i })).toBeVisible({ timeout: 120000 });

  // Step 5: scroll down to see the search results and click the select button of the 1st result
  await page.getByRole('button', { name: /^select$/i }).first().click();

  // Step 6: Click Confirm & Create Your Account button
  await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();

  // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
  await page.getByLabel(/first\s*name/i).waitFor({ state: 'visible', timeout: 45000 }); // Wait for the form to load

  const timestamp = Date.now();
  const email = `testuser+${timestamp}@example.com`;

  await page.getByLabel(/first\s*name/i).fill('Playwright');
  await page.getByLabel(/last\s*name/i).fill('Tester');
  await page.getByLabel(/email\s+address/i).fill(email);
  await page.getByLabel(/email\s+confirmation/i).fill(email);
  await page.getByLabel(/phone\s+number/i).fill('5551234567');

  // Step 8: In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
  // Using a password that typically meets common strong password requirements: min 8 chars, uppercase, lowercase, number, special char
  const password = 'P@ssword1';
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm\s+password/i).fill(password);
  
  // Assuming a common "Employee" option, or select the first available if not found
  // Using .waitFor() for the select element ensures it's ready before interaction
  const userTypeSelect = page.getByLabel(/user\s+type/i);
  await userTypeSelect.waitFor({ state: 'visible', timeout: 15000 });
  
  // Try to select by label first, fallback to index if label fails (e.g., "Employee" isn't present)
  try {
    await userTypeSelect.selectOption({ label: 'Employee' });
  } catch (error) {
    console.warn("Could not find 'Employee' user type, attempting to select the first option.");
    await userTypeSelect.selectOption({ index: 1 }); // Select the second option (index 1) to avoid "Select..." or similar default. If not available, index 0 is used.
  }

  await page.getByRole('button', { name: /create\s+account/i }).click();

  // Optionally, add an assertion here to verify successful registration, e.g.,
  // await expect(page.getByRole('heading', { name: /registration\s+success/i })).toBeVisible({ timeout: 15000 });
});

test('POS: Register with a different, specific company search term and a strong password.', async ({ page }) => {
    // Navigate to login and pass the secure access gate
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click on 'Create an Account' hyperlink
    await page.locator('text=/Create an Account/i').click();

    // Find Your Company: Use a more specific search term
    await page.getByLabel(/company name/i).fill('GES Global Exhibitions');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for search results, allowing up to 2 minutes as mentioned
    await page.locator('button', { hasText: /select/i }).first().waitFor({ timeout: 120000 });
    await page.waitForTimeout(2000); // Small pause for UI stability after search results load

    // Scroll down if necessary and click 'Select' for the first result
    await page.locator('button', { hasText: /select/i }).first().click();

    // Click 'Confirm & Create Your Account'
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information fields with unique data
    const timestamp = new Date().getTime();
    const firstName = `John${timestamp}`;
    const lastName = `Doe${timestamp}`;
    const email = `pos.strongpass.${timestamp}@test.com`;

    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('5551110001');

    // Fill Account Information with a strong password that meets requirements
    const strongPassword = 'MySecurePassw0rd!';
    await page.getByLabel(/^password$/i).fill(strongPassword); // Use regex to match exact 'Password' label
    await page.getByLabel(/confirm password/i).fill(strongPassword);
    await page.getByLabel(/user type/i).selectOption('Attendee'); // Select a valid user type

    // Click 'Create Account'
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful progression: Expect to land on a confirmation/dashboard page
    await expect(page.locator('h1', { hasText: /welcome/i }).or(page.locator('text=/Account created successfully/i'))).toBeVisible({ timeout: 60000 });
    await expect(page.url()).not.toContain('/register'); // Ensure we've navigated away from the registration page
});

test('POS: Register with a company search term yielding multiple results, selecting a non-first option.', async ({ page }) => {
    // Navigate to login and pass the secure access gate
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click on 'Create an Account' hyperlink
    await page.locator('text=/Create an Account/i').click();

    // Find Your Company: Use a broader search term likely to yield multiple results
    await page.getByLabel(/company name/i).fill('service');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for at least the second 'Select' button to appear, allowing up to 2 minutes
    await page.locator('button', { hasText: /select/i }).nth(1).waitFor({ timeout: 120000 });
    await page.waitForTimeout(2000); // Small pause for UI stability

    // Scroll down if necessary and click 'Select' for the second search result
    await page.locator('button', { hasText: /select/i }).nth(1).click();

    // Click 'Confirm & Create Your Account'
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information fields with unique data
    const timestamp = new Date().getTime();
    const firstName = `Jane${timestamp}`;
    const lastName = `Smith${timestamp}`;
    const email = `pos.multiselect.${timestamp}@test.com`;

    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('5552220002');

    // Fill Account Information with a valid password
    const validPassword = 'AnotherValidP@ssw0rd2!';
    await page.getByLabel(/^password$/i).fill(validPassword);
    await page.getByLabel(/confirm password/i).fill(validPassword);
    await page.getByLabel(/user type/i).selectOption('Exhibitor'); // Select another valid user type

    // Click 'Create Account'
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful progression: Expect to land on a confirmation/dashboard page
    await expect(page.locator('h1', { hasText: /welcome/i }).or(page.locator('text=/Account created successfully/i'))).toBeVisible({ timeout: 60000 });
    await expect(page.url()).not.toContain('/register');
});

test('POS: Register with a unique, specific company and a minimum-requirement password.', async ({ page }) => {
    // Navigate to login and pass the secure access gate
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click on 'Create an Account' hyperlink
    await page.locator('text=/Create an Account/i').click();

    // Find Your Company: Use another specific search term
    await page.getByLabel(/company name/i).fill('Event Management Solutions');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for search results, allowing up to 2 minutes
    await page.locator('button', { hasText: /select/i }).first().waitFor({ timeout: 120000 });
    await page.waitForTimeout(2000); // Small pause for UI stability

    // Scroll down if necessary and click 'Select' for the first result
    await page.locator('button', { hasText: /select/i }).first().click();

    // Click 'Confirm & Create Your Account'
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information fields with unique data
    const timestamp = new Date().getTime();
    const firstName = `Peter${timestamp}`;
    const lastName = `Jones${timestamp}`;
    const email = `pos.minpass.${timestamp}@test.com`;

    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('5553330003');

    // Fill Account Information with a password that just meets typical requirements (e.g., 8+ chars, upper, lower, num, special)
    const minReqPassword = 'MinP@ss1!';
    await page.getByLabel(/^password$/i).fill(minReqPassword);
    await page.getByLabel(/confirm password/i).fill(minReqPassword);
    await page.getByLabel(/user type/i).selectOption({ index: 0 }); // Select the first option in the dropdown

    // Click 'Create Account'
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful progression: Expect to land on a confirmation/dashboard page
    await expect(page.locator('h1', { hasText: /welcome/i }).or(page.locator('text=/Account created successfully/i'))).toBeVisible({ timeout: 60000 });
    await expect(page.url()).not.toContain('/register');
});

test('NEG: Incorrect Secure Access Password', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
    await page.fill('input[name="password"]', 'incorrectpassword123');
    await page.click('button:has-text("Continue")');
    // Expect an error message related to incorrect password
    await expect(page.locator('.alert-danger, .error-message, [aria-live="assertive"]:has-text("Incorrect password")')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/login/, { timeout: 5000 }); // Should stay on login page
});

test('NEG: Mismatched Email Confirmation', async ({ page }) => {
    // Secure Access
    await page.goto('https://dev.ges.store/login');
    await page.fill('input[name="password"]', 'FiP93&@1U94L');
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/register|account-create|company-search/, { timeout: 45000 }); // Wait for navigation after secure access

    // Create Account flow
    await page.click('a:has-text("Create an Account")');
    await page.waitForURL(/company/, { timeout: 15000 });

    // Find Your Company
    await page.fill('input[name="companyName"]', 'lamb');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('text=Search Results', { timeout: 30000 }); // Wait for results to appear
    await page.locator('button:has-text("Select")').first().click();

    // Confirm & Create Your Account
    await page.click('button:has-text("Confirm & Create Your Account")');
    await page.waitForURL(/personal-info|account-info/, { timeout: 15000 });

    // Fill Personal Information - with mismatched emails
    await page.fill('input[name="firstName"]', 'TestFN');
    await page.fill('input[name="lastName"]', 'TestLN');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="emailConfirmation"]', 'mismatch@example.com'); // Mismatched email
    await page.fill('input[name="phoneNumber"]', '1234567890');

    // Fill Account Information (valid for other fields)
    const strongPassword = 'StrongP@ss123!'; // Needs to meet requirements
    await page.fill('input[name="password"]', strongPassword);
    await page.fill('input[name="confirmPassword"]', strongPassword);
    await page.selectOption('select[name="userType"]', { label: 'Individual' }); // Assuming an 'Individual' option exists

    // Attempt to click Create Account and expect validation error
    await expect(page.locator('input[name="emailConfirmation"] + .error-message, input[name="emailConfirmation"][aria-invalid="true"]')).toBeVisible({ timeout: 15000 });
    const createAccountButton = page.locator('button:has-text("Create Account")');
    await expect(createAccountButton).toBeDisabled({ timeout: 5000 });
});

test('NEG: Weak Account Password', async ({ page }) => {
    // Secure Access
    await page.goto('https://dev.ges.store/login');
    await page.fill('input[name="password"]', 'FiP93&@1U94L');
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/register|account-create|company-search/, { timeout: 45000 });

    // Create Account flow
    await page.click('a:has-text("Create an Account")');
    await page.waitForURL(/company/, { timeout: 15000 });

    // Find Your Company
    await page.fill('input[name="companyName"]', 'lamb');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('text=Search Results', { timeout: 30000 });
    await page.locator('button:has-text("Select")').first().click();

    // Confirm & Create Your Account
    await page.click('button:has-text("Confirm & Create Your Account")');
    await page.waitForURL(/personal-info|account-info/, { timeout: 15000 });

    // Fill Personal Information
    await page.fill('input[name="firstName"]', 'WeakPassFN');
    await page.fill('input[name="lastName"]', 'WeakPassLN');
    await page.fill('input[name="email"]', 'weakpass@example.com');
    await page.fill('input[name="emailConfirmation"]', 'weakpass@example.com');
    await page.fill('input[name="phoneNumber"]', '0987654321');

    // Fill Account Information - with weak password
    const weakPassword = 'pass'; // Assume this fails requirements (e.g., length, special char, uppercase)
    await page.fill('input[name="password"]', weakPassword);
    await page.fill('input[name="confirmPassword"]', weakPassword); // Confirm with the same weak password
    await page.selectOption('select[name="userType"]', { label: 'Individual' });

    // Expect validation message for password field
    await expect(page.locator('input[name="password"] + .error-message, input[name="password"][aria-invalid="true"]')).toBeVisible({ timeout: 15000 });
    const createAccountButton = page.locator('button:has-text("Create Account")');
    await expect(createAccountButton).toBeDisabled({ timeout: 5000 });
});

test('NEG: Mismatched Account Password Confirmation', async ({ page }) => {
    // Secure Access
    await page.goto('https://dev.ges.store/login');
    await page.fill('input[name="password"]', 'FiP93&@1U94L');
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/register|account-create|company-search/, { timeout: 45000 });

    // Create Account flow
    await page.click('a:has-text("Create an Account")');
    await page.waitForURL(/company/, { timeout: 15000 });

    // Find Your Company
    await page.fill('input[name="companyName"]', 'lamb');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('text=Search Results', { timeout: 30000 });
    await page.locator('button:has-text("Select")').first().click();

    // Confirm & Create Your Account
    await page.click('button:has-text("Confirm & Create Your Account")');
    await page.waitForURL(/personal-info|account-info/, { timeout: 15000 });

    // Fill Personal Information
    await page.fill('input[name="firstName"]', 'PassMismatchFN');
    await page.fill('input[name="lastName"]', 'PassMismatchLN');
    await page.fill('input[name="email"]', 'passmismatch@example.com');
    await page.fill('input[name="emailConfirmation"]', 'passmismatch@example.com');
    await page.fill('input[name="phoneNumber"]', '1122334455');

    // Fill Account Information - with mismatched passwords
    await page.fill('input[name="password"]', 'StrongP@ss1!');
    await page.fill('input[name="confirmPassword"]', 'StrongP@ss2!'); // Mismatched
    await page.selectOption('select[name="userType"]', { label: 'Individual' });

    // Expect validation message for confirm password field
    await expect(page.locator('input[name="confirmPassword"] + .error-message, input[name="confirmPassword"][aria-invalid="true"]')).toBeVisible({ timeout: 15000 });
    const createAccountButton = page.locator('button:has-text("Create Account")');
    await expect(createAccountButton).toBeDisabled({ timeout: 5000 });
});

test('NEG: Skip Company Selection', async ({ page }) => {
    // Secure Access
    await page.goto('https://dev.ges.store/login');
    await page.fill('input[name="password"]', 'FiP93&@1U94L');
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/register|account-create|company-search/, { timeout: 45000 });

    // Create Account flow
    await page.click('a:has-text("Create an Account")');
    await page.waitForURL(/company/, { timeout: 15000 });

    // Find Your Company
    await page.fill('input[name="companyName"]', 'lamb');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('text=Search Results', { timeout: 30000 });
    // IMPORTANT: DO NOT click 'Select' on any company

    // Attempt to click 'Confirm & Create Your Account'
    const confirmButton = page.locator('button:has-text("Confirm & Create Your Account")');
    // Expect the button to be disabled as no company was selected
    await expect(confirmButton).toBeDisabled({ timeout: 15000 });
    await expect(page).toHaveURL(/company/, { timeout: 5000 }); // Should stay on the company search page
});
