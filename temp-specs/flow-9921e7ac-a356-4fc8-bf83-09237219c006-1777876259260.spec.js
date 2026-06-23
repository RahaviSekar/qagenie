const { test, expect } = require('@playwright/test');

test('Register flow on dev.ges.store', async ({ page }) => {
    const appOrigin = 'https://dev.ges.store';
    const secureAccessPassword = 'FiP93&@1U94L';
    const passwordForRegistration = 'P@ssword123!'; // Meets common complex password requirements

    // Step 1: Go to /login
    await page.goto(`${appOrigin}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
    // Detect the secure access gate by heading or introductory text
    const secureAccessGateHeading = page.getByRole('heading', { name: /secure access|password to continue/i });
    const secureAccessGateText = page.getByText(/enter the password to continue/i);

    // Wait for either the heading or text to appear, indicating the gate is present
    await expect(secureAccessGateHeading.or(secureAccessGateText)).toBeVisible({ timeout: 15000 });
    
    // Fill the password field, typically an input with type="password"
    await page.locator('input[type="password"]').first().fill(secureAccessPassword);
    
    // Click the continue button, tolerating variations like "Continue" or "Submit"
    await page.getByRole('button', { name: /continue|submit/i }).click();
    
    // Wait until the secure access gate is no longer visible, confirming successful bypass
    await expect(secureAccessGateHeading.or(secureAccessGateText)).not.toBeVisible({ timeout: 15000 });

    // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
    // Use getByRole('link') with a RegExp for flexibility in matching "Create an Account" or "Create Account"
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).click();

    // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins) please wait for the search results
    await page.getByLabel(/company name/i).fill('lamb');
    await page.getByRole('button', { name: /search/i }).click();
    // Wait for the "Search Results" heading to appear, allowing up to 2 minutes as per instruction
    await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible({ timeout: 120000 }); // 2 minutes

    // Step 5: scroll down to see the search results and click the select button of the 1st result
    // Ensure the scrollable area is visible; typically, scrolling the body is enough
    await page.locator('body').scrollIntoViewIfNeeded();
    // Locate the first "Select" button among the search results. Using /^select$/i ensures an exact match for the button text.
    await page.getByRole('button', { name: /^select$/i }).nth(0).click();

    // Step 6: Click Confirm & Create Your Account button
    await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();

    // Step 7: Fill the Personal Information fields - First Name, Last Name, Email Address, Email Confirmation, Phone Number,
    // In Account Information section, fill password(Make sure to read the Password Requirements: and fill tjhe password accordingly) , Confirm Password, Select user type and Click Create Account button
    const timestamp = Date.now();
    const testEmail = `registertest${timestamp}@example.com`;

    // Personal Information section
    await page.getByLabel(/first name/i).fill('Playwright');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/email confirmation/i).fill(testEmail);
    await page.getByLabel(/phone number/i).fill('555-123-4567');

    // Account Information section
    // Fill password, ensuring it meets common complex password requirements (uppercase, lowercase, number, special char, length).
    await page.getByLabel(/^password$/i).first().fill(passwordForRegistration); // Using .first() to distinguish from confirm password
    await page.getByLabel(/confirm password/i).fill(passwordForRegistration);
    
    // Select user type - assuming a standard <select> element or similar dropdown
    // The actual option value 'Individual' might need adjustment based on the application's available options.
    await page.getByLabel(/user type/i).selectOption('Individual'); 
    
    // Click Create Account button
    await page.getByRole('button', { name: /create\s+account/i }).click();

    // Optional: Add an assertion here to confirm successful registration, e.g., a success message or redirect to a dashboard.
    // For example, waiting for a heading like "Registration Successful" or "Welcome"
    // await expect(page.getByRole('heading', { name: /registration successful|welcome/i })).toBeVisible({ timeout: 15000 });
});