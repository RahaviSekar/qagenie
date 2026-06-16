const aiService = require("../services/aiService");
const { log } = require("../services/logEmitter");

/**
 * Agent loop: model chooses MCP tools until done or maxSteps.
 * @param {import('./mcpHost').McpHost} host
 * @param {{ goal: string, allowedTools?: string[], maxSteps?: number, baseUrl?: string }} options
 */
async function runMcpAgent(host, options) {
  const goal = String(options.goal || "").trim();
  const maxSteps = options.maxSteps ?? 12;
  const allowedTools = options.allowedTools;
  const history = [];
  let lastScreenshot = host.session?.lastScreenshot || null;
  let done = false;
  let error = null;

  const tools = host
    .listTools()
    .filter((t) => !allowedTools || allowedTools.includes(t.name) || allowedTools.includes(t.name.replace(/^ext\//, "")));

  for (let step = 0; step < maxSteps && !done; step++) {
    log(`MCP agent step ${step + 1}/${maxSteps}`, "step", lastScreenshot ? { screenshot: lastScreenshot } : null);

    let decision;
    try {
      decision = await aiService.chooseMcpToolCall(goal, tools, history, lastScreenshot);
    } catch (e) {
      error = e.message;
      break;
    }

    const action = String(decision.action || "").toLowerCase();
    if (action === "done") {
      done = true;
      history.push({ action: "done", reasoning: decision.reasoning || "" });
      break;
    }

    if (action !== "tool" || !decision.tool) {
      error = decision.reasoning || "Invalid agent decision";
      break;
    }

    const toolName = decision.tool;
    const args = decision.arguments && typeof decision.arguments === "object" ? decision.arguments : {};

    try {
      const result = await host.callTool(toolName, args);
      if (result?.screenshot) lastScreenshot = result.screenshot;
      history.push({
        action: "tool",
        tool: toolName,
        arguments: args,
        result: summarizeToolResult(result),
        reasoning: decision.reasoning || "",
      });
    } catch (e) {
      error = e.message;
      history.push({ action: "tool", tool: toolName, arguments: args, error: e.message });
      break;
    }
  }

  return {
    done: done && !error,
    error,
    history,
    lastScreenshot,
    lastUrl: host.session?.lastUrl || null,
  };
}

function summarizeToolResult(result) {
  if (!result || typeof result !== "object") return result;
  const copy = { ...result };
  if (copy.screenshot) copy.screenshot = "[base64 png]";
  if (copy.bodyPreview) copy.bodyPreview = String(copy.bodyPreview).slice(0, 500);
  return copy;
}

module.exports = { runMcpAgent };
