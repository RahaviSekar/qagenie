const mcpBrowser = require("../../services/mcpBrowser");
const { resolveNavigationTarget } = require("../../services/flowBaseUrl");
const { stringProp } = require("../toolSchema");

/** Browser MCP server — live Playwright session exposed as tools (see → act). */
function createBrowserTools(session) {
  return [
    {
      name: "browser_navigate",
      description: "Open a URL or site path. Use full https URL or path like /login (requires baseUrl in session).",
      inputSchema: {
        type: "object",
        properties: { url: stringProp("URL or path to open") },
        required: ["url"],
      },
      async handler({ url }) {
        const target = resolveNavigationTarget(url, session.baseUrl);
        const screenshot = await mcpBrowser.navigate(target, { baseUrl: session.baseUrl });
        session.lastScreenshot = screenshot;
        session.lastUrl = await mcpBrowser.getCurrentUrl();
        return { ok: true, url: session.lastUrl, screenshot };
      },
    },
    {
      name: "browser_snapshot",
      description: "Capture a PNG screenshot of the current page for visual analysis.",
      inputSchema: { type: "object", properties: {} },
      async handler() {
        const screenshot = await mcpBrowser.screenshot();
        session.lastScreenshot = screenshot;
        session.lastUrl = await mcpBrowser.getCurrentUrl();
        return { ok: true, url: session.lastUrl, screenshot };
      },
    },
    {
      name: "browser_click",
      description: "Click a button, link, or control by visible label text (case-insensitive).",
      inputSchema: {
        type: "object",
        properties: { label: stringProp("Visible text on the control, e.g. Continue or Create an Account") },
        required: ["label"],
      },
      async handler({ label }) {
        const r = await mcpBrowser.click(label);
        if (r.screenshot) session.lastScreenshot = r.screenshot;
        session.lastUrl = await mcpBrowser.getCurrentUrl();
        return { ok: r.success, error: r.error || null, url: session.lastUrl, screenshot: r.screenshot || session.lastScreenshot };
      },
    },
    {
      name: "browser_fill",
      description:
        "Type into a field. For password / Secure Access gates use fieldDescription 'password' and the actual secret as value.",
      inputSchema: {
        type: "object",
        properties: {
          fieldDescription: stringProp("Label, placeholder, or 'password' for password inputs"),
          value: stringProp("Text to type"),
        },
        required: ["fieldDescription", "value"],
      },
      async handler({ fieldDescription, value }) {
        const r = await mcpBrowser.fill(fieldDescription, value);
        if (r.screenshot) session.lastScreenshot = r.screenshot;
        session.lastUrl = await mcpBrowser.getCurrentUrl();
        return { ok: r.success, error: r.error || null, url: session.lastUrl, screenshot: r.screenshot || session.lastScreenshot };
      },
    },
    {
      name: "browser_get_url",
      description: "Return the current page URL from the address bar.",
      inputSchema: { type: "object", properties: {} },
      async handler() {
        session.lastUrl = await mcpBrowser.getCurrentUrl();
        return { ok: true, url: session.lastUrl };
      },
    },
    {
      name: "browser_get_visible_text",
      description: "Return visible text on the page (truncated) for quick context without vision.",
      inputSchema: { type: "object", properties: {} },
      async handler() {
        const text = await mcpBrowser.getVisibleText();
        return { ok: true, text: String(text || "").slice(0, 8000), url: await mcpBrowser.getCurrentUrl() };
      },
    },
  ];
}

module.exports = { createBrowserTools };
