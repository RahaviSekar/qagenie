# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow-9921e7ac-a356-4fc8-bf83-09237219c006-1777880635096.spec.js >> NEG: Empty Required Personal Information Fields
- Location: temp-specs\flow-9921e7ac-a356-4fc8-bf83-09237219c006-1777880635096.spec.js:187:1

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
  177 |     // Click Create Account to trigger validation
  178 |     await page.getByRole('button', { name: 'Create Account' }).click();
  179 | 
  180 |     // Assertion: Expect password requirements error message
  181 |     await expect(page.locator('text=Password does not meet requirements')).toBeVisible({ timeout: 20000 });
  182 |     await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  183 |     // Expect not to navigate away
  184 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
  185 | });
  186 | 
  187 | test('NEG: Empty Required Personal Information Fields', async ({ page }) => {
  188 |     // Setup: Go through secure access and company selection
  189 |     await page.goto('https://dev.ges.store/login');
> 190 |     await page.getByPlaceholder('Enter password').fill('FiP93&@1U94L');
      |                                                   ^ TimeoutError: locator.fill: Timeout 20000ms exceeded.
  191 |     await page.getByRole('button', { name: 'Continue' }).click();
  192 |     await expect(page.getByRole('link', { name: 'Create an Account' })).toBeVisible({ timeout: 15000 });
  193 |     await page.getByRole('link', { name: 'Create an Account' }).click();
  194 |     await expect(page).toHaveURL(/find-your-company/, { timeout: 15000 });
  195 | 
  196 |     await page.getByLabel('Company Name').fill('lamb');
  197 |     await page.getByRole('button', { name: 'Search' }).click();
  198 |     await page.locator('.table-row-group').first().waitFor({ state: 'visible', timeout: 30000 });
  199 |     await page.getByRole('button', { name: 'Select' }).first().click();
  200 |     await page.getByRole('button', { name: 'Confirm & Create Your Account' }).click();
  201 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 15000 });
  202 | 
  203 |     // Action: Leave personal info fields empty
  204 |     // Explicitly clear any pre-filled values if they exist
  205 |     await page.getByLabel('First Name').fill('');
  206 |     await page.getByLabel('Last Name').fill('');
  207 |     await page.getByLabel('Email Address').fill('');
  208 |     await page.getByLabel('Email Confirmation').fill('');
  209 |     await page.getByLabel('Phone Number').fill('');
  210 | 
  211 |     // Fill Account Information to ensure the "Create Account" button is clickable/enabled (if disabled by other factors)
  212 |     await page.getByLabel('Password', { exact: true }).fill('StrongP@ss123!');
  213 |     await page.getByLabel('Confirm Password', { exact: true }).fill('StrongP@ss123!');
  214 |     await page.getByRole('combobox', { name: 'User Type' }).selectOption('Applicant');
  215 | 
  216 |     // Click Create Account to trigger validation
  217 |     await page.getByRole('button', { name: 'Create Account' }).click();
  218 | 
  219 |     // Assertion: Expect validation messages for empty required fields
  220 |     await expect(page.locator('text=This field is required').nth(0)).toBeVisible({ timeout: 15000 });
  221 |     await expect(page.locator('text=This field is required').nth(1)).toBeVisible({ timeout: 15000 });
  222 |     await expect(page.locator('text=This field is required').nth(2)).toBeVisible({ timeout: 15000 });
  223 |     await expect(page.locator('text=This field is required').nth(3)).toBeVisible({ timeout: 15000 });
  224 |     await expect(page.locator('text=This field is required').nth(4)).toBeVisible({ timeout: 15000 });
  225 | 
  226 |     // Also check aria-invalid for these fields
  227 |     await expect(page.getByLabel('First Name')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  228 |     await expect(page.getByLabel('Last Name')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  229 |     await expect(page.getByLabel('Email Address')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  230 |     await expect(page.getByLabel('Email Confirmation')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  231 |     await expect(page.getByLabel('Phone Number')).toHaveAttribute('aria-invalid', 'true', { timeout: 5000 });
  232 | 
  233 |     // Expect not to navigate away
  234 |     await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 });
  235 | });
  236 | 
```