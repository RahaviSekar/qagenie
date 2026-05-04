const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs").promises;
const { log } = require("./logEmitter");

const PAGE_TIMEOUT_MS = 10_000;
const MAX_PAGES = 25;

function sameHost(a, b) {
  try {
    return new URL(a).hostname === new URL(b).hostname;
  } catch {
    return false;
  }
}

function normalizeUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function extractPage(page, url) {
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']")].map(
      (el) => ({
        text: (el.innerText || el.value || "").trim().slice(0, 200),
        type: el.getAttribute("type") || "button",
        disabled: el.disabled === true,
      })
    );
    const inputs = [...document.querySelectorAll("input:not([type='hidden']), textarea, select")].map((el) => ({
      type: el.tagName.toLowerCase() === "textarea" ? "textarea" : el.getAttribute("type") || "text",
      name: el.getAttribute("name") || "",
      placeholder: el.getAttribute("placeholder") || "",
      required: el.required === true,
    }));
    const forms = [...document.querySelectorAll("form")].map((f) => ({
      action: f.getAttribute("action") || "",
      method: (f.getAttribute("method") || "get").toUpperCase(),
      fieldCount: f.querySelectorAll("input, textarea, select").length,
    }));
    const links = [...document.querySelectorAll("a[href]")].map((a) => ({
      href: a.getAttribute("href") || "",
      text: (a.innerText || "").trim().slice(0, 120),
    }));
    const images = [...document.querySelectorAll("img")].map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      broken: !img.complete || img.naturalWidth === 0,
    }));
    return {
      url: location.href,
      title: document.title,
      metaDescription: document.querySelector("meta[name='description']")?.getAttribute("content") || "",
      buttons,
      forms,
      links,
      images,
    };
  });
}

async function crawl(startUrl) {
  log(`Starting crawl: ${startUrl}`, "step");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const seen = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const pages = [];

  try {
    while (queue.length && pages.length < MAX_PAGES) {
      const { url, depth } = queue.shift();
      if (seen.has(url)) continue;
      seen.add(url);

      const page = await context.newPage();
      page.setDefaultTimeout(PAGE_TIMEOUT_MS);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
        const data = await extractPage(page, url);
        pages.push(data);
        log(`Captured: ${data.title || url}`, "info");

        if (depth < 2) {
          for (const l of data.links) {
            const abs = normalizeUrl(url, l.href);
            if (!abs || seen.has(abs)) continue;
            if (!sameHost(startUrl, abs)) continue;
            const u = new URL(abs);
            if (u.hash && u.pathname === new URL(url).pathname) continue;
            queue.push({ url: abs.split("#")[0], depth: depth + 1 });
          }
        }
      } catch (err) {
        log(`Page error (${url}): ${err.message}`, "error");
        pages.push({
          url,
          title: "",
          error: err.message,
          buttons: [],
          forms: [],
          links: [],
          images: [],
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return { url: startUrl, pages };
}

async function detectUIChanges(url, previousSnapshot) {
  const current = await crawl(url);
  const changes = [];
  if (!previousSnapshot || !previousSnapshot.pages) {
    return { hasChanges: true, changes: [{ type: "no_baseline", detail: "No previous snapshot to compare" }] };
  }

  const prevByUrl = new Map(previousSnapshot.pages.map((p) => [p.url, p]));
  for (const p of current.pages) {
    const prev = prevByUrl.get(p.url);
    if (!prev) {
      changes.push({ type: "page_added", page: p.url, detail: "New page in crawl" });
      continue;
    }
    if ((prev.title || "") !== (p.title || "")) {
      changes.push({ type: "title_changed", page: p.url, detail: `"${prev.title}" → "${p.title}"` });
    }
    if (prev.buttons?.length !== p.buttons?.length) {
      changes.push({ type: "buttons_changed", page: p.url, detail: `button count ${prev.buttons?.length} → ${p.buttons?.length}` });
    }
    if (prev.forms?.length !== p.forms?.length) {
      changes.push({ type: "forms_changed", page: p.url, detail: `form count ${prev.forms?.length} → ${p.forms?.length}` });
    }
  }
  for (const prev of previousSnapshot.pages) {
    if (!current.pages.find((c) => c.url === prev.url)) {
      changes.push({ type: "page_removed", page: prev.url, detail: "Page missing in latest crawl" });
    }
  }

  return { hasChanges: changes.length > 0, changes };
}

async function saveSnapshot(url) {
  const data = await crawl(url);
  const id = `snap-${Date.now()}`;
  const dir = path.join(__dirname, "..", "data", "snapshots");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${id}.json`);
  await fs.writeFile(file, JSON.stringify({ id, url, createdAt: new Date().toISOString(), ...data }, null, 2), "utf8");
  log(`Snapshot saved: ${id}`, "success");
  return { id, path: file, data };
}

async function loadSnapshot(snapshotId) {
  const file = path.join(__dirname, "..", "data", "snapshots", `${snapshotId}.json`);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

module.exports = {
  crawl,
  detectUIChanges,
  saveSnapshot,
  loadSnapshot,
};
