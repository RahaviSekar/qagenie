/** @type {import('@playwright/test').PlaywrightTestConfig} */
const headed =
  String(process.env.PLAYWRIGHT_HEADED || "").toLowerCase() === "true";

module.exports = {
  testDir: "./temp-specs",
  timeout: 180_000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    headless: !headed,
    browserName: "chromium",
    trace: "off",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    locale: "en-US",
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
   launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    },
  },
};
