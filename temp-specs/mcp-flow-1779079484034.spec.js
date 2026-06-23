const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
    const BASE_URL = 'https://dev.ges.store';

    // Helper to generate a unique email for each test run
    const generateUniqueEmail = () => {
        const timestamp = new Date().getTime();
        return `testuser_${timestamp}@example.com`;
    };

    const testEmail = generateUniqueEmail();

    // Step 1: Go to /login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('domcontentloaded'); // Wait for the navigation to the new page

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
    await page.getByLabel(/company\s*name/i).waitFor({ state: 'visible', timeout: 45000 }); // Wait for the Company Name field to be visible
    await page.getByLabel(/company\s*name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for search results to appear. The user specified a wait of up to 2 minutes.
    await expect(page.getByRole('heading', { name: /search\s+results/i })).toBeVisible({ timeout: 120000 });

    // Step 5: scroll down to see the search results and click the select button of the 1st result
    const firstSelectButton = page.getByRole('button', { name: /^select$/i }).nth(0);
    await expect(firstSelectButton).toBeEnabled({ timeout: 15000 }); // Ensure the button is enabled before clicking
    await firstSelectButton.click();

    // Step 6: Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm\s*&\s*create\s*your\s*account/i }).click();
    await page.waitForLoadState('domcontentloaded'); // Wait for the navigation to the next step of registration

    // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
    await page.getByLabel(/first\s*name|given\s*name/i).waitFor({ state: 'visible', timeout: 45000 }); // Wait for the form to load
    await page.getByLabel(/first\s*name/i).fill('TestFirstName');
    await page.getByLabel(/last\s*name/i).fill('TestLastName');
    await page.getByLabel(/email\s*address/i).fill(testEmail);
    await page.getByLabel(/email\s*confirmation/i).fill(testEmail);
    await page.getByLabel(/phone\s*number/i).fill('5551234567'); // Using a generic US phone number format

    // Step 8: In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
    // Using a password that typically meets common complexity requirements (uppercase, lowercase, number, symbol, length)
    const accountPassword = 'Test!Password123';
    await page.getByLabel(/account\s*password|new\s*password/i).fill(accountPassword);
    await page.getByLabel(/confirm\s*password/i).fill(accountPassword);

    // Locate the user type selection field (assuming it's a select dropdown)
    const userTypeSelectLocator = page.getByLabel(/user\s*type/i);
    // Attempt to select 'Employee' if available, otherwise fallback to the first actual option (index 1)
    try {
        await userTypeSelectLocator.selectOption({ label: 'Employee' });
    } catch (error) {
        console.warn(`Could not select 'Employee' for user type. Error: ${error.message}. Attempting to select by index 1.`);
        // Ensure options are loaded before trying to select by index
        await userTypeSelectLocator.waitFor({ state: 'visible', timeout: 15000 });
        const options = await userTypeSelectLocator.locator('option').allTextContents();
        if (options.length > 1) { // Check if there's more than just a placeholder
            await userTypeSelectLocator.selectOption({ index: 1 });
        } else {
            console.error("No suitable options found or selectable for 'User Type' select dropdown.");
        }
    }

    await page.getByRole('button', { name: /create\s*account/i }).click();

    // Optional: Add an assertion to confirm successful registration, e.g.,
    // await expect(page.getByText(/account created successfully|welcome/i)).toBeVisible({ timeout: 30000 });
});

test('POS: Register with alternate company search term and select second result', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');

    // 2. Secure Access page: Enter password and click continue
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForLoadState('networkidle');

    // 3. Click Create an Account hyperlink
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('networkidle');

    // 4. Find Your Company page: Type 'global' in Company Name field and click Search Button
    await expect(page.getByLabel(/company\s*name/i)).toBeVisible();
    await page.getByLabel(/company\s*name/i).fill('global');
    await page.getByRole('button', { name: /search/i }).click();

    // Wait up to 120000ms for search results
    await page.getByRole('button', { name: /select/i }).first().waitFor({ state: 'visible', timeout: 120000 });

    // 5. Scroll down to see search results and click the select button of the 2nd result
    // Assuming results are visible after the waitFor and potentially need scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); // Scroll to bottom
    await page.getByRole('button', { name: /select/i }).nth(1).click(); // Click the second select button

    // 6. Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();
    await page.waitForLoadState('networkidle');

    // 7. Fill the Personal Information fields
    const firstName = `TestFn${Date.now()}`;
    const lastName = `GlobalLn${Date.now()}`;
    const email = `test.global.${Date.now()}@example.com`;
    const phoneNumber = '5551234567'; // Valid 10-digit number

    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill(phoneNumber);

    // 8. In Account Information section, fill password, Confirm Password, Select user type and Click Create Account button
    const password = 'ValidP@ssw0rd1!'; // Meets typical requirements: 8+ chars, upper, lower, number, special
    await page.getByLabel(/account password|new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption({ label: 'Attendee' }); // Assuming 'Attendee' is a valid option

    await page.getByRole('button', { name: /create account/i, exact: true }).click();

    // Assert successful progression - e.g., redirected to a dashboard or success page
    await expect(page).toHaveURL(/dashboard|success|account-created/i, { timeout: 45000 });
    // Or assert a success message:
    // await expect(page.getByText(/account created successfully|welcome to your dashboard/i)).toBeVisible({ timeout: 45000 });
});

test('POS: Register with minimal required personal info and different user type', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');

    // 2. Secure Access page: Enter password and click continue
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForLoadState('networkidle');

    // 3. Click Create an Account hyperlink
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('networkidle');

    // 4. Find Your Company page: Type 'solutions' in Company Name field and click Search Button
    await expect(page.getByLabel(/company\s*name/i)).toBeVisible();
    await page.getByLabel(/company\s*name/i).fill('solutions');
    await page.getByRole('button', { name: /search/i }).click();

    // Wait up to 120000ms for search results
    await page.getByRole('button', { name: /select/i }).first().waitFor({ state: 'visible', timeout: 120000 });

    // 5. Scroll down to see search results and click the select button of the 1st result
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('button', { name: /select/i }).first().click();

    // 6. Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();
    await page.waitForLoadState('networkidle');

    // 7. Fill the Personal Information fields (minimal required)
    const firstName = `MinReqFn${Date.now()}`;
    const lastName = `MinReqLn${Date.now()}`;
    const email = `minreq.${Date.now()}@example.com`;
    const phoneNumber = '5559876543';

    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill(phoneNumber); // Assuming phone number is always required

    // 8. In Account Information section, fill password, Confirm Password, Select user type and Click Create Account button
    const password = 'An0therP@ssw0rd!';
    await page.getByLabel(/account password|new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption({ label: 'Exhibitor' }); // Assuming 'Exhibitor' is another valid option

    await page.getByRole('button', { name: /create account/i, exact: true }).click();

    // Assert successful progression
    await expect(page).toHaveURL(/dashboard|success|account-created/i, { timeout: 45000 });
});

test('POS: Register with a multi-word company name search and email with subdomain', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');

    // 2. Secure Access page: Enter password and click continue
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForLoadState('networkidle');

    // 3. Click Create an Account hyperlink
    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('networkidle');

    // 4. Find Your Company page: Type 'event services' in Company Name field and click Search Button
    await expect(page.getByLabel(/company\s*name/i)).toBeVisible();
    await page.getByLabel(/company\s*name/i).fill('event services');
    await page.getByRole('button', { name: /search/i }).click();

    // Wait up to 120000ms for search results
    await page.getByRole('button', { name: /select/i }).first().waitFor({ state: 'visible', timeout: 120000 });

    // 5. Scroll down to see search results and click the select button of the 1st result
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('button', { name: /select/i }).first().click();

    // 6. Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm & create your account/i }).click();
    await page.waitForLoadState('networkidle');

    // 7. Fill the Personal Information fields with an email containing a subdomain
    const firstName = `MultiWordFn${Date.now()}`;
    const lastName = `MultiWordLn${Date.now()}`;
    const email = `subdomain.user.${Date.now()}@sub.example.com`; // Email with subdomain
    const phoneNumber = '1234567890';

    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/email confirmation/i).fill(email);
    await page.getByLabel(/phone number/i).fill(phoneNumber);

    // 8. In Account Information section, fill password, Confirm Password, Select user type and Click Create Account button
    const password = 'StrongP@ssw0rd2!';
    await page.getByLabel(/account password|new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByLabel(/user type/i).selectOption({ label: 'Media' }); // Assuming 'Media' is another valid option

    await page.getByRole('button', { name: /create account/i, exact: true }).click();

    // Assert successful progression
    await expect(page).toHaveURL(/dashboard|success|account-created/i, { timeout: 45000 });
});

javascript
test('NEG: Incorrect Secure Access Password', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');

    // Attempt to enter an incorrect password
    await page.locator('input[type="password"]').first().fill('wrongpassword123');
    await page.getByRole('button', { name: /continue/i }).click();

    // Expect an error message indicating incorrect password or that the URL does not change.
    // A common pattern is a visible error message.
    await expect(page.getByText(/incorrect password|access denied/i), { timeout: 15000 }).toBeVisible();
    // Also, ensure we didn't navigate away from the login page.
    await expect(page).toHaveURL('https://dev.ges.store/login', { timeout: 15000 });
});

test('NEG: Mismatched Account Passwords', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    await page.getByLabel(/company\s*name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(120000); // Wait for search results as per instructions

    await page.getByRole('button', { name: 'Select' }).first().click(); // Select the first company
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Fill personal info with valid data to isolate password error
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill('test.user@example.com');
    await page.getByLabel(/email confirmation/i).fill('test.user@example.com');
    await page.getByLabel(/phone number/i).fill('555-123-4567');

    // Fill mismatched account passwords
    await page.getByLabel(/account password|new password/i).first().fill('StrongP@ssw0rd1!');
    await page.getByLabel(/account password|new password/i).nth(1).fill('MismatchP@ssw0rd2!'); // Confirm password

    // Select user type (using a generic locator for a select element if present)
    const userTypeSelect = page.locator('select[name="userType"]');
    if (await userTypeSelect.isVisible({ timeout: 5000 })) {
        const options = await userTypeSelect.locator('option').allTextContents();
        if (options.length > 1) { // Assuming first option might be a placeholder
            await userTypeSelect.selectOption({ index: 1 });
        } else if (options.length === 1) {
            await userTypeSelect.selectOption({ index: 0 });
        }
    }

    const createAccountButton = page.getByRole('button', { name: /create account/i });
    await createAccountButton.click(); // Attempt to click to trigger validation

    // Expect a validation message for mismatched passwords
    await expect(page.getByText(/passwords do not match|confirm password must match/i), { timeout: 30000 }).toBeVisible();
    // Expect the confirm password field to be marked as invalid
    await expect(page.getByLabel(/account password|new password/i).nth(1)).toHaveAttribute('aria-invalid', 'true', { timeout: 15000 });
});

test('NEG: Missing Required First Name', async ({ page }) => {
    await page.goto('https://dev.ges.store/login');
    await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByRole("link", { name: /create\s+an?\s+account/i }).first().click();

    await page.getByLabel(/company\s*name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForTimeout(120000); // Wait for search results

    await page.getByRole('button', { name: 'Select' }).first().click(); // Select the first company
    await page.getByRole('button', { name: /confirm & create your account/i }).click();

    // Leave First Name field empty
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill('test.user@example.com');
    await page.getByLabel(/email confirmation/i).fill('test.user@example.com');
    await page.getByLabel(/phone number/i).fill('555-123-4567');

    // Fill valid account passwords
    await page.getByLabel(/account password|new password/i).first().fill('StrongP@ssw0rd1!');
    await page.getByLabel(/account password|new password/i).nth(1).fill('StrongP@ssw0rd1!');

    // Select user type (generic locator)
    const userTypeSelect = page.locator('select[name="userType"]');
    if (await userTypeSelect.isVisible({ timeout: 5000 })) {
        const options = await userTypeSelect.locator('option').allTextContents();
        if (options.length > 1) {
            await userTypeSelect.selectOption({ index: 1 });
        } else if (options.length === 1) {
            await userTypeSelect.selectOption({ index: 0 });
        }
    }

    const createAccountButton = page.getByRole('button', { name: /create account/i });
    await createAccountButton.click(); // Attempt to click to trigger validation

    // Expect a validation message for the First Name field
    await expect(page.getByText(/first name is required|please enter your first name/i), { timeout: 30000 }).toBeVisible();
    // Expect the First Name field to be marked as invalid
    await expect(page.getByLabel(/first name/i)).toHaveAttribute('aria-invalid', 'true', { timeout: 15000 });
});
