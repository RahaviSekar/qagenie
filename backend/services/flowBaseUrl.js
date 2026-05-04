/**
 * Normalize user-entered base URL to origin (https://host) for comparisons and string replace.
 */
function toOrigin(input) {
  if (input == null || typeof input !== "string") return null;
  const t = input.trim();
  if (!t) return null;
  try {
    return new URL(t.startsWith("http") ? t : `https://${t}`).origin;
  } catch {
    return null;
  }
}

/** For prompts: origin is enough; avoid trailing slash ambiguity. */
function toDisplayBase(input) {
  const o = toOrigin(input);
  return o || "https://example.com";
}

/**
 * Pick base URL for a flow run: explicit request body wins, then saved flow.baseUrl, then default.
 */
function resolveFlowBaseUrl(flow, requestBaseUrl) {
  const fromRequest = toOrigin(requestBaseUrl);
  if (fromRequest) return fromRequest;
  const fromFlow = toOrigin(flow?.baseUrl);
  if (fromFlow) return fromFlow;
  return "https://example.com";
}

/** Gemini often still emits example.com — swap to the user's origin. */
function rewriteExampleComToBase(code, baseOrigin) {
  if (!code || !baseOrigin) return String(code);
  if (baseOrigin === "https://example.com" || baseOrigin === "http://example.com") return String(code);
  return String(code).replace(/https?:\/\/(www\.)?example\.com/gi, baseOrigin);
}

module.exports = {
  toOrigin,
  toDisplayBase,
  resolveFlowBaseUrl,
  rewriteExampleComToBase,
};
