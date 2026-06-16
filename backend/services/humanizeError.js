const ANSI_RE = /\u001b\[[0-9;]*m/g;

function stripAnsi(text) {
  return String(text || "").replace(ANSI_RE, "");
}

/**
 * Short, non-technical explanation for QA bug reports.
 */
function humanizePlaywrightError(raw) {
  const msg = stripAnsi(raw).replace(/\s+/g, " ").trim();
  if (!msg) return "The automated check did not complete.";

  if (/has already been declared/i.test(msg)) {
    return "The generated test file had duplicate function names (a QA Genie bug on the last run). Restart the server and Run again.";
  }
  if (/javascript is not defined|unexpected token/i.test(msg)) {
    return "The generated test file had invalid syntax (often leftover markdown from AI). Re-run the flow to regenerate the script.";
  }

  if (/account\\s*password\|new\\s*password/i.test(msg)) {
    return 'The test looked for a field labeled "account password" but your form uses "Password *" under Account Information — the script used the wrong locator (this is fixed on the next run).';
  }
  if (/getByLabel\([^)]*\/\^password/i.test(msg)) {
    return 'Could not find the "Password" field under Account Information in time (label on screen is "Password *").';
  }
  if (/secure\s*access|h1:has-text\("Secure Access"\)/i.test(msg)) {
    return "The Secure Access / site password screen did not appear as expected, or the test looked for the wrong heading.";
  }
  if (/find your company|company/i.test(msg) && /h1|toBeVisible/i.test(msg)) {
    return "The “Find Your Company” step did not load in time, or the page title is not a main heading (h1) on your site.";
  }
  if (/create\s+an?\s+account/i.test(msg) && /click|timeout/i.test(msg)) {
    return "Could not click “Create an Account” — link may be worded differently or not visible yet after login.";
  }
  if (/outside of the viewport/i.test(msg)) {
    return "The link was on the page but outside the clickable area (often cookies or a hidden duplicate menu). Re-run after restart — the script now accepts cookies and scrolls the menu link into view.";
  }
  if (/waiting for.*getbyrole\(['"]button['"].*add.*cart/i.test(msg)) {
    return "Add to Cart was not found — you may still be on a category listing (PLP). Open a product detail page (/p/…) first; the next run uses that automatically.";
  }
  if (/performing security verification|verify you are not a bot|cloudflare/i.test(msg)) {
    return "Cloudflare or a bot check blocked the automated browser before your store loaded — not a wrong menu locator. Try PLAYWRIGHT_HEADED=true or a staging URL without bot protection.";
  }
  if (/strict mode violation/i.test(msg) && /getByRole\('link'/i.test(msg)) {
    return 'More than one link matched (e.g. "Decor" and "HOME DECOR"). Re-run the flow — scripts now use exact menu names like /^decor$/i with .first().';
  }
  if (/getByRole\(['"]navigation['"]\)/i.test(msg)) {
    return 'The test looked for a link inside role="navigation", but this site’s top menu is not in a navigation landmark. Restart the server and Run again — or add a locator hint on the step (e.g. a.main-menu-link).';
  }
  if (/locator\.click|waiting for.*click/i.test(msg)) {
    return "A button or link was not ready to click in time — or the page is still on a Cloudflare/bot check (try PLAYWRIGHT_HEADED=true).";
  }
  if (/locator\.fill|waiting for.*fill/i.test(msg)) {
    return "A form field was not found or not ready to type into.";
  }
  if (/timeout.*exceeded/i.test(msg)) {
    return "The page or control took too long to respond.";
  }
  if (/expect\(.*\)\.toBeVisible/i.test(msg)) {
    return "Something expected on screen was not visible in time.";
  }

  const short = msg.slice(0, 220);
  return short.length < msg.length ? `${short}…` : short;
}

module.exports = { humanizePlaywrightError, stripAnsi };
