const { test, expect } = require('@playwright/test');

test("Register — happy path", async ({ page }) => {
await page.goto("https://dev.ges.store", { waitUntil: 'domcontentloaded' });
  // TODO: Gemini could not generate steps ([GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash)
  // Set GEMINI_MODEL=gemini-2.5-flash and check https://ai.google.dev/gemini-api/docs/models
});


