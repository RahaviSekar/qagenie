const { chromium } = require("playwright-core");
const { resolveNavigationTarget } = require("./flowBaseUrl");

class MCPBrowser {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async launch() {
    if (this.browser && this.page) return;
    const headless =
      String(process.env.MCP_HEADLESS || "true").toLowerCase() !== "false";
    const chromiumMin = require("@sparticuz/chromium-min");
    const executablePath =
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (await chromiumMin.executablePath(
        process.env.SPARTICUZ_CHROMIUM_URL ||
          "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar",
      ));
    this.browser = await chromium.launch({
      headless,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(20_000);
  }

  async ensurePage() {
    if (!this.page) await this.launch();
    return this.page;
  }

  async screenshot() {
    const page = await this.ensurePage();
    const buf = await page.screenshot({ type: "png", fullPage: true });
    return buf.toString("base64");
  }

  async navigate(url, options = {}) {
    const page = await this.ensurePage();
    const target = resolveNavigationTarget(url, options.baseUrl);
    await page.goto(target, { waitUntil: "networkidle", timeout: 30_000 });
    return this.screenshot();
  }

  async getCurrentUrl() {
    const page = await this.ensurePage();
    return page.url();
  }

  async getPageInfo() {
    const page = await this.ensurePage();
    return {
      url: page.url(),
      title: await page.title(),
      screenshot: await this.screenshot(),
    };
  }

  async click(description) {
    const page = await this.ensurePage();
    const q = String(description || "").trim();
    if (!q) throw new Error("click description is required");
    // Extract core text by removing common suffixes
    const core = q.replace(/\s+(button|link|icon)$/i, "");
    const roleRegex = new RegExp(
      core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    const candidates = [
      () => page.getByRole("button", { name: roleRegex }).first(),
      () => page.getByRole("link", { name: roleRegex }).first(),
      () => page.locator(`button:has-text("${core}")`).first(),
      () => page.locator(`a:has-text("${core}")`).first(),
      () => page.getByText(core, { exact: false }).first(),
      () => page.getByAltText(roleRegex).first(), // for icons
      () => page.getByTitle(roleRegex).first(), // for tooltips
      // Also try the full description
      () => page.getByText(q, { exact: false }).first(),
    ];

    let lastError = null;
    for (const getter of candidates) {
      try {
        const el = getter();
        await el.waitFor({ state: "visible", timeout: 10000 });
        await el.click({ timeout: 8000 });
        return { success: true, screenshot: await this.screenshot() };
      } catch (e) {
        lastError = e;
      }
    }

    return {
      success: false,
      error: (lastError && lastError.message) || `Could not click: ${q}`,
      screenshot: await this.screenshot(),
    };
  }

  async fill(fieldDescription, value) {
    const page = await this.ensurePage();
    const field = String(fieldDescription || "").trim();
    const text = value == null ? "" : String(value);
    if (!field) throw new Error("fieldDescription is required");
    const re = new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const looksLikePassword =
      /password|secure\s*access/i.test(field) ||
      (text.length > 0 && !/\s/.test(text) && text.length >= 6);

    const candidates = [
      ...(looksLikePassword
        ? [
            () => page.locator('input[type="password"]').first(),
            () => page.getByLabel(/password/i).first(),
            () => page.getByPlaceholder(/password/i).first(),
          ]
        : []),
      () => page.getByLabel(re).first(),
      () => page.getByPlaceholder(re).first(),
      () => page.locator(`input[placeholder*="${field}"]`).first(),
      () => page.locator(`input[name*="${field}"]`).first(),
      () => page.getByRole("textbox", { name: re }).first(),
    ];

    let lastError = null;
    for (const getter of candidates) {
      try {
        const el = getter();
        await el.waitFor({ state: "visible", timeout: 10000 });
        await el.fill(text, { timeout: 8000 });
        return { success: true, screenshot: await this.screenshot() };
      } catch (e) {
        lastError = e;
      }
    }

    return {
      success: false,
      error:
        (lastError && lastError.message) || `Could not fill field: ${field}`,
      screenshot: await this.screenshot(),
    };
  }

  async getVisibleText() {
    const page = await this.ensurePage();
    return page.evaluate(() => {
      const body = document.body;
      return body ? (body.innerText || "").replace(/\s+/g, " ").trim() : "";
    });
  }

  async close() {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
    }
  }
}

module.exports = new MCPBrowser();
