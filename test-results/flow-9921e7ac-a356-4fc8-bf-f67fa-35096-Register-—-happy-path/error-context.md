# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow-9921e7ac-a356-4fc8-bf83-09237219c006-1777880635096.spec.js >> Register — happy path
- Location: temp-specs\flow-9921e7ac-a356-4fc8-bf83-09237219c006-1777880635096.spec.js:3:1

# Error details

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
  - waiting for getByLabel(/^password$/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e2]:
    - generic [ref=e6]:
      - combobox "Select language" [ref=e7] [cursor=pointer]:
        - img [ref=e9]
        - generic: English
      - link "Account" [ref=e11] [cursor=pointer]:
        - /url: /login
        - img [ref=e12]
        - generic [ref=e15]: Account
      - link "Contact Us" [ref=e16] [cursor=pointer]:
        - /url: https://insights.ges.com/ges-store-resources
        - img [ref=e17]
        - generic [ref=e20]: Contact Us
    - link "GES Logo Original" [ref=e26] [cursor=pointer]:
      - /url: /
      - img "GES Logo Original" [ref=e27]
  - main [ref=e28]:
    - generic [ref=e30]:
      - navigation "breadcrumb" [ref=e31]:
        - list [ref=e32]:
          - listitem [ref=e33]:
            - link [ref=e34] [cursor=pointer]:
              - /url: /
              - img [ref=e35]
            - img [ref=e149]
          - listitem [ref=e151]:
            - link "Create Account" [disabled] [ref=e152]
      - generic [ref=e158]:
        - generic [ref=e159]:
          - generic [ref=e160]: Personal Information
          - generic [ref=e161]:
            - generic [ref=e162]:
              - generic [ref=e163]: First Name *
              - textbox "First Name *" [ref=e165]: John
            - generic [ref=e166]:
              - generic [ref=e167]: Last Name *
              - textbox "Last Name *" [ref=e169]: Doe
            - generic [ref=e170]:
              - generic [ref=e171]: Email Address *
              - textbox "Email Address *" [ref=e173]: john.doe+1777880673213@example.com
            - generic [ref=e174]:
              - generic [ref=e175]: Email Confirmation *
              - textbox "Email Confirmation *" [ref=e177]: john.doe+1777880673213@example.com
            - generic [ref=e178]:
              - generic [ref=e179]: Phone Number *
              - generic [ref=e180]:
                - button "+1 ▼" [ref=e182] [cursor=pointer]:
                  - generic [ref=e184]: "+1"
                  - generic [ref=e185]: ▼
                - textbox "Phone Number *" [active] [ref=e186]: "5551234567"
        - generic [ref=e187]:
          - generic [ref=e188]: Account Information
          - generic [ref=e189]:
            - generic [ref=e190]:
              - generic [ref=e191]:
                - generic [ref=e192]: Password *
                - generic [ref=e193]:
                  - textbox "Password *" [ref=e194]
                  - button "Show password" [ref=e195] [cursor=pointer]:
                    - generic [ref=e196]:
                      - img [ref=e197]
                      - generic [ref=e200]: Show
              - generic [ref=e201]:
                - generic [ref=e202]: Confirm Password *
                - generic [ref=e203]:
                  - textbox "Confirm Password *" [ref=e204]
                  - button "Show password" [ref=e205] [cursor=pointer]:
                    - generic [ref=e206]:
                      - img [ref=e207]
                      - generic [ref=e210]: Show
            - generic [ref=e211]:
              - generic [ref=e212]:
                - generic [ref=e213]: User Type *
                - radiogroup "User Type *" [ref=e214]:
                  - generic [ref=e215]:
                    - radio "Exhibitor" [checked] [ref=e216]
                    - radio [checked]
                    - generic [ref=e218] [cursor=pointer]: Exhibitor
                  - generic [ref=e219]:
                    - radio "3rd Party/EAC" [ref=e220]
                    - radio
                    - generic [ref=e221] [cursor=pointer]: 3rd Party/EAC
              - button "Create Account" [ref=e222] [cursor=pointer]:
                - generic [ref=e223]: Create Account
              - generic [ref=e224]:
                - generic [ref=e225]: "Password Requirements:"
                - generic [ref=e226]:
                  - generic [ref=e227]: ✕ Be at least 8 characters long
                  - generic [ref=e228]: ✕ Contain at least one letter
                  - generic [ref=e229]: ✕ Contain at least one number
                  - generic [ref=e230]: ✕ Contain at least one special character
  - alert [ref=e231]: Create Account - GES
  - contentinfo [ref=e233]:
    - generic [ref=e236]:
      - link "Logo" [ref=e238] [cursor=pointer]:
        - /url: /
        - img "Logo" [ref=e239]
      - generic [ref=e240]:
        - generic [ref=e242]:
          - link "Privacy Policy" [ref=e243] [cursor=pointer]:
            - /url: https://www.ges.com/legal/privacy-policy/
          - link "|" [ref=e244] [cursor=pointer]:
            - /url: /
          - link "Terms of Use" [ref=e245] [cursor=pointer]:
            - /url: https://www.ges.com/legal/terms-and-conditions/
        - generic [ref=e246]:
          - generic [ref=e247]: © 2026 GES. All rights reserved.
          - link "Logistics Terms & Conditions" [ref=e248] [cursor=pointer]:
            - /url: https://www.ges.com/legal/logistics-terms-and-conditions/
      - button "Contact" [ref=e251] [cursor=pointer]:
        - link "Contact" [ref=e252]:
          - /url: https://insights.ges.com/ges-store-resources
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | test("Register — happy path", async ({ page }) => {
  4   |     // Step 1: Go to /login
  5   |     await page.goto('https://dev.ges.store/login');
  6   |     await page.waitForLoadState('domcontentloaded');
  7   | 
  8   |     // Step 2: you will land in Secure Access page, Enter the password to continue-> give this password FiP93&@1U94L and click continue button
  9   |     await expect(page.getByRole('heading', { name: /secure\s+access/i })).toBeVisible({ timeout: 15000 });
  10  |     await page.locator('input[type="password"]').first().fill('FiP93&@1U94L');
  11  |     await page.getByRole('button', { name: /continue|submit/i }).click();
  12  |     await expect(page.getByRole('heading', { name: /secure\s+access/i })).not.toBeVisible({ timeout: 15000 });
  13  | 
  14  |     // Step 3: click Create an Account which is a hyperlink placed under this text "Login below or "
  15  |     await page.getByRole('link', { name: /create\s+an?\s+account/i }).first().click();
  16  | 
  17  |     // Step 4: You will land in Find Your Company page,type lamb in Company Name field and click Search Button(this may take upto 2 mins)
  18  |     await page.getByLabel(/company\s+name/i).waitFor({ state: 'visible', timeout: 45000 }); // Wait for the Company Name field to be visible
  19  |     await page.getByLabel(/company\s+name/i).fill('lamb');
  20  |     await page.getByRole('button', { name: /search/i }).click();
  21  | 
  22  |     // Step 5: scroll down to see the search results and click the select button of the 1st result
  23  |     // The user mentioned "this may take upto 2 mins", so apply a long timeout to the next critical element.
  24  |     await page.getByRole('button', { name: /^select$/i }).first().waitFor({ state: 'visible', timeout: 120000 });
  25  |     await page.getByRole('button', { name: /^select$/i }).first().click();
  26  | 
  27  |     // Step 6: Click Confirm & Create Your Account button
  28  |     await page.getByRole('button', { name: /confirm\s+&\s+create\s+your\s+account/i }).click();
  29  | 
  30  |     // Step 7: Fill the Personal Information fields and Account Information section
  31  |     // Wait for the first personal information field to ensure the page is loaded
  32  |     await page.getByLabel(/first\s+name/i).waitFor({ state: 'visible', timeout: 45000 });
  33  | 
  34  |     // Personal Information fields
  35  |     await page.getByLabel(/first\s+name/i).fill('John');
  36  |     await page.getByLabel(/last\s+name/i).fill('Doe');
  37  | 
  38  |     const email = `john.doe+${Date.now()}@example.com`; // Generate a unique email to avoid conflicts on re-runs
  39  |     await page.getByLabel(/email\s+address/i).fill(email);
  40  |     await page.getByLabel(/email\s+confirmation/i).fill(email);
  41  |     await page.getByLabel(/phone\s+number/i).fill('5551234567');
  42  | 
  43  |     // Account Information section
  44  |     // Using a robust password that typically meets common requirements (uppercase, lowercase, number, symbol, length)
  45  |     const password = 'TestPa$$w0rd123!';
> 46  |     await page.getByLabel(/^password$/i).fill(password); // Using /^password$/ to target only the main password field
      |                                          ^ TimeoutError: locator.fill: Timeout 20000ms exceeded.
  47  |     await page.getByLabel(/confirm\s+password/i).fill(password);
  48  | 
  49  |     // Assuming "user type" is a combobox/dropdown. Selecting the first non-placeholder option (index 1).
  50  |     // If it's implemented as radio buttons, this locator would need adjustment (e.g., getByRole('radio', { name: /admin/i })).
  51  |     await page.getByRole('combobox', { name: /user\s+type/i }).selectOption({ index: 1 });
  52  | 
  53  |     await page.getByRole('button', { name: /create\s+account/i }).click();
  54  | 
  55  |     // Optional: Add an assertion here to verify successful account creation,
  56  |     // e.g., await expect(page.getByText(/account created successfully/i)).toBeVisible();
  57  | });
  58  | 
  59  | test('NEG: Incorrect Secure Access Password', async ({ page }) => {
  60  |     await page.goto('https://dev.ges.store/login');
  61  | 
  62  |     // Action: Enter an incorrect password for secure access
  63  |     await page.getByPlaceholder('Enter password').fill('wrong_password_123');
  64  |     await page.getByRole('button', { name: 'Continue' }).click();
  65  | 
  66  |     // Assertion: Expect an error message related to incorrect password
  67  |     await expect(page.locator('text=Incorrect password. Please try again.')).toBeVisible({ timeout: 15000 });
  68  | 
  69  |     // Assertion: Expect to remain on the login page
  70  |     await expect(page).toHaveURL('https://dev.ges.store/login', { timeout: 5000 });
  71  | });
  72  | 
  73  | test('NEG: Mismatched Email Confirmation', async ({ page }) => {
  74  |     // Setup: Go through secure access and company selection
  75  |     await page.goto('https://dev.ges.store/login');
  76  |     await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
  77  |     await page.getByRole('button', { name: 'Continue' }).click();
  78  |     await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
  79  |     await page.getByRole('link', { name: 'Create an Account' }).click();
  80  |     await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });
  81  | 
  82  |     await page.getByLabel('Company Name').fill('lamb');
  83  |     await page.getByRole('button', { name: 'Search' }).click();
  84  |     await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
  85  |     await page.getByRole('button', { name: 'Select' }).first().click();
  86  |     await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
  87  |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });
  88  | 
  89  |     // Action: Fill personal info with mismatched emails
  90  |     await page.getByLabel('First Name').fill('John');
  91  |     await page.getByLabel('Last Name').fill('Doe');
  92  |     await page.getByLabel('Email Address').fill('john.doe@test.com');
  93  |     await page.getByLabel('Email Confirmation').fill('john.different@test.com'); // Mismatched email
  94  |     await page.getByLabel('Phone Number').fill('555-123-4567');
  95  | 
  96  |     // Fill Account Information with valid data to isolate email error
  97  |     await page.getByLabel('Password', { exact: true }).fill('StrongP@ss123!');
  98  |     await page.getByLabel('Confirm Password', { exact: true }).fill('StrongP@ss123!');
  99  |     await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');
  100 | 
  101 |     // Click Create Account to trigger validation
  102 |     await page.getByRole('button', { name: 'Create Account' }).click();
  103 | 
  104 |     // Assertion: Expect email confirmation error message
  105 |     await expect(page.locator('text=Email addresses do not match')).toBeVisible({ timeout: 20000 });
  106 |     await expect(page.getByLabel('Email Confirmation')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  107 |     // Expect not to navigate away
  108 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
  109 | });
  110 | 
  111 | test('NEG: Mismatched Account Password Confirmation', async ({ page }) => {
  112 |     // Setup: Go through secure access and company selection
  113 |     await page.goto('https://dev.ges.store/login');
  114 |     await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
  115 |     await page.getByRole('button', { name: 'Continue' }).click();
  116 |     await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
  117 |     await page.getByRole('link', { name: 'Create an Account' }).click();
  118 |     await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });
  119 | 
  120 |     await page.getByLabel('Company Name').fill('lamb');
  121 |     await page.getByRole('button', { name: 'Search' }).click();
  122 |     await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
  123 |     await page.getByRole('button', { name: 'Select' }).first().click();
  124 |     await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
  125 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });
  126 | 
  127 |     // Action: Fill personal info (valid)
  128 |     await page.getByLabel('First Name').fill('Jane');
  129 |     await page.getByLabel('Last Name').fill('Doe');
  130 |     await page.getByLabel('Email Address').fill('jane.doe@test.com');
  131 |     await page.getByLabel('Email Confirmation').fill('jane.doe@test.com');
  132 |     await page.getByLabel('Phone Number').fill('555-987-6543');
  133 | 
  134 |     // Action: Fill Account Information with mismatched passwords
  135 |     await page.getByLabel('Password', { exact: true }).fill('SecureP@ss1!');
  136 |     await page.getByLabel('Confirm Password', { exact: true }).fill('MismatchedP@ss2!'); // Mismatched password
  137 |     await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');
  138 | 
  139 |     // Click Create Account to trigger validation
  140 |     await page.getByRole('button', { name: 'Create Account' }).click();
  141 | 
  142 |     // Assertion: Expect password confirmation error message
  143 |     await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 20000 });
  144 |     await expect(page.getByLabel('Confirm Password', { exact: true })).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  145 |     // Expect not to navigate away
  146 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
```