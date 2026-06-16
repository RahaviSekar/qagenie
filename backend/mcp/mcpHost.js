const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { createBrowserTools } = require("./servers/browserServer");
const { createPlaywrightTools } = require("./servers/playwrightServer");
const { createIntegrationTools } = require("./servers/integrationServer");
const mcpBrowser = require("../services/mcpBrowser");
const { log } = require("../services/logEmitter");

/**
 * QA Genie MCP Host — registers internal tool servers + optional external MCP servers.
 */
class McpHost {
  constructor() {
    /** @type {Map<string, import('./toolSchema').McpToolDef>} */
    this.tools = new Map();
    this.session = { baseUrl: null, lastScreenshot: null, lastUrl: null };
    this.externalClients = [];
    this.browserActive = false;
  }

  registerTools(toolDefs, namespace = "") {
    for (const t of toolDefs) {
      const key = namespace ? `${namespace}/${t.name}` : t.name;
      this.tools.set(key, { ...t, name: key });
    }
  }

  reset() {
    this.tools.clear();
    this.session = { baseUrl: null, lastScreenshot: null, lastUrl: null };
    this.browserActive = false;
  }

  registerBuiltinServers(baseUrl) {
    this.session.baseUrl = baseUrl;
    this.registerTools(createBrowserTools(this.session), "");
    this.registerTools(createPlaywrightTools(), "");
    this.registerTools(createIntegrationTools(), "");
  }

  listTools() {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  async callTool(name, args = {}) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown MCP tool: ${name}`);
    log(`MCP tool → ${name}`, "step");
    const result = await tool.handler(args, this.session);
    return result;
  }

  async startBrowserSession(baseUrl) {
    await mcpBrowser.launch();
    this.browserActive = true;
    this.session.baseUrl = baseUrl;
    return this;
  }

  async endBrowserSession() {
    if (this.browserActive) {
      await mcpBrowser.close();
      this.browserActive = false;
    }
    for (const c of this.externalClients) {
      try {
        await c.close();
      } catch (_) {}
    }
    this.externalClients = [];
  }

  /**
   * Connect optional external MCP servers (stdio), e.g. Playwright MCP, Jira, custom APIs.
   * MCP_EXTERNAL_SERVERS='[{"command":"npx","args":["@playwright/mcp@latest"]}]'
   */
  async connectExternalServers() {
    const raw = process.env.MCP_EXTERNAL_SERVERS;
    if (!raw || !String(raw).trim()) return;
    let configs;
    try {
      configs = JSON.parse(raw);
    } catch (e) {
      log(`MCP_EXTERNAL_SERVERS invalid JSON: ${e.message}`, "error");
      return;
    }
    if (!Array.isArray(configs)) return;

    for (const cfg of configs) {
      if (!cfg?.command) continue;
      try {
        const transport = new StdioClientTransport({
          command: cfg.command,
          args: cfg.args || [],
          env: { ...process.env, ...(cfg.env || {}) },
        });
        const client = new Client({ name: "qa-genie", version: "1.0.0" }, { capabilities: {} });
        await client.connect(transport);
        const { tools } = await client.listTools();
        for (const t of tools) {
          const extName = `ext/${t.name}`;
          this.tools.set(extName, {
            name: extName,
            description: `[external] ${t.description || t.name}`,
            inputSchema: t.inputSchema || { type: "object", properties: {} },
            handler: async (args) => {
              const out = await client.callTool({ name: t.name, arguments: args });
              return { ok: !out.isError, content: out.content };
            },
          });
        }
        this.externalClients.push(client);
        log(`Connected external MCP: ${cfg.command} (${tools.length} tools)`, "success");
      } catch (e) {
        log(`External MCP connect failed (${cfg.command}): ${e.message}`, "error");
      }
    }
  }
}

let singleton = null;

function getMcpHost() {
  if (!singleton) singleton = new McpHost();
  return singleton;
}

module.exports = { McpHost, getMcpHost };
