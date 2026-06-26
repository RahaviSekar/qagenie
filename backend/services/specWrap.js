const { stripAiPlaywrightCode } = require("./flowScriptSanitizer");

/**
 * Normalize AI-generated Playwright code to CommonJS so the CLI always picks up tests.
 * ESM `import … @playwright/test` is stripped and replaced with require().
 */
function stripPlaywrightImports(code) {
  return String(code)
    .replace(/import\s*\{[^}]*\}\s*from\s*['"]@playwright\/test['"]\s*;?\s*/gi, "")
    .replace(/import\s+type\s+\{[^}]*\}\s*from\s*['"]@playwright\/test['"]\s*;?\s*/gi, "")
    .replace(/import\s+test\s*,\s*expect\s*from\s*['"]@playwright\/test['"]\s*;?\s*/gi, "")
    .trim();
}

function stripLeadingPlaywrightRequire(code) {
  return String(code || "")
    .replace(/^\s*const\s*\{\s*test\s*,\s*expect\s*\}\s*=\s*require\(\s*['"]@playwright\/test['"]\s*\)\s*;?\s*\n?/im, "")
    .replace(/^\s*const\s*\{\s*test\s*,\s*expect\s*\}\s*=\s*require\(\s*['"]playwright-core\/lib\/test['"]\s*\)\s*;?\s*\n?/im, "")
    .trim();
}
function wrapPlaywrightSpec(flowName, code) {
  let body = stripPlaywrightImports(code);
  const hasTestFn = /\btest\s*\(/.test(body);
  if (!hasTestFn) {
    body = `test(${JSON.stringify(flowName)}, async ({ page }) => {\n${body}\n});`;
  }
  if (!/\brequire\s*\(\s*['"]playwright-core\/lib\/test['"]\s*\)/.test(body)) {
    body = `const { test, expect } = require('playwright-core/lib/test');\n${body}`;
  }
  return body;
}

/**
 * One require(); happy-path test(s) then optional extra test() blocks for negative scenarios.
 * @param {string} flowLabel - flow name for happy-path test title
 * @param {string} happyCode - AI output (may include require + one test)
 * @param {string} negativeCode - AI output: additional test() blocks only
 */
function combineHappyAndNegative(flowLabel, happyCode, negativeCode) {
  const happyTitle = `${flowLabel} — happy path`;
  let h = stripLeadingPlaywrightRequire(stripPlaywrightImports(stripAiPlaywrightCode(happyCode)));
  if (!/\btest\s*\(/.test(h)) {
    h = `test(${JSON.stringify(happyTitle)}, async ({ page }) => {\n${h}\n});`;
  } else {
    h = h.replace(/\btest\s*\(\s*['"]([^'"]*)['"]\s*,/, `test(${JSON.stringify(happyTitle)},`);
  }
  let n = stripLeadingPlaywrightRequire(stripPlaywrightImports(stripAiPlaywrightCode(negativeCode || "")));
  const body = `const { test, expect } = require('playwright-core/lib/test');\n\n${h}\n\n${n}\n`;
  return body;
}

module.exports = { wrapPlaywrightSpec, stripPlaywrightImports, combineHappyAndNegative, stripLeadingPlaywrightRequire };
