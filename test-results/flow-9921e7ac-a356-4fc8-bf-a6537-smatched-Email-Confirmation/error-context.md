# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow-9921e7ac-a356-4fc8-bf83-09237219c006-1777880635096.spec.js >> NEG: Mismatched Email Confirmation
- Location: temp-specs\flow-9921e7ac-a356-4fc8-bf83-09237219c006-1777880635096.spec.js:73:1

# Error details

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Enter password')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Secure Access" [level=2] [ref=e5]
      - paragraph [ref=e6]: Enter the password to continue
    - generic [ref=e7]:
      - textbox "••••••••" [ref=e8]
      - button "Continue" [ref=e9] [cursor=pointer]
  - alert [ref=e10]
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
  46  |     await page.getByLabel(/^password$/i).fill(password); // Using /^password$/ to target only the main password field
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
> 76  |     await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
      |                                                   ^ TimeoutError: locator.fill: Timeout 20000ms exceeded.
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
  147 | });
  148 | 
  149 | test('NEG: Account Password fails requirements', async ({ page }) => {
  150 |     // Setup: Go through secure access and company selection
  151 |     await page.goto('https://dev.ges.store/login');
  152 |     await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
  153 |     await page.getByRole('button', { name: 'Continue' }).click();
  154 |     await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
  155 |     await page.getByRole('link', { name: 'Create an Account' }).click();
  156 |     await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });
  157 | 
  158 |     await page.getByLabel('Company Name').fill('lamb');
  159 |     await page.getByRole('button', { name: 'Search' }).click();
  160 |     await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
  161 |     await page.getByRole('button', { name: 'Select' }).first().click();
  162 |     await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
  163 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });
  164 | 
  165 |     // Action: Fill personal info (valid)
  166 |     await page.getByLabel('First Name').fill('Peter');
  167 |     await page.getByLabel('Last Name').fill('Pan');
  168 |     await page.getByLabel('Email Address').fill('peter.pan@test.com');
  169 |     await page.getByLabel('Email Confirmation').fill('peter.pan@test.com');
  170 |     await page.getByLabel('Phone Number').fill('555-111-2222');
  171 | 
  172 |     // Action: Fill Account Information with a weak password that fails requirements
  173 |     await page.getByLabel('Password', { exact: true }).fill('short'); // Fails common length, complexity requirements
  174 |     await page.getByLabel('Confirm Password', { exact: true }).fill('short');
  175 |     await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');
  176 | 
```