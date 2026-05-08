import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";

// ─── CLI args ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    url:         { type: "string",  default: "https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/oedsc/index.html" },
    out:         { type: "string",  default: "data" },
    concurrency: { type: "string",  default: "3" },
    delay:       { type: "string",  default: "400" },
    timeout:     { type: "string",  default: "90000" },
    "dry-run":   { type: "boolean", default: false },
    help:        { type: "boolean", default: false, short: "h" },
  },
  strict: false,
});

if (args.help) {
  console.log(`
Usage: node scripts/fetch-schema.mjs [options]

  --url          Entry-point URL of the docs book
                 Default: https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/oedsc/index.html
  --out          Output root directory (default: data)
  --concurrency  Parallel downloads (default: 3)
  --delay        ms between requests per worker (default: 400)
  --timeout      Page load timeout in ms (default: 90000)
  --dry-run      Discover URLs only, do not download
  -h, --help     Show this help

Output structure:
  data/<chapter>/<group>/<NAME>.html
  e.g. data/Global Human Resources/tables/PER_ALL_PEOPLE_F.html

Prerequisites:
  pnpm add -D playwright
  npx playwright install chromium

Troubleshooting:
  If getting timeout errors, try:
    node scripts/fetch-schema.mjs --timeout 120000
`);
  process.exit(0);
}

const ENTRY_URL    = args.url;
const OUT_DIR      = path.resolve(args.out);
const CONCURRENCY  = parseInt(args.concurrency, 10);
const DELAY_MS     = parseInt(args.delay, 10);
const PAGE_TIMEOUT = parseInt(args.timeout, 10);
const DRY_RUN      = args["dry-run"];

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Plain fetch for individual page downloads — fast, no browser needed. */
async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Turn a table/view name into a safe filename. */
function nameToFilename(name) {
  return name.toUpperCase().replace(/[^A-Z0-9_]/g, "_") + ".html";
}

/** Strip characters that are unsafe in folder names. */
function sanitizeFolderName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "").trim();
}

// ─── TOC discovery via Playwright ─────────────────────────────────────────

/**
 * Uses a headless Chromium browser to:
 *  1. Load the docs entry page and wait for the JET treeview to render.
 *  2. Expand all chapter nodes to reveal their Tables/Views sub-groups.
 *  3. Extract every (href, label, group, chapter) tuple from the sidebar.
 *
 * Returns an array of { url, name, group, chapter } objects.
 */
async function discoverLinksWithBrowser(entryUrl) {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error(
      "Playwright is not installed.\n" +
      "Run: pnpm add -D playwright && npx playwright install chromium"
    );
  }

  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  try {
    console.log(`Opening browser → ${entryUrl}`);
    try {
      await page.goto(entryUrl, { waitUntil: "networkidle", timeout: PAGE_TIMEOUT });
    } catch (err) {
      if (err.name === "TimeoutError") {
        console.log("networkidle timeout — falling back to domcontentloaded");
        await page.goto(entryUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      } else {
        throw err;
      }
    }

    // Wait for the treeview to appear
    try {
      await page.waitForSelector("oj-tree-view, .oj-treeview-list", { timeout: 30_000 });
    } catch {
      console.log("TOC selector not found — waiting additional time and retrying...");
      await sleep(3000);
    }
    console.log("TOC rendered — expanding chapter nodes...");

    // Expand every collapsed chapter node. Oracle JET uses aria-expanded="false".
    for (let round = 0; round < 10; round++) {
      const collapsed = await page.$$('[role="treeitem"][aria-expanded="false"]');
      if (collapsed.length === 0) break;
      for (const node of collapsed) {
        try {
          await node.click({ timeout: 2_000 });
          await sleep(200);
        } catch {
          // Some nodes may not be clickable — skip
        }
      }
      await sleep(500);
    }

    console.log("Extracting links from TOC...");

    const links = await page.evaluate(() => {
      const results = [];
      let currentChapter = null;
      let currentGroup   = null;

      const anchors = document.querySelectorAll("a.toc-anchor");

      for (const anchor of anchors) {
        const href  = anchor.getAttribute("href") ?? "";
        const label = (anchor.textContent ?? "").trim();

        if (!label || !href) continue;

        // Skip navigation-only links
        if (
          href.includes("index.html") ||
          label === "Title and Copyright Information" ||
          label === "Get Help"
        ) continue;

        // Chapter heading: starts with a number, e.g. "10 Global Human Resources"
        if (/^\d+\s+\w/.test(label)) {
          currentChapter = label.replace(/^\d+\s+/, "").trim();
          currentGroup   = null;
          continue;
        }

        // Group headings
        if (label === "Tables") { currentGroup = "tables"; continue; }
        if (label === "Views")  { currentGroup = "views";  continue; }

        // Leaf item inside a known chapter + group
        if (currentChapter && currentGroup) {
          const pageUrl    = href.split("#")[0];
          const cleanName  = label.replace(/_+$/, ""); // strip trailing underscores
          results.push({
            url:     pageUrl.startsWith("http")
                       ? pageUrl
                       : new URL(pageUrl, window.location.href).href,
            name:    cleanName,
            group:   currentGroup,   // "tables" | "views"
            chapter: currentChapter, // e.g. "Global Human Resources"
          });
        }
      }

      return results;
    });

    // De-duplicate by URL
    const seen = new Set();
    return links.filter(({ url }) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

  } finally {
    await browser.close();
  }
}

// ─── Download ──────────────────────────────────────────────────────────────

/**
 * Downloads a single page and saves it under:
 *   <OUT_DIR>/<chapter>/<group>/<NAME>.html
 *
 * This mirrors the structure segregator.mjs used to build after the fact,
 * so the segregator step is no longer needed.
 */
async function downloadPage({ url, name, group, chapter }) {
  const filename      = nameToFilename(name);
  const chapterFolder = sanitizeFolderName(chapter);
  const outPath       = path.join(OUT_DIR, chapterFolder, group, filename);

  // Skip if already downloaded
  try {
    await fs.access(outPath);
    return { skipped: true, outPath };
  } catch {
    // file doesn't exist — proceed
  }

  const html = await fetchHtml(url);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, "utf8");
  return { skipped: false, outPath };
}

// ─── Concurrency pool ─────────────────────────────────────────────────────

async function pool(items, concurrency, delayMs, fn) {
  const queue   = [...items];
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const result = await fn(item);
      results.push(result);
      if (queue.length > 0) await sleep(delayMs);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const links = await discoverLinksWithBrowser(ENTRY_URL);

  const tableCount = links.filter((l) => l.group === "tables").length;
  const viewCount  = links.filter((l) => l.group === "views").length;
  console.log(`\nDiscovered ${links.length} pages — Tables: ${tableCount} | Views: ${viewCount}\n`);

  if (DRY_RUN) {
    for (const { url, name, group, chapter } of links) {
      console.log(`  [${group}] ${chapter} / ${name}\n    ${url}`);
    }
    return;
  }

  console.log(`Downloading to: ${OUT_DIR}/<chapter>/<group>/`);
  console.log(`Concurrency: ${CONCURRENCY} | Delay: ${DELAY_MS}ms\n`);

  let downloaded = 0, skipped = 0, errors = 0;

  await pool(links, CONCURRENCY, DELAY_MS, async (link) => {
    try {
      const { outPath, skipped: wasSkipped } = await downloadPage(link);
      const rel = path.relative(process.cwd(), outPath);
      if (wasSkipped) {
        skipped++;
        console.log(`  [skip]  ${link.chapter}/${link.group}/${link.name}`);
      } else {
        downloaded++;
        console.log(`  [ok]    ${link.name}  →  ${rel}`);
      }
    } catch (err) {
      errors++;
      console.error(`  [error] ${link.name}  ${err.message}`);
    }
  });

  console.log(`
Done.
  Downloaded : ${downloaded}
  Skipped    : ${skipped} (already exist)
  Errors     : ${errors}

Output structure:
  data/<chapter>/<group>/<NAME>.html

Next step: node scripts/scrape-schema.mjs
`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
