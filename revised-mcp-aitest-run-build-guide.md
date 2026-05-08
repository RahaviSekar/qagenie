# AITest.run — Step-by-Step Build Guide (MCP + Agentic Edition)

> Build your own AI-powered test automation app with Node.js, Playwright MCP, and Gemini AI

---

## Why Your Current Version Gives False Failures

The current setup works like this:
1. Crawler takes an HTML snapshot of the page
2. Gemini reads the HTML and **guesses** what selectors to use
3. Playwright tries those guessed selectors — and fails

Gemini never actually **sees** the page. It's like asking someone to drive a car by reading the car manual — without ever sitting in it.

**MCP fixes this.** With Playwright MCP, Gemini gets a real live screenshot of the browser at every step. It can see exactly what's on screen, click the right things, and verify results with its own eyes.

---

## What Changes With MCP

| Before (broken) | After (MCP agentic) |
|---|---|
| Gemini reads raw HTML | Gemini sees live screenshots |
| Guesses CSS selectors | Clicks by what it visually sees |
| Scripts fail on real sites | Works on any real site |
| One-shot test generation | AI loops: see → act → verify |

---

## What You Are Building (Updated Stack)

A web app with 3 modes:
1. **URL Scan** — AI opens a real browser, explores every page visually, tests automatically
2. **Business Logic** — define flows in plain English, AI navigates the browser step by step
3. **Regression Suite** — every run saved, auto-triggered on code or UI changes

**Tech stack:** Node.js · Express · Playwright MCP · Gemini AI · Next.js · Tailwind CSS

---

## Prerequisites

```bash
node --version   # need v18 or above
npm --version    # need v9 or above
```

---

## Get Your Free Gemini API Key

1. Go to **https://aistudio.google.com**
2. Sign in with Google → Click **"Get API Key"** → **"Create API key"**
3. Copy the key for your `.env` file
4. Free tier: **1,500 requests/day**, no credit card needed

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
      mcpBrowser.js       ← NEW: controls the real browser via MCP
      aiService.js        ← Gemini AI (now gets screenshots, not HTML)
      agentRunner.js      ← NEW: agentic loop (see → act → verify)
    data/
      flows.json
      regressionHistory.json
      snapshots/
  frontend/  (Next.js app)
  package.json

Run: npm init -y

Install backend:
  npm install express cors @google/generative-ai uuid dotenv

Install Playwright MCP:
  npm install @playwright/mcp
  npx playwright install chromium

Install dev:
  npm install -D nodemon

Create .env:
  GEMINI_API_KEY=your_gemini_key_here
  PORT=3000

Create .gitignore including node_modules and .env
```

---

## Phase 2 — MCP Browser Service (The Key Change)

### Prompt 2 — Build the MCP browser controller

```
In backend/services/mcpBrowser.js, create a module that controls
a real Chromium browser using Playwright MCP:

const { chromium } = require('@playwright/test');

Create a class MCPBrowser with these methods:

async launch()
  - Launches a real Chromium browser (headless: false for debugging, true for production)
  - Opens a new page
  - Stores browser and page references

async screenshot()
  - Takes a full-page screenshot
  - Returns it as a base64 string
  - This is what Gemini will SEE at each step

async navigate(url)
  - Navigates to the given URL
  - Waits for the page to fully load (networkidle)
  - Returns a screenshot after loading

async getPageInfo()
  - Returns: { url, title, screenshot (base64) }
  - This replaces the old HTML crawler entirely

async click(description)
  - Gemini will pass a plain English description like "the Login button"
  - Use page.getByRole() or page.getByText() to find and click it
  - Return success/fail + new screenshot after click

async fill(fieldDescription, value)
  - Finds input by label/placeholder description
  - Types the value into it
  - Returns new screenshot

async getVisibleText()
  - Returns all visible text on the current page
  - Used by Gemini to verify assertions

async close()
  - Closes browser cleanly

Export a singleton instance: module.exports = new MCPBrowser()
```

---

## Phase 3 — Gemini AI With Vision (Screenshot-Based)

### Prompt 3 — Update Gemini to use screenshots not HTML

```
In backend/services/aiService.js, rewrite to use Gemini Vision:

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

Use model: "gemini-2.0-flash" (supports both text and images)

Write these functions:

1. analyzePageFromScreenshot(screenshotBase64, url)
   - Sends the screenshot IMAGE to Gemini (not HTML)
   - Prompt: "You are a QA engineer looking at a screenshot of a webpage.
     Identify all interactive elements: buttons, forms, links, navigation.
     Return JSON array of test cases. Each test case:
     { id, name, steps[], assertion, priority: critical|high|medium,
       element_description: 'plain English description of what to click/fill' }"
   - Parse and return the JSON array

2. decideNextAction(screenshotBase64, goal, previousActions)
   - This is the AGENTIC function — called in a loop
   - Sends current screenshot + the goal + history of what was already done
   - Prompt: "You are testing a website. Current goal: {goal}
     Previous actions taken: {previousActions}
     Look at this screenshot. What is the SINGLE next action to take?
     Return JSON: { action: 'click'|'fill'|'navigate'|'assert'|'done',
                    target: 'plain English description of element',
                    value: 'text to type if filling',
                    assertion: 'what to verify if asserting',
                    reasoning: 'why this action' }"
   - Parse and return the action object

3. verifyAssertion(screenshotBase64, assertion)
   - Sends screenshot + assertion text to Gemini
   - Prompt: "Look at this screenshot. Is this assertion true or false?
     Assertion: {assertion}
     Return JSON: { passed: true|false, reason: 'explanation' }"
   - Returns { passed, reason }

4. generateEdgeCases(flowDescription)
   - Same as before but now returns edge cases relevant to visual UI

Always send screenshots as:
  { inlineData: { mimeType: 'image/png', data: screenshotBase64 } }
```

---

## Phase 4 — The Agentic Loop (See → Act → Verify)

### Prompt 4 — Build the agent runner

```
In backend/services/agentRunner.js, build the agentic test runner:

const mcpBrowser = require('./mcpBrowser');
const aiService = require('./aiService');

This is the core engine. It runs tests by looping:
  1. Take screenshot
  2. Ask Gemini what to do next
  3. Execute the action in the real browser
  4. Repeat until goal is achieved or max steps reached

Write these functions:

async runUrlScan(url)
  - Launch browser, navigate to url
  - Take screenshot, send to Gemini → get list of test cases
  - For each test case, call runSingleTest(testCase, url)
  - Return all results
  - Close browser

async runSingleTest(testCase, url)
  - Navigate to url
  - Run the agentic loop (max 10 steps):
      LOOP:
        screenshot = await mcpBrowser.screenshot()
        action = await aiService.decideNextAction(screenshot, testCase.goal, history)
        if action.action === 'done': break
        if action.action === 'click': await mcpBrowser.click(action.target)
        if action.action === 'fill': await mcpBrowser.fill(action.target, action.value)
        if action.action === 'navigate': await mcpBrowser.navigate(action.target)
        if action.action === 'assert':
          finalScreenshot = await mcpBrowser.screenshot()
          result = await aiService.verifyAssertion(finalScreenshot, action.assertion)
          record pass/fail
        history.push(action)
  - Return: { testId, name, passed, steps_taken, screenshots[], error }

async runFlow(flow, baseUrl)
  - Takes a business logic flow { name, steps[] }
  - Converts each plain English step into a goal for the agentic loop
  - Runs runSingleTest for each step sequentially
  - Returns combined pass/fail result

Emit log events at each step so the frontend can stream them live.
```

---

## Phase 5 — Backend Routes (Updated)

### Prompt 5 — Update scan route to use agent

```
In backend/routes/scan.js, update the scan endpoint:

POST /api/scan
  Accepts: { url, scope }
  1. Emit log: "Launching browser..."
  2. Call agentRunner.runUrlScan(url)
     - This opens a REAL browser and navigates to the URL
     - Gemini sees actual screenshots, not guessed HTML
  3. Emit progress logs as each test runs
  4. Save results to regressionHistory.json
  5. Return: { results, summary: { total, passed, failed, duration } }

The key difference: no more HTML crawling, no more guessed selectors.
The browser IS the test runner. Gemini IS the tester.
```

### Prompt 6 — Update flows route to use agent

```
In backend/routes/flows.js update the flow runner:

POST /api/flows/run
  1. Load all flows from flows.json
  2. Launch browser ONCE (reuse for all flows)
  3. For each flow:
     - Call agentRunner.runFlow(flow, baseUrl)
     - Gemini navigates the browser step by step
     - After each step: screenshot → Gemini verifies → pass/fail recorded
  4. Close browser after all flows complete
  5. Save lastResult to flows.json
  6. Return all results

POST /api/flows/:id/run
  - Same but for a single flow

Keep all other routes the same (GET, POST to add, DELETE).
```

### Prompt 7 — Regression suite with change detection

```
In backend/routes/regression.js:

POST /api/regression/run
  Accepts: { url, includeUrlScan, includeFlows }
  - Launches ONE browser for the entire regression run
  - Runs URL scan tests if includeUrlScan is true
  - Runs all business logic flows if includeFlows is true
  - Saves combined run to regressionHistory.json:
    { id, timestamp, triggeredBy, urlScanResults, flowResults, summary }
  - Returns full run

GET /api/regression/history
  Returns last 10 runs

POST /api/regression/snapshot
  - Opens browser, takes screenshots of all key pages
  - Saves screenshots + page structure as baseline in data/snapshots/
  - Returns snapshotId

POST /api/regression/check-changes
  Accepts: { url, snapshotId }
  - Opens browser, takes fresh screenshots
  - Sends BOTH old and new screenshots to Gemini:
    "Compare these two screenshots. What has visually changed?"
  - Gemini returns list of visual differences
  - If changes found, auto-triggers regression run
  - Returns: { hasChanges, changes[], regressionTriggered }
```

---

## Phase 6 — Main Server

### Prompt 8 — Main server with SSE streaming

```
In backend/server.js:

1. Load .env, setup CORS
2. Mount routes: /api/scan, /api/flows, /api/regression
3. Add Server-Sent Events for live log streaming:
   GET /api/stream
   - Keeps connection open
   - All agentRunner log events push here in real time
   - Format: { type: 'log', message, level: 'info|step|success|error',
               screenshot: base64 or null }

4. Global error handler
5. Start on PORT 3000

The SSE stream should also push screenshots as they are taken,
so the frontend can show a live preview of what the browser is doing.

Add to package.json: "dev": "nodemon backend/server.js"
```

---

## Phase 7 — Next.js Frontend

### Prompt 9 — Build the Next.js app

```
Set up the frontend as a Next.js app with Tailwind CSS:

npx create-next-app@latest frontend --tailwind --app
cd frontend && npm run dev

Create these pages/components:

app/page.tsx — Main layout with 3 tabs:
  Tab 1: URL Scan
  Tab 2: Business Logic Flows
  Tab 3: Regression Suite

components/UrlScanPanel.tsx
  - URL input + scope checkboxes
  - "Run scan" button → POST to backend /api/scan
  - Connect to /api/stream via EventSource
  - Show live log panel (terminal style, dark bg)
  - Show live browser screenshot panel (updates as AI tests)
  - Results table below: test name | PASS/FAIL | steps taken | duration

components/FlowsPanel.tsx
  - List of flows from GET /api/flows
  - Each flow: name, step count, last result dot (green/red/gray)
  - Click to expand steps
  - "Run all" button, "Add new flow" button
  - Add flow form: name input + steps textarea (plain English)
  - Live results same as URL scan panel

components/RegressionPanel.tsx
  - Past runs list from GET /api/regression/history
  - Each run: number, date, pass/fail, trigger reason
  - "Run full regression" button
  - "Take snapshot" button (saves visual baseline)
  - "Check for changes" button (compares to baseline)
  - Toggle: auto-run on code push, auto-run on UI change

components/LiveBrowser.tsx
  - Shows the live screenshot stream from /api/stream
  - Updates every time a new screenshot event arrives
  - Looks like a mini browser window with the current page visible
  - Shows current action being taken below the screenshot

Style: dark theme bg-gray-950, accent blue-500, mono font for logs
```

---

## Phase 8 — Enhancements

### Prompt 10 — GitHub webhook

```
Add POST /api/webhook/github in server.js:
  - Validates GitHub webhook signature (WEBHOOK_SECRET from .env)
  - On push to main: auto-triggers POST /api/regression/run
  - Sends Slack alert if SLACK_WEBHOOK_URL set:
    "Regression run #N: 12/14 passed. Failures: [names]"

Add to .env:
  WEBHOOK_SECRET=your_secret
  SLACK_WEBHOOK_URL=https://hooks.slack.com/... (optional)
```

### Prompt 11 — Export reports

```
Add POST /api/regression/:runId/export?format=html|json|markdown

HTML report:
  - Summary: pass/fail counts, duration, date
  - For each test: name, status, steps taken, screenshot of final state
  - Green/red row colors
  - Actual screenshots embedded (base64) — shows what Gemini saw

Markdown: suitable for GitHub, includes screenshot links
JSON: raw run data

Add "Download Report" button in Regression tab.
```

### Prompt 12 — Run and verify

```
Verify the full app works:

1. Start backend: npm run dev (in /backend)
2. Start frontend: npm run dev (in /frontend)
3. Open http://localhost:3000

Test Mode 1:
  - Enter: https://google.com
  - Click Scan
  - You should see the LIVE browser screenshot updating in the UI
  - Gemini should correctly identify the search bar, buttons, links
  - Results should show accurate PASS/FAIL (no more false failures)

Test Mode 2:
  - Add a flow: "Go to google.com, type 'playwright' in search, press enter,
    assert search results page loads"
  - Click Run — watch AI navigate the real browser step by step

If any step fails, paste the error back and ask Claude to fix it.
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
│   │   ├── mcpBrowser.js       ← Real browser controller (Playwright MCP)
│   │   ├── aiService.js        ← Gemini with vision (reads screenshots)
│   │   └── agentRunner.js      ← Agentic loop: see → act → verify
│   └── data/
│       ├── flows.json
│       ├── snapshots/          ← Visual baselines for regression
│       └── regressionHistory.json
├── frontend/                   ← Next.js + Tailwind
│   ├── app/
│   │   └── page.tsx
│   └── components/
│       ├── UrlScanPanel.tsx
│       ├── FlowsPanel.tsx
│       ├── RegressionPanel.tsx
│       └── LiveBrowser.tsx     ← Shows live screenshot stream
├── .env
├── .gitignore
└── package.json
```

---

## Environment Variables

```
GEMINI_API_KEY=AIza...            # from aistudio.google.com (free)
PORT=3000
WEBHOOK_SECRET=your_secret        # optional: GitHub webhook
SLACK_WEBHOOK_URL=https://...     # optional: Slack alerts
```

---

## Gemini Vision Quick Reference

```javascript
// How to send a screenshot to Gemini (the key change)
const result = await model.generateContent([
  {
    inlineData: {
      mimeType: "image/png",
      data: screenshotBase64   // real browser screenshot
    }
  },
  { text: "What do you see on this page? What should I test?" }
]);
const response = result.response.text();
const parsed = JSON.parse(response.replace(/```json|```/g, "").trim());
```

---

## Key Tips

- **Run Mode 1 on google.com first** — if you see the live screenshot updating and results are accurate, the MCP setup is working
- The `LiveBrowser` component is the visual proof — you can literally watch AI navigate
- Set `headless: false` in mcpBrowser.js while debugging so you can see the browser open on your screen
- Each agentic loop is max 10 steps — increase this for complex flows
- Gemini Vision is still within the free 1,500 requests/day limit
- If Gemini returns invalid JSON, the `.replace(/```json|```/g, "").trim()` strips markdown fences before parsing
- For login-protected pages, add credentials as environment variables and reference them in your flow steps

