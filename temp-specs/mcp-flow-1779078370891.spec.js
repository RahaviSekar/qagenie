const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
  // Step 1: Go to /login
  await page.goto('https://dev.ges.store/login');
  await page.waitForLoadState('domcontentloaded');

  // Step 2: Enter Secure Access password and click continue button
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  await page.getByRole('button', { name: /continue|submit/i }).click();
  await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

  // Step 3: Click Create an Account hyperlink
  await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();
  await page.waitForLoadState('domcontentloaded');

  // Step 4: Type 'lamb' in Company Name field and click Search Button (wait up to 2 mins)
  await page.getByLabel(/company\s*name/i).fill('lamb');
  await page.getByRole('button', { name: /search/i }).click();
  // Waiting for search results to appear, with a long timeout as specified
  await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible({ timeout: 120000 });

  // Step 5: Scroll down to see the search results and click the select button of the 1st result
  // Assuming "scroll down" implies the element will become visible/interactive
  await page.getByRole('button', { name: /^select$/i }).nth(0).click();

  // Step 6: Click Confirm & Create Your Account button
  await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();
  await page.waitForLoadState('domcontentloaded');

  // Step 7: Fill Personal Information, Account Information, and click Create Account button
  // Wait for the first personal information field to be visible with a generous timeout
  await page.getByLabel(/first\s*name|given\s*name/i).waitFor({ state: 'visible', timeout: 45000 });

  // Personal Information
  await page.getByLabel(/first\s*name|given\s*name/i).fill('John');
  await page.getByLabel(/last\s*name|family\s*name/i).fill('Doe');
  await page.getByLabel(/email\s*address/i).fill('john.doe@example.com');
  await page.getByLabel(/email\s*confirmation/i).fill('john.doe@example.com');
  await page.getByLabel(/phone\s*number/i).fill('555-123-4567');

  // Account Information
  // Using a strong password based on common requirements
  await page.getByLabel(/^password$/i).fill('Abc!123456789');
  await page.getByLabel(/confirm\s*password/i).fill('Abc!123456789');

  // Select user type (assuming a dropdown or similar with 'Customer' as an option, or selecting the first available)
  // If 'Customer' isn't an option, or it's a radio group, this would need adjustment.
  // For robustness, if exact value is unknown, index could be used: .selectOption({ index: 1 })
  await page.getByLabel(/user\s*type/i).selectOption('Customer'); // Or try { index: 1 } if 'Customer' is not available

  await page.getByRole('button', { name: /create\s*account/i }).click();

  // Optional: Add an assertion here to confirm successful registration,
  // e.g., checking for a success message or redirection to a dashboard.
  // await expect(page.getByText(/account created successfully/i)).toBeVisible();
});

test('POS: Register with alternate company search and all optional fields', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');

    // 2. Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.locator('button', { hasText: /Continue/i }).click();

    // 3. Click Create an Account hyperlink
    await page.locator('a', { hasText: /Create an Account/i }).click();
    await expect(page.locator('h1', { hasText: /Find Your Company/i })).toBeVisible();

    // 4. Type "global" in Company Name field and click Search Button
    await page.getByLabel(/Company Name/i).fill('global');
    await page.locator('button', { hasText: /Search/i }).click();

    // Wait for search results to appear (up to 2 minutes)
    await page.locator('button', { hasText: /Select/i }).first().waitFor({ state: 'visible', timeout: 120000 });

    // 5. Scroll down to see the search results and click the select button of the 1st result
    await page.locator('button', { hasText: /Select/i }).first().click();

    // 6. Click Confirm & Create Your Account button
    await page.locator('button', { hasText: /Confirm & Create Your Account/i }).click();
    await expect(page.locator('h1', { hasText: /Personal Information/i })).toBeVisible();

    // Generate unique email
    const timestamp = Date.now();
    const email = `testuser+global${timestamp}@example.com`;

    // 7. Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number
    await page.getByLabel(/First Name/i).fill('Global');
    await page.getByLabel(/Last Name/i).fill('User');
    await page.getByLabel(/^Email Address$/i).fill(email);
    await page.getByLabel(/Email Confirmation/i).fill(email);
    await page.getByLabel(/Phone Number/i).fill('555-123-4567'); // Filling optional field

    // 8. In Account Information section, fill password, Confirm Password, Select user type and Click Create Account button
    const password = 'TestP@ssword1!'; // Meets typical requirements
    await page.getByLabel(/^Password$/i).fill(password);
    await page.getByLabel(/Confirm Password/i).fill(password);
    await page.getByLabel(/User Type/i).selectOption('Exhibitor');
    await page.locator('button', { hasText: /Create Account/i }).click();

    // Assert successful registration (e.g., land on a dashboard or success page)
    await expect(page.locator('h1', { hasText: /Account Created Successfully/i }).or(page.locator('h1', { hasText: /Dashboard/i }))).toBeVisible({ timeout: 45000 });
});

test('POS: Register with a specific company search and minimal personal info', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');

    // 2. Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.locator('button', { hasText: /Continue/i }).click();

    // 3. Click Create an Account hyperlink
    await page.locator('a', { hasText: /Create an Account/i }).click();
    await expect(page.locator('h1', { hasText: /Find Your Company/i })).toBeVisible();

    // 4. Type "convention" in Company Name field and click Search Button
    await page.getByLabel(/Company Name/i).fill('convention');
    await page.locator('button', { hasText: /Search/i }).click();

    // Wait for search results to appear (up to 2 minutes)
    await page.locator('button', { hasText: /Select/i }).first().waitFor({ state: 'visible', timeout: 120000 });

    // 5. Scroll down to see the search results and click the select button of the 1st result
    await page.locator('button', { hasText: /Select/i }).first().click();

    // 6. Click Confirm & Create Your Account button
    await page.locator('button', { hasText: /Confirm & Create Your Account/i }).click();
    await expect(page.locator('h1', { hasText: /Personal Information/i })).toBeVisible();

    // Generate unique email
    const timestamp = Date.now();
    const email = `testuser+convention${timestamp}@example.com`;

    // 7. Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation (skipping Phone Number if optional)
    await page.getByLabel(/First Name/i).fill('Convention');
    await page.getByLabel(/Last Name/i).fill('Attendee');
    await page.getByLabel(/^Email Address$/i).fill(email);
    await page.getByLabel(/Email Confirmation/i).fill(email);
    // Phone Number is skipped here, assuming it's optional

    // 8. In Account Information section, fill password, Confirm Password, Select user type and Click Create Account button
    const password = 'MyP@ssw0rd!'; // Meets typical requirements
    await page.getByLabel(/^Password$/i).fill(password);
    await page.getByLabel(/Confirm Password/i).fill(password);
    await page.getByLabel(/User Type/i).selectOption('Attendee');
    await page.locator('button', { hasText: /Create Account/i }).click();

    // Assert successful registration
    await expect(page.locator('h1', { hasText: /Account Created Successfully/i }).or(page.locator('h1', { hasText: /Dashboard/i }))).toBeVisible({ timeout: 45000 });
});

test('POS: Register with a different industry company search and alternative user type', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');

    // 2. Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.locator('button', { hasText: /Continue/i }).click();

    // 3. Click Create an Account hyperlink
    await page.locator('a', { hasText: /Create an Account/i }).click();
    await expect(page.locator('h1', { hasText: /Find Your Company/i })).toBeVisible();

    // 4. Type "tradeshow" in Company Name field and click Search Button
    await page.getByLabel(/Company Name/i).fill('tradeshow');
    await page.locator('button', { hasText: /Search/i }).click();

    // Wait for search results to appear (up to 2 minutes)
    await page.locator('button', { hasText: /Select/i }).first().waitFor({ state: 'visible', timeout: 120000 });

    // 5. Scroll down to see the search results and click the select button of the 1st result
    await page.locator('button', { hasText: /Select/i }).first().click();

    // 6. Click Confirm & Create Your Account button
    await page.locator('button', { hasText: /Confirm & Create Your Account/i }).click();
    await expect(page.locator('h1', { hasText: /Personal Information/i })).toBeVisible();

    // Generate unique email
    const timestamp = Date.now();
    const email = `testuser+tradeshow${timestamp}@example.com`;

    // 7. Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number
    await page.getByLabel(/First Name/i).fill('Trade');
    await page.getByLabel(/Last Name/i).fill('Vendor');
    await page.getByLabel(/^Email Address$/i).fill(email);
    await page.getByLabel(/Email Confirmation/i).fill(email);
    await page.getByLabel(/Phone Number/i).fill('555-987-6543'); // Filling optional field

    // 8. In Account Information section, fill password, Confirm Password, Select user type and Click Create Account button
    const password = 'SecureP@ss2023!'; // Meets typical requirements
    await page.getByLabel(/^Password$/i).fill(password);
    await page.getByLabel(/Confirm Password/i).fill(password);
    await page.getByLabel(/User Type/i).selectOption('Vendor');
    await page.locator('button', { hasText: /Create Account/i }).click();

    // Assert successful registration
    await expect(page.locator('h1', { hasText: /Account Created Successfully/i }).or(page.locator('h1', { hasText: /Dashboard/i }))).toBeVisible({ timeout: 45000 });
});

test('NEG: Incorrect Secure Access Password', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://dev.ges.store/login', { waitUntil: 'domcontentloaded' });

    // Wait for the Secure Access page to load
    await page.waitForSelector('h1:has-text("Secure Access")', { timeout: 15000 });

    // Enter an incorrect password
    await page.locator('[placeholder="Password"]').fill('wrongpassword123');

    // Click the Continue button
    await page.locator('button:has-text("Continue")').click();

    // Assert that an error message is displayed
    await expect(page.locator('text=Incorrect password. Please try again.')).toBeVisible({ timeout: 15000 });

    // Assert that the page remains on the login URL
    await expect(page).toHaveURL('https://dev.ges.store/login', { timeout: 5000 });
});

test('NEG: Mismatched Email Confirmation on Registration', async ({ page }) => {
    // Go to login page and pass secure access
    await page.goto('https://dev.ges.store/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1:has-text("Secure Access")', { timeout: 15000 });
    await page.locator('[placeholder="Password"]').fill('FiP93&@1U94L');
    await page.locator('button:has-text("Continue")').click();
    await page.waitForURL('https://dev.ges.store/register', { timeout: 30000 });

    // Click "Create an Account"
    await page.locator('a:has-text("Create an Account")').click();
    await page.waitForURL('https://dev.ges.store/register/find-your-company', { timeout: 30000 });

    // Find and select a company
    await page.locator('#companyName').fill('lamb');
    await page.locator('button:has-text("Search")').click();
    await page.waitForSelector('text=Lamb, Inc.', { timeout: 45000 }); // Wait for search results
    await page.locator('button:has-text("Select")').first().click();
    await page.locator('button:has-text("Confirm & Create Your Account")').click();
    await page.waitForURL('https://dev.ges.store/register/personal-information', { timeout: 30000 });

    // Fill personal information with mismatched emails
    await page.locator('#firstName').fill('Test');
    await page.locator('#lastName').fill('User');
    await page.locator('#emailAddress').fill('test@example.com');
    await page.locator('#confirmEmailAddress').fill('wrong@example.com'); // Mismatched email
    await page.locator('#phoneNumber').fill('5551234567');

    // Trigger blur validation by clicking outside the field
    await page.locator('#firstName').click();

    // Assert that a validation message for email mismatch is visible
    await expect(page.locator('text=Email addresses do not match.')).toBeVisible({ timeout: 15000 });

    // Assert that the "Create Account" button is disabled
    await expect(page.locator('button:has-text("Create Account")')).toBeDisabled({ timeout: 15000 });
});

test('NEG: Weak Password Not Meeting Requirements on Registration', async ({ page }) => {
    // Go to login page and pass secure access
    await page.goto('https://dev.ges.store/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1:has-text("Secure Access")', { timeout: 15000 });
    await page.locator('[placeholder="Password"]').fill('FiP93&@1U94L');
    await page.locator('button:has-text("Continue")').click();
    await page.waitForURL('https://dev.ges.store/register', { timeout: 30000 });

    // Click "Create an Account"
    await page.locator('a:has-text("Create an Account")').click();
    await page.waitForURL('https://dev.ges.store/register/find-your-company', { timeout: 30000 });

    // Find and select a company
    await page.locator('#companyName').fill('lamb');
    await page.locator('button:has-text("Search")').click();
    await page.waitForSelector('text=Lamb, Inc.', { timeout: 45000 }); // Wait for search results
    await page.locator('button:has-text("Select")').first().click();
    await page.locator('button:has-text("Confirm & Create Your Account")').click();
    await page.waitForURL('https://dev.ges.store/register/personal-information', { timeout: 30000 });

    // Fill all personal information correctly
    await page.locator('#firstName').fill('Test');
    await page.locator('#lastName').fill('User');
    await page.locator('#emailAddress').fill('weakpassword@example.com');
    await page.locator('#confirmEmailAddress').fill('weakpassword@example.com');
    await page.locator('#phoneNumber').fill('5551234567');

    // Enter a weak password that likely fails requirements
    await page.locator('#password').fill('short'); // Weak password, e.g., no uppercase, numbers, special chars
    await page.locator('#confirmPassword').fill('short');

    // Select a user type (assuming a dropdown with 'Individual' option)
    await page.locator('select#userType').selectOption('Individual');

    // Trigger blur validation on password fields
    await page.locator('#firstName').click();

    // Assert that a validation message for password requirements is visible
    // This message assumes typical password requirements based on the happy path instruction.
    await expect(page.locator('text=Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.')).toBeVisible({ timeout: 15000 });

    // Assert that the "Create Account" button is disabled
    await expect(page.locator('button:has-text("Create Account")')).toBeDisabled({ timeout: 15000 });
});
