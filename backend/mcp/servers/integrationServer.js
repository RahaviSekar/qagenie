const { stringProp } = require("../toolSchema");

/**
 * Integration MCP server — HTTP and future external MCP bridges.
 * Set MCP_HTTP_ALLOWLIST=comma-separated hostnames to enable http_fetch.
 */
function createIntegrationTools() {
  return [
    {
      name: "http_fetch",
      description:
        "GET a URL (API health check, webhook probe). Only hosts in MCP_HTTP_ALLOWLIST env are allowed.",
      inputSchema: {
        type: "object",
        properties: { url: stringProp("HTTPS URL to fetch") },
        required: ["url"],
      },
      async handler({ url }) {
        const allow = (process.env.MCP_HTTP_ALLOWLIST || "")
          .split(",")
          .map((h) => h.trim().toLowerCase())
          .filter(Boolean);
        let host;
        try {
          host = new URL(url).hostname.toLowerCase();
        } catch (e) {
          return { ok: false, error: `Invalid URL: ${e.message}` };
        }
        if (!allow.length) {
          return {
            ok: false,
            error: "http_fetch disabled. Set MCP_HTTP_ALLOWLIST=api.example.com,hooks.example.com in .env",
          };
        }
        if (!allow.some((a) => host === a || host.endsWith(`.${a}`))) {
          return { ok: false, error: `Host ${host} not in MCP_HTTP_ALLOWLIST` };
        }
        const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(15_000) });
        const text = await res.text();
        return {
          ok: res.ok,
          status: res.status,
          bodyPreview: text.slice(0, 4000),
        };
      },
    },
  ];
}

module.exports = { createIntegrationTools };
