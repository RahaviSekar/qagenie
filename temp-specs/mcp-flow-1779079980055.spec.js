const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
    // Generate unique data for each test run
    const timestamp = Date.now();
    const firstName = 'Playwright';
    const lastName = `TestUser${timestamp}`;
    const email = `playwright.user.${timestamp}@example.com`;
    const phoneNumber = '555-123-4567';
    // Password meeting typical requirements: at least one uppercase, one lowercase, one number, one special character, and sufficient length
    const accountPassword = 'SecureP@ssw0rd1!'; 

    // Step 1: Go to /login
    await page.goto('https://dev.ges.store/login');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Enter Secure Access password
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

    // Step 3: Click Create an Account link
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();

    // Step 4: Search for company "lamb"
    // Wait for the "Company Name" field to be visible before interacting
    await page.getByLabel(/company\s*name/i).waitFor({ state: 'visible', timeout: 45000 });
    await page.getByLabel(/company\s*name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait up to 2 minutes (120000ms) for search results to appear
    await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible({ timeout: 120000 });

    // Step 5: Select the first company search result
    await page.getByRole('button', { name: /^select$/i }).first().click();

    // Step 6: Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();

    // Step 7: Fill Personal Information fields
    // Wait for the first personal information field to be visible before filling the form
    await page.getByLabel(/first\s*name|given\s*name/i).waitFor({ state: 'visible', timeout: 45000 });
    await page.getByLabel(/first\s*name|given\s*name/i).fill(firstName);
    await page.getByLabel(/last\s*name|surname/i).fill(lastName);
    await page.getByLabel(/email\s*address/i).fill(email);
    await page.getByLabel(/email\s*confirmation/i).fill(email);
    await page.getByLabel(/phone\s*number/i).fill(phoneNumber);

    // Step 8: Fill Account Information section, select user type, and click Create Account button
    await page.getByLabel(/account\s*password|new\s*password/i).first().fill(accountPassword);
    await page.getByLabel(/confirm\s*password/i).fill(accountPassword);
    // Assuming 'User Type' is a select dropdown, select the first non-default option (index 1)
    // If it's a different UI component (e.g., radio buttons), this locator and action would need adjustment.
    await page.getByLabel(/user\s*type/i).selectOption({ index: 1 }); 
    await page.getByRole('button', { name: /create\s+account/i }).click();

    // Optional: Add an assertion here to confirm successful account creation, e.g.,
    // await expect(page.getByText(/account created successfully/i)).toBeVisible();
    // Or wait for navigation to a confirmation page or dashboard.
});

test('POS: Register with a different company (e.g., "Solutions") and fill minimal required fields', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');

    // Secure Access Gate
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click Create an Account
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    // Find Your Company page - Use a different valid company search term
    await page.getByLabel(/company\s*name/i).fill('solutions');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for search results to appear (up to 2 minutes)
    await page.getByRole('button', { name: /select/i }).first().waitFor({ state: 'visible', timeout: 120000 });
    await page.getByRole('button', { name: /select/i }).first().click();

    // Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information
    const email = `testuser-solutions-${Date.now()}@example.com`;
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/^email address$/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('1234567890');

    // Fill Account Information
    const password = 'SecureP@ss123!'; // Meets typical requirements
    await page.getByLabel(/account password|new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption('User'); // Assuming 'User' is a valid option

    // Click Create Account button
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful account creation (e.g., redirection or success message)
    await expect(page.getByText(/account created successfully|registration successful|welcome to your dashboard/i)).toBeVisible({ timeout: 15000 });
});

test('POS: Register with a company search term yielding multiple results, selecting a non-first result', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');

    // Secure Access Gate
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click Create an Account
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    // Find Your Company page - Use a term likely to yield multiple results
    await page.getByLabel(/company\s*name/i).fill('services');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for the 3rd 'select' button to be visible (assuming at least 3 results for "services")
    await page.getByRole('button', { name: /select/i }).nth(2).waitFor({ state: 'visible', timeout: 120000 });
    await page.getByRole('button', { name: /select/i }).nth(2).click(); // Click the 3rd select button

    // Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information
    const email = `testuser-services-${Date.now()}@example.com`;
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Smith');
    await page.getByLabel(/^email address$/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('9876543210');

    // Fill Account Information
    const password = 'MyP@ssw0rd!'; // Another valid password
    await page.getByLabel(/account password|new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption('Administrator'); // Assuming 'Administrator' is another valid option

    // Click Create Account button
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful account creation
    await expect(page.getByText(/account created successfully|registration successful|welcome to your dashboard/i)).toBeVisible({ timeout: 15000 });
});

test('POS: Register with a specific company name and a strong, complex password', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');

    // Secure Access Gate
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    // Click Create an Account
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    // Find Your Company page - Use a specific, potentially full company name
    await page.getByLabel(/company\s*name/i).fill('GES Group');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for search results
    await page.getByRole('button', { name: /select/i }).first().waitFor({ state: 'visible', timeout: 120000 });
    await page.getByRole('button', { name: /select/i }).first().click();

    // Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill Personal Information
    const email = `testuser-ges-${Date.now()}@example.com`;
    await page.getByLabel(/first name/i).fill('Alice');
    await page.getByLabel(/last name/i).fill('Johnson');
    await page.getByLabel(/^email address$/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill('5551234567');

    // Fill Account Information - Use a longer, more complex password
    const password = `SuperStrongP@ssw0rd!${Math.floor(Math.random() * 100)}`; // Ensures uniqueness and complexity
    await page.getByLabel(/account password|new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption('Power User'); // Assuming 'Power User' is a valid option

    // Click Create Account button
    await page.getByRole('button', { name: /create account/i }).click();

    // Assert successful account creation
    await expect(page.getByText(/account created successfully|registration successful|welcome to your dashboard/i)).toBeVisible({ timeout: 15000 });
});

test('NEG: Incorrect Secure Access password', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('wrongpassword123'); // Invalid password
    await page.getByRole('button', { name: /continue/i }).click();

    // Assert that an error message is visible. The exact text may vary, so using a regex.
    await expect(page.locator('text=/incorrect password|invalid credentials|authentication failed/i')).toBeVisible({ timeout: 15000 });
    // Also assert that the page does not advance from the login page.
    await expect(page).toHaveURL('https://dev.ges.store/login', { timeout: 15000 });
});

test('NEG: Mismatched Account Passwords during Registration', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    // Ensure we are on the 'Find Your Company' page before proceeding
    await expect(page.getByLabel(/company\s*name/i)).toBeVisible({ timeout: 30000 });

    await page.getByLabel(/company\s*name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(120000); // Wait for search results as per instructions

    await page.locator('button:has-text("Select")').first().click();
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill personal information (using valid data)
    const uniqueId = Date.now();
    await page.getByLabel(/first name/i).fill(`Test${uniqueId}`);
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).first().fill(`test${uniqueId}@example.com`);
    await page.getByLabel(/email confirmation/i).first().fill(`test${uniqueId}@example.com`);
    await page.getByLabel(/phone number/i).fill('1234567890');

    // Fill account passwords with an intentional mismatch
    await page.getByLabel(/account password|new password/i).first().fill('StrongPassword123!');
    await page.getByLabel(/confirm password/i).first().fill('MismatchPassword!'); // Mismatched password

    // Select a user type (assuming it's a dropdown and 'Customer' is a common option)
    // We'll assume a generic 'select' element for user type
    await page.locator('select').first().selectOption('Customer');

    await page.getByRole('button', { name: /create account/i }).click();

    // Assert that a validation message for password mismatch is visible.
    // Common messages include 'Passwords do not match', 'Confirmation does not match', etc.
    await expect(page.locator('text=/passwords do not match|match validation|confirmation mismatch/i')).toBeVisible({ timeout: 15000 });
    // Also assert that the URL has not advanced from the registration form.
    await expect(page).toHaveURL(/register|account/, { timeout: 15000 });
});

test('NEG: Invalid Email Format during Registration', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    // Ensure we are on the 'Find Your Company' page before proceeding
    await expect(page.getByLabel(/company\s*name/i)).toBeVisible({ timeout: 30000 });

    await page.getByLabel(/company\s*name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(120000); // Wait for search results as per instructions

    await page.locator('button:has-text("Select")').first().click();
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill personal information with an invalid email format
    const uniqueId = Date.now();
    await page.getByLabel(/first name/i).fill(`Test${uniqueId}`);
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).first().fill('invalid-email-format'); // Invalid email
    await page.getByLabel(/email confirmation/i).first().fill('invalid-email-format'); // Invalid email confirmation
    await page.getByLabel(/phone number/i).fill('1234567890');

    // Fill account passwords correctly (as they are required and not the focus of this test)
    await page.getByLabel(/account password|new password/i).first().fill('ValidPassword123!');
    await page.getByLabel(/confirm password/i).first().fill('ValidPassword123!');

    // Select a user type
    await page.locator('select').first().selectOption('Customer');

    await page.getByRole('button', { name: /create account/i }).click();

    // Assert that a validation message for invalid email format is visible.
    // Common messages include 'Please enter a valid email address', 'Invalid email format', etc.
    await expect(page.locator('text=/please enter a valid email address|invalid email format/i')).toBeVisible({ timeout: 15000 });
    // Also assert that the URL has not advanced from the registration form.
    await expect(page).toHaveURL(/register|account/, { timeout: 15000 });
});