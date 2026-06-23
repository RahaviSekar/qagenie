const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
    // Step 1: Go to /login
    await page.goto('https://dev.ges.store/login');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue|submit/i }).click();
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins)
    await page.getByLabel(/company\s+name/i).waitFor({ state: 'visible', timeout: 45000 }); // Wait for the Company Name field to be visible
    await page.getByLabel(/company\s+name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();

    // Step 5: scroll down to see the search results and click the select button of the 1st result
    // The user mentioned "this may take upto 2 mins", so apply a long timeout to the next critical element.
    await page.getByRole('button', { name: /^select$/i }).first().waitFor({ state: 'visible', timeout: 120000 });
    await page.getByRole('button', { name: /^select$/i }).first().click();

    // Step 6: Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();

    // Step 7: Fill the Personal Information fields and Account Information section
    // Wait for the first personal information field to ensure the page is loaded
    await page.getByLabel(/first\s+name/i).waitFor({ state: 'visible', timeout: 45000 });

    // Personal Information fields
    await page.getByLabel(/first\s+name/i).fill('John');
    await page.getByLabel(/last\s+name/i).fill('Doe');

    const email = `john.doe+${Date.now()}@example.com`; // Generate a unique email to avoid conflicts on re-runs
    await page.getByLabel(/email\s+address/i).fill(email);
    await page.getByLabel(/email\s+confirmation/i).fill(email);
    await page.getByLabel(/phone\s+number/i).fill('5551234567');

    // Account Information section
    // Using a robust password that typically meets common requirements (uppercase, lowercase, number, symbol, length)
    const password = 'TestPa$$w0rd123!';
    await page.getByLabel(/^password$/i).fill(password); // Using /^password$/ to target only the main password field
    await page.getByLabel(/confirm\s+password/i).fill(password);

    // Assuming "user type" is a combobox/dropdown. Selecting the first non-placeholder option (index 1).
    // If it's implemented as radio buttons, this locator would need adjustment (e.g., getByRole('radio', { name: /admin/i })).
    await page.getByRole('combobox', { name: /user\s+type/i }).selectOption({ index: 1 });

    await page.getByRole('button', { name: /create\s+account/i }).click();

    // Optional: Add an assertion here to verify successful account creation,
    // e.g., await expect(page.getByText(/account created successfully/i)).toBeVisible();
});

test('NEG: Incorrect Secure Access Password', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');

    // Action: Enter an incorrect password for secure access
    await page.getByPlaceholder('Enter password').fill('wrong_password_123');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Assertion: Expect an error message related to incorrect password
    await expect(page.locator('text=Incorrect password. Please try again.')).toBeVisible({ timeout: 15000 });

    // Assertion: Expect to remain on the login page
    await expect(page).toHaveURL('https://dev.ges.store/login', { timeout: 5000 });
});

test('NEG: Mismatched Email Confirmation', async ({ page }) => {
    // Setup: Go through secure access and company selection
    await page.goto('https://dev.ges.store/login');
    await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Create an Account' }).click();
    await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });

    await page.getByLabel('Company Name').fill('lamb');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });

    // Action: Fill personal info with mismatched emails
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email Address').fill('john.doe@test.com');
    await page.getByLabel('Email Confirmation').fill('john.different@test.com'); // Mismatched email
    await page.getByLabel('Phone Number').fill('555-123-4567');

    // Fill Account Information with valid data to isolate email error
    await page.getByLabel('Password', { exact: true }).fill('StrongP@ss123!');
    await page.getByLabel('Confirm Password', { exact: true }).fill('StrongP@ss123!');
    await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');

    // Click Create Account to trigger validation
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Assertion: Expect email confirmation error message
    await expect(page.locator('text=Email addresses do not match')).toBeVisible({ timeout: 20000 });
    await expect(page.getByLabel('Email Confirmation')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    // Expect not to navigate away
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
});

test('NEG: Mismatched Account Password Confirmation', async ({ page }) => {
    // Setup: Go through secure access and company selection
    await page.goto('https://dev.ges.store/login');
    await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Create an Account' }).click();
    await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });

    await page.getByLabel('Company Name').fill('lamb');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });

    // Action: Fill personal info (valid)
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email Address').fill('jane.doe@test.com');
    await page.getByLabel('Email Confirmation').fill('jane.doe@test.com');
    await page.getByLabel('Phone Number').fill('555-987-6543');

    // Action: Fill Account Information with mismatched passwords
    await page.getByLabel('Password', { exact: true }).fill('SecureP@ss1!');
    await page.getByLabel('Confirm Password', { exact: true }).fill('MismatchedP@ss2!'); // Mismatched password
    await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');

    // Click Create Account to trigger validation
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Assertion: Expect password confirmation error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 20000 });
    await expect(page.getByLabel('Confirm Password', { exact: true })).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    // Expect not to navigate away
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
});

test('NEG: Account Password fails requirements', async ({ page }) => {
    // Setup: Go through secure access and company selection
    await page.goto('https://dev.ges.store/login');
    await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Create an Account' }).click();
    await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });

    await page.getByLabel('Company Name').fill('lamb');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });

    // Action: Fill personal info (valid)
    await page.getByLabel('First Name').fill('Peter');
    await page.getByLabel('Last Name').fill('Pan');
    await page.getByLabel('Email Address').fill('peter.pan@test.com');
    await page.getByLabel('Email Confirmation').fill('peter.pan@test.com');
    await page.getByLabel('Phone Number').fill('555-111-2222');

    // Action: Fill Account Information with a weak password that fails requirements
    await page.getByLabel('Password', { exact: true }).fill('short'); // Fails common length, complexity requirements
    await page.getByLabel('Confirm Password', { exact: true }).fill('short');
    await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');

    // Click Create Account to trigger validation
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Assertion: Expect password requirements error message
    await expect(page.locator('text=Password does not meet requirements')).toBeVisible({ timeout: 20000 });
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    // Expect not to navigate away
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
});

test('NEG: Empty Required Personal Information Fields', async ({ page }) => {
    // Setup: Go through secure access and company selection
    await page.goto('https://dev.ges.store/login');
    await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Create an Account' }).click();
    await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });

    await page.getByLabel('Company Name').fill('lamb');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });

    // Action: Leave personal info fields empty
    // Explicitly clear any pre-filled values if they exist
    await page.getByLabel('First Name').fill('');
    await page.getByLabel('Last Name').fill('');
    await page.getByLabel('Email Address').fill('');
    await page.getByLabel('Email Confirmation').fill('');
    await page.getByLabel('Phone Number').fill('');

    // Fill Account Information to ensure the "Create Account" button is clickable/enabled (if disabled by other factors)
    await page.getByLabel('Password', { exact: true }).fill('StrongP@ss123!');
    await page.getByLabel('Confirm Password', { exact: true }).fill('StrongP@ss123!');
    await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');

    // Click Create Account to trigger validation
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Assertion: Expect validation messages for empty required fields
    await expect(page.locator('text=This field is required').nth(0)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=This field is required').nth(1)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=This field is required').nth(2)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=This field is required').nth(3)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=This field is required').nth(4)).toBeVisible({ timeout: 15000 });

    // Also check aria-invalid for these fields
    await expect(page.getByLabel('First Name')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    await expect(page.getByLabel('Last Name')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    await expect(page.getByLabel('Email Address')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    await expect(page.getByLabel('Email Confirmation')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
    await expect(page.getByLabel('Phone Number')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });

    // Expect not to navigate away
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
});
