const { test, expect } = require('@playwright/test');

test('Register new user and search company', async ({ page }) => {
    // 1. Go to /login
    await page.goto('https://dev.ges.store/login');
    await page.waitForLoadState('domcontentloaded');

    // 2. If Secure Access password is asked, give this FiP93&@1U94L
    const secureAccessPasswordField = page.getByLabel(/Secure Access password/i)
                                        .or(page.getByPlaceholder(/Secure Access password/i));
    
    // Check if the secure access field is visible before attempting to interact
    if (await secureAccessPasswordField.isVisible()) {
        await secureAccessPasswordField.fill('FiP93&@1U94L');
        
        // If there's a specific submit button for secure access, click it.
        // Assuming a generic submit/login/continue button would handle this on the same page.
        const submitSecureAccessButton = page.getByRole('button', { name: /submit|login|continue/i });
        if (await submitSecureAccessButton.isVisible()) {
            await submitSecureAccessButton.click();
            await page.waitForLoadState('domcontentloaded'); // Wait for potential navigation after submitting secure access
        }
    }

    // 3. click Create an Account which is a hyperlink placed under this text "Login below or "
    // Use getByRole with RegExp for robustness. .first() in case of multiple matches.
    await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();
    await page.waitForLoadState('domcontentloaded'); // Wait for the registration page to load

    // 4. search lamb in search company field
    // 5. select the 3rd result
    // These steps are assumed to be part of the account creation form.
    const searchCompanyField = page.getByLabel(/search\s+company/i)
                                    .or(page.getByPlaceholder(/search\s+company/i));
    await searchCompanyField.fill('lamb');

    // Wait for search results to appear and then select the 3rd one (index 2)
    // Assuming search results appear as list items or options.
    const thirdSearchResult = page.getByRole('listitem').nth(2)
                                .or(page.getByRole('option').nth(2))
                                .or(page.getByRole('link').nth(2)); // Added 'link' as results might be links
    
    await thirdSearchResult.waitFor({ state: 'visible' }); // Ensure the element is visible
    await thirdSearchResult.click();

    // 6. create an account with valid username password
    const uniqueUsername = 'testuser_' + Math.random().toString(36).substring(2, 8) + '@test.com'; // Use @test.com for email part, not app origin
    const userPassword = 'Password123!'; // A strong but predictable password

    await page.getByLabel(/email|username/i).fill(uniqueUsername);
    await page.getByLabel(/password/i).first().fill(userPassword); // Use .first() for the main password field
    await page.getByLabel(/confirm\s+password|re-enter\s+password/i).fill(userPassword);

    // Click the register/create account button
    await page.getByRole('button', { name: /register|create\s+account|sign\s+up/i }).click();

    await page.waitForLoadState('domcontentloaded'); // Wait for navigation after submitting the form

    // Optional: Add an assertion to confirm successful registration/redirection
    // await expect(page).toHaveURL(/dashboard|home|success|welcome/i);
    // await expect(page.getByText(/account\s+created|welcome\s+to/i)).toBeVisible();
});