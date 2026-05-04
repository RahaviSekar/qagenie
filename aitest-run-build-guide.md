# AITest.run — Step-by-Step Build Guide

> Build your own AI-powered test automation app with Node.js, Playwright, and Gemini AI

---

## What You Are Building

A web app with 3 modes:
1. **URL Scan** — paste a URL, AI crawls and tests all pages automatically
2. **Business Logic** — define critical flows in plain English, AI writes and runs the scripts
3. **Regression Suite** — every test run is saved and auto-triggered on code changes

**Tech stack:** Node.js · Express · Playwright · Gemini AI · React (frontend)

---

## Prerequisites — Install These First

```bash
node --version   # need v18 or above
npm --version    # need v9 or above
```

If not installed, download Node.js from https://nodejs.org

---

## Get Your Free Gemini API Key

1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key"**
4. Copy the key — you will use it in your `.env` file
5. No credit card required. Free tier gives you **1,500 requests/day**

---

## Phase 1 — Project Setup

### Prompt 1 — Scaffold the project

```
Create a new Node.js project called "aitest-run" with this structure:

aitest-run/
  backend/
    server.js
    routes/
      scan.js
      flows.js
      regression.js
    services/
      crawler.js
      aiService.js
      playwrightRunner.js
    data/
      flows.json
      regressionHistory.json
  frontend/
    index.html
    app.js
    styles.css
  package.json

Run: npm init -y
Install: npm install express cors playwright @google/generative-ai cheerio uuid dotenv
Install dev: npm install -D nodemon

Create a .env file with:
  GEMINI_API_KEY=your_gemini_key_here
  PORT=3000

Create a .gitignore that includes node_modules and .env
```

---

## Phase 2 — Gemini AI Integration

### Prompt 2 — Set up the Gemini AI service

```
In backend/services/aiService.js, set up the Gemini AI integration:

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

Write a function generateTestCases(crawledPageData, scope) that:
1. Takes crawled page structure as JSON input
2. Sends it to Gemini with this system instruction:
   "You are a QA engineer. Given a website structure, generate Playwright test cases.
    Return ONLY a JSON array of test objects. Each object must have:
    - id: string (e.g. TC-001)
    - name: string (short test name)
    - steps: array of strings (what to do)
    - assertion: string (what to verify)
    - priority: critical | high | medium
    - type: navigation | form | button | link | accessibility"
3. Parses the JSON from Gemini's response (strip any markdown code fences)
4. Returns the array of test cases

Also write generateEdgeCases(flowDescription) that:
- Takes a plain English flow description
- Sends it to Gemini asking for edge case scenarios
- Returns a JSON array: [{ name, steps[], assertion, why_important }]

And write convertFlowToScript(flow, baseUrl) that:
- Takes a flow object { name, steps[] } and the base URL
- Sends to Gemini asking it to convert plain English steps into Playwright JS code
- Returns the JavaScript code string ready to save as a .spec.js file

Use async/await throughout. Wrap all Gemini calls in try/catch.
```

---

## Phase 3 — Backend: URL Scanner

### Prompt 3 — Build the crawler service

```
In backend/services/crawler.js, write a Node.js module that:

1. Takes a URL as input
2. Uses Playwright to open the page in headless Chromium
3. Extracts all of these from the page:
   - All anchor tags (href, text)
   - All buttons (text, type, disabled state)
   - All input fields (type, name, placeholder, required)
   - All forms (action, method, field count)
   - Page title and meta description
   - All image tags (src, alt — flag broken ones)
4. Follows internal links up to 2 levels deep (same domain only)
5. Returns a JSON object:
   {
     url: "https://example.com",
     pages: [
       {
         url: "...",
         title: "...",
         buttons: [...],
         forms: [...],
         links: [...],
         images: [...]
       }
     ]
   }

Use async/await. Add a 10 second timeout per page. Handle errors gracefully.
```

### Prompt 4 — Build the Playwright test runner

```
In backend/services/playwrightRunner.js, write a module that:

1. Takes an array of test case objects (from aiService)
2. For each test case maps plain English steps to Playwright actions:
   "navigate to X"       -> page.goto(X)
   "click X"             -> page.click() using smart selector
   "fill X with Y"       -> page.fill()
   "check X is visible"  -> expect(page.locator()).toBeVisible()
   "check URL contains X"-> expect(page.url()).toContain()
3. Records result for each test:
   {
     testId: "TC-001",
     name: "...",
     passed: true/false,
     error: null or "error message",
     duration: 1200,
     screenshot: null or base64 string on failure
   }
4. Takes a screenshot on failure using page.screenshot()
5. Runs tests sequentially (not parallel) to avoid conflicts
6. Closes browser after all tests complete

Use try/catch per test so one failure does not stop others.
```

---

## Phase 4 — Backend: Business Logic Flows

### Prompt 5 — Flow storage and routes

```
In backend/data/flows.json create starter data:
{
  "flows": [
    {
      "id": "flow-001",
      "name": "User registration",
      "steps": [
        "Go to /register, fill name, email, password fields",
        "Click submit button",
        "Assert: redirected to /dashboard",
        "Try registering with same email again",
        "Assert: error message shown"
      ],
      "lastResult": null,
      "createdAt": "2024-01-01"
    }
  ]
}

In backend/routes/flows.js create Express routes:
  GET    /api/flows         - return all saved flows
  POST   /api/flows         - add new flow { name, steps[] }
  DELETE /api/flows/:id     - delete a flow
  POST   /api/flows/run     - run all flows, return results
  POST   /api/flows/:id/run - run a single flow

For running a flow:
1. Send the flow's plain English steps to Gemini via aiService.convertFlowToScript()
2. Save the generated Playwright JS to a temp .spec.js file
3. Execute it using Node child_process
4. Parse the output and return pass/fail per step
5. Save last result back to flows.json
```

---

## Phase 5 — Backend: Regression Suite

### Prompt 6 — Regression history tracking

```
In backend/routes/regression.js create:

POST /api/regression/run
  Accepts: { url, includeUrlScan: true, includeFlows: true }
  - Runs URL scan if includeUrlScan is true
  - Runs all saved flows if includeFlows is true
  - Combines all results into one run object saved to regressionHistory.json:
    {
      id: "run-001",
      timestamp: "ISO date",
      triggeredBy: "manual" | "code-push" | "ui-change",
      urlScanResults: [...],
      flowResults: [...],
      summary: { total, passed, failed, duration }
    }
  - Returns the full run object

GET /api/regression/history
  - Returns the last 10 regression runs

GET /api/regression/diff/:runId
  - Compares the run to the previous run
  - Returns: { newFailures: [...], newPasses: [...], unchanged: [...] }

Start backend/data/regressionHistory.json with: { "runs": [] }
```

### Prompt 7 — UI change detection

```
In backend/services/crawler.js add detectUIChanges(url, previousSnapshot):

1. Crawl the current state of the URL
2. Compare against previousSnapshot:
   - Check if buttons were added or removed
   - Check if forms changed (fields added or removed)
   - Check if page titles changed
   - Check if navigation links changed
3. Return:
   {
     hasChanges: true/false,
     changes: [
       { type: "button_removed", page: "/login", detail: "Submit text changed" }
     ]
   }

Add two new endpoints:

POST /api/regression/snapshot
  - Crawls the URL and saves current structure as a baseline snapshot in data/snapshots/
  - Returns the snapshot id

POST /api/regression/check-changes
  - Takes { url, snapshotId }
  - Detects changes since the snapshot
  - If changes found, automatically triggers POST /api/regression/run
```

---

## Phase 6 — Frontend

### Prompt 8 — Build the React single-page app

```
Create frontend/index.html as a single-page React app using CDN imports (no build tools needed).

The app has 3 tabs at the top:
  "Mode 1 — URL Scan"
  "Mode 2 — Business Logic"
  "Regression Suite"

--- Mode 1: URL Scan ---
- Text input for URL (placeholder: https://your-app.com)
- Checkboxes for scope: Navigation, Forms, Buttons, Links, Accessibility, Performance
- "Scan" button that calls POST /api/scan
- Live log panel showing real-time output
- Results table: test name | PASS/FAIL | detail | priority

--- Mode 2: Business Logic ---
- List of flows fetched from GET /api/flows
- Each flow shows: name, step count, last run status dot (green/red)
- Click a flow to expand and see its steps
- "Run all flows" button → POST /api/flows/run
- "Add new flow" button → shows a form:
    Flow name input
    Textarea for steps in plain English (one per line)
    Save button → POST /api/flows
- Results shown same as Mode 1 after running

--- Regression Suite ---
- List of past runs from GET /api/regression/history
- Each run shows: run number, date, pass/fail count, trigger reason
- "Run full regression" button → POST /api/regression/run
- Toggle switches:
    Auto-run on code push
    Auto-run on UI change detected

Dark theme: background #0f1117, accent blue #4f8ef7
Fonts: IBM Plex Mono for code and numbers, DM Sans for body text
```

### Prompt 9 — Live log streaming

```
Add real-time log streaming using Server-Sent Events (SSE):

In backend/server.js:
  GET /api/stream
  - Keeps the HTTP connection open
  - Pushes log events to all connected clients as they happen
  - Event format: { type: "log", message: "...", level: "info|step|error|success" }

In each service (crawler, aiService, playwrightRunner):
  - Use a shared EventEmitter to emit log events during execution
  - Example: emitter.emit('log', { message: '> scanning /login...', level: 'step' })

In the frontend:
  const es = new EventSource('/api/stream')
  es.onmessage = (e) => appendToLog(JSON.parse(e.data))

Style the log panel like a terminal:
  - Black background
  - Green text for success
  - Red for errors
  - Blue for steps
  - Gray for info
  - Monospace font, auto-scroll to bottom
```

---

## Phase 7 — Connect Everything

### Prompt 10 — Main server file

```
In backend/server.js write the Express server:

1. Load environment variables from .env
2. Set up CORS for localhost:3000
3. Serve frontend/ as static files
4. Mount all routes:
     /api/scan        → routes/scan.js
     /api/flows       → routes/flows.js
     /api/regression  → routes/regression.js
5. POST /api/scan route:
     - Accepts { url, scope: ['navigation', 'forms', ...] }
     - Calls crawler.crawl(url)
     - Calls aiService.generateTestCases(crawledData, scope)
     - Calls playwrightRunner.run(testCases, url)
     - Saves results to regression history
     - Returns { testCases, results, summary }
6. Global error handler returning { error: message }
7. Starts on PORT from .env (default 3000)

Add to package.json scripts:
  "dev": "nodemon backend/server.js"

Log to console on start: "AITest server running on http://localhost:3000"
```

### Prompt 11 — Run and verify everything

```
Help me run and verify the aitest-run app:

1. Create test-api.js that:
   - Tests POST /api/scan with url "https://example.com"
   - Tests GET /api/flows
   - Tests POST /api/flows with a sample flow
   - Tests POST /api/flows/run
   - Tests POST /api/regression/run
   - Prints PASS/FAIL for each endpoint

2. Install Playwright browsers:
   npx playwright install chromium

3. Start the server:
   npm run dev

4. Run the API tests:
   node test-api.js

5. Open http://localhost:3000 and verify all 3 tabs work correctly

Fix any errors by pasting the error message back into this chat.
```

---

## Phase 8 — Enhancements

### Prompt 12 — GitHub webhook auto-trigger

```
Add a webhook so the regression suite runs automatically on every code push:

In backend/server.js add:
POST /api/webhook/github
  - Validates the GitHub webhook signature using WEBHOOK_SECRET from .env
  - On push event to main branch: automatically calls POST /api/regression/run
  - If SLACK_WEBHOOK_URL is set in .env, sends a Slack alert:
    "Regression run #N: 12/14 passed. Failures: [test names]"

Add to .env:
  WEBHOOK_SECRET=your_github_webhook_secret
  SLACK_WEBHOOK_URL=https://hooks.slack.com/...   (optional)

In the README explain how to connect GitHub:
  1. Go to your repo Settings > Webhooks > Add webhook
  2. Payload URL: https://your-server.com/api/webhook/github
  3. Content type: application/json
  4. Secret: same as WEBHOOK_SECRET in .env
  5. Select: "Just the push event"
```

### Prompt 13 — Export test reports

```
Add a report export feature:

POST /api/regression/:runId/export?format=html|json|markdown

For HTML format generate a styled report with:
  - Summary at top: pass/fail counts, duration, date
  - Section for URL scan results
  - Section for business logic flow results
  - Green rows for passed tests, red rows for failed
  - Inline base64 screenshots for any failures

For Markdown: generate a .md file suitable for sharing on GitHub
For JSON: return the raw run data

Add a "Download Report" button in the Regression Suite tab
that calls this endpoint and triggers a file download in the browser.
```

---

## Final Project Structure

```
aitest-run/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── scan.js
│   │   ├── flows.js
│   │   └── regression.js
│   ├── services/
│   │   ├── crawler.js            ← Playwright page crawler
│   │   ├── aiService.js          ← Gemini AI integration
│   │   └── playwrightRunner.js   ← Test executor
│   └── data/
│       ├── flows.json            ← Saved business logic flows
│       ├── snapshots/            ← UI baseline snapshots
│       └── regressionHistory.json
├── frontend/
│   ├── index.html                ← React single page app
│   ├── app.js
│   └── styles.css
├── .env                          ← API keys (never commit this)
├── .gitignore
├── package.json
└── README.md
```

---

## Environment Variables

```
GEMINI_API_KEY=AIza...            # from aistudio.google.com (free)
PORT=3000
WEBHOOK_SECRET=your_secret        # optional: for GitHub webhook
SLACK_WEBHOOK_URL=https://...     # optional: for Slack alerts
```

---

## Gemini AI Quick Reference

| What you need | Gemini model to use | Free limit |
|---|---|---|
| Generate test cases | gemini-2.0-flash | 1,500 req/day |
| Convert flow to script | gemini-2.0-flash | 1,500 req/day |
| Detect edge cases | gemini-2.0-flash | 1,500 req/day |

```javascript
// How every Gemini call looks in your aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

const result = await model.generateContent(yourPrompt);
const text = result.response.text();
const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
```

---

## Key Tips

- Get your free Gemini API key at **aistudio.google.com** — no card needed
- Run `npx playwright install chromium` before the first test run
- Do the prompts in order — each one builds on the previous
- Test with simple public sites first (example.com, wikipedia.org)
- For sites that need login, add test credentials to your flow steps
- If any prompt fails, paste the error message back and ask Claude to fix it
- Strip markdown code fences (` ```json `) before calling JSON.parse on Gemini responses
