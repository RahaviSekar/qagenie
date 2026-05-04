/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: "./temp-specs",
  timeout: 120_000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    trace: "off",
    actionTimeout: 20_000,
    navigationTimeout: 35_000,
  },
};
