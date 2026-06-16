/**
 * MCP-compatible tool definition (matches Model Context Protocol tool shape).
 * @typedef {object} McpToolDef
 * @property {string} name
 * @property {string} description
 * @property {object} inputSchema - JSON Schema for arguments
 * @property {(args: object, ctx: object) => Promise<object>} handler
 */

function stringProp(description) {
  return { type: "string", description };
}

function numberProp(description) {
  return { type: "number", description };
}

module.exports = { stringProp, numberProp };
