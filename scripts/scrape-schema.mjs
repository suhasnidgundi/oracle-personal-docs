import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR   = process.cwd();
const DATA_DIR   = path.join(ROOT_DIR, "data");
const OUTPUT_DIR = path.join(ROOT_DIR, "schema");

// ─── String utilities ──────────────────────────────────────────────────────

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeHtml(normalizeWhitespace(value.replace(/<[^>]*>/g, " ")));
}

function splitCsvList(value) {
  return value
    .split(/,/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
}

// ─── Slug helper ───────────────────────────────────────────────────────────

function slugFromFileName(fileName) {
  return fileName.replace(/\.html?$/i, "").toLowerCase();
}

// ─── Object kind heuristic (fallback only) ────────────────────────────────

function inferObjectKind(name) {
  const u = name.toUpperCase();
  if (u.endsWith("_VL") || u.endsWith("_VW") || u.endsWith("_V")) return "VIEW";
  return "TABLE";
}

// ─── HTML extraction helpers ───────────────────────────────────────────────

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? stripTags(m[1]) : "";
}

/**
 * Prefer the body description paragraph over the meta tag.
 * Oracle docs put the description as a <p class="p"> directly
 * inside .body, before any <section>.
 */
function extractDescription(html) {
  // Try body paragraph first
  const bodyMatch = html.match(/<div class="body">[\s\S]*?<p class="p">([^<]+)<\/p>/i);
  if (bodyMatch && bodyMatch[1].trim()) return normalizeWhitespace(decodeHtml(bodyMatch[1]));
  // Fall back to meta description
  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  return metaMatch ? decodeHtml(metaMatch[1]) : "";
}

function extractDetailValue(html, label) {
  const re = new RegExp(`<p class="p">${label}:\\s*([^<]+)<`, "i");
  const m = html.match(re);
  return m ? normalizeWhitespace(decodeHtml(m[1])) : "";
}

function extractSection(html, sectionTitle) {
  // Match <section> where the h2 title appears directly after the opening tag.
  // Using \s* (not [\s\S]*?) prevents accidentally matching a <section> that starts
  // before our target heading and bleeding in rows from prior sibling sections.
  const sectionRe = new RegExp(
    `<section[^>]*>\\s*<h2[^>]*>\\s*${sectionTitle}\\s*<\\/h2>[\\s\\S]*?<\\/section>`,
    "i"
  );
  const sectionMatch = html.match(sectionRe);
  if (!sectionMatch) return null;

  const sectionHtml = sectionMatch[0];

  const theadMatch = sectionHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  // Use greedy ([\s\S]*) so we capture ALL rows up to the LAST </tbody> in the section
  const tbodyMatch = sectionHtml.match(/<tbody[^>]*>([\s\S]*)<\/tbody>/i);
  if (!theadMatch || !tbodyMatch) return null;

  const extractCells = (rowHtml, cellTag) =>
    Array.from(rowHtml.matchAll(new RegExp(`<${cellTag}[^>]*>([\\s\\S]*?)<\\/${cellTag}>`, "gi"))).map(
      (m) => stripTags(m[1])
    );

  const headers = extractCells(theadMatch[1], "th");
  const rows = Array.from(
    tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
  ).map((rowM) => extractCells(rowM[1], "td"));

  return { headers, rows };
}

// ─── Domain parsers ────────────────────────────────────────────────────────

/**
 * TABLEs have one <tr> per column with full metadata.
 * VIEWs have a single <td> with all column names as stacked <p> tags.
 * Handle both cases.
 */
function parseColumns(html, objectKind) {
  const section = extractSection(html, "Columns");
  if (!section) return [];

  // VIEW format: single row, single cell, column names as <p> tags
  if (objectKind === "VIEW") {
    // Find the columns section HTML and extract all <p class="p"> values
    const sectionRe = /<section[^>]*>\s*<h2[^>]*>\s*Columns\s*<\/h2>[\s\S]*?<\/section>/i;
    const sectionHtml = html.match(sectionRe)?.[0] ?? "";
    return Array.from(sectionHtml.matchAll(/<p class="p">([^<]+)<\/p>/gi))
      .map((m) => normalizeWhitespace(decodeHtml(m[1])))
      .filter(Boolean)
      .map((name) => ({ name, datatype: "", length: "", precision: "", notNull: false, comments: "" }));
  }

  // TABLE format: one <tr> per column with full metadata
  return section.rows
    .filter((cells) => cells.length > 0 && cells[0])
    .map((cells) => ({
      name:      cells[0] ?? "",
      datatype:  cells[1] ?? "",
      length:    cells[2] ?? "",
      precision: cells[3] ?? "",
      notNull:   (cells[4] ?? "").toLowerCase() === "yes",  // "Not-null: Yes" means NOT nullable
      comments:  cells[5] ?? "",
    }));
}

function parsePrimaryKey(html) {
  const section = extractSection(html, "Primary Key");
  if (!section || section.rows.length === 0) return null;

  const [name, columns] = section.rows[0];
  return {
    name:    name ?? "",
    columns: splitCsvList(columns ?? ""),
  };
}

function parseForeignKeys(html) {
  const section = extractSection(html, "Foreign Keys");
  if (!section) return [];

  return section.rows
    .filter((cells) => cells.length > 0 && cells[0])
    .map((cells) => ({
      table:        cells[0] ?? "",
      foreignTable: cells[1] ?? "",
      columns:      splitCsvList(cells[2] ?? ""),
    }));
}

function parseIndexes(html) {
  const section = extractSection(html, "Indexes");
  if (!section) return [];

  return section.rows
    .filter((cells) => cells.length > 0 && cells[0])
    .map((cells) => ({
      name:       cells[0] ?? "",
      uniqueness: cells[1] ?? "",
      tablespace: cells[2] ?? "",
      columns:    splitCsvList(cells[3] ?? ""),
    }));
}

function parseQuery(html) {
  const section = extractSection(html, "Query");
  if (!section || section.rows.length === 0) return "";
  return section.rows.flat().join(" ").replace(/\s+/g, " ").trim();
}

// ─── Output path resolution ────────────────────────────────────────────────

/**
 * Mirrors the data/ folder structure directly into schema/.
 *
 * Input:  data/HCM/Absence Management/tables/FAI_AGENT_PREFERENCES.html
 * Output: schema/HCM/Absence Management/tables/fai_agent_preferences.json
 *
 * pathSegments = ["HCM", "Absence Management"]  (everything between data/ and tables|views/)
 * group        = "tables" | "views"
 * slug         = "fai_agent_preferences"
 */
function resolveOutputPath(pathSegments, group, slug) {
  const subfolder = group === "views" ? "views" : "tables";
  return path.join(OUTPUT_DIR, ...pathSegments, subfolder, `${slug}.json`);
}

// ─── Recursive HTML file discovery ────────────────────────────────────────

/**
 * Walk DATA_DIR recursively and collect every .html file with its full
 * path context:
 *
 *   data/HCM/Absence Management/tables/X.html
 *     → { filePath, pathSegments: ["HCM", "Absence Management"], group: "tables" }
 *
 *   data/SCM/Assets/views/Y.html
 *     → { filePath, pathSegments: ["SCM", "Assets"], group: "views" }
 *
 * Rules:
 *   - Any directory named "tables" or "views" is the terminal group folder.
 *     Everything above it (below data/) becomes pathSegments.
 *   - If an .html file is found outside a tables/views folder, group = "".
 *   - No assumptions about how many levels deep the structure goes.
 */
async function collectHtmlFiles(dir) {
  const collected = [];

  // segments = path parts accumulated between DATA_DIR and current dir
  async function walk(currentDir, segments, group) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        const nameLower = entry.name.toLowerCase();

        if (nameLower === "tables" || nameLower === "views") {
          // This is the terminal group folder — don't add it to segments
          await walk(fullPath, segments, nameLower);
        } else {
          // Regular structural folder — add to segments, reset group
          await walk(fullPath, [...segments, entry.name], null);
        }
      } else if (entry.isFile() && /\.html?$/i.test(entry.name)) {
        collected.push({
          filePath:     fullPath,
          pathSegments: segments,        // e.g. ["HCM", "Absence Management"]
          group:        group ?? "",     // "tables" | "views" | ""
        });
      }
    }
  }

  await walk(dir, [], null);
  return collected;
}

// ─── Core scraper ──────────────────────────────────────────────────────────

async function scrapeFile(filePath, pathSegments, group) {
  const html     = await fs.readFile(filePath, "utf8");
  const fileName = path.basename(filePath);
  const slug     = slugFromFileName(fileName);
  const name     = extractTitle(html) || slug.toUpperCase();

  // Metadata from the Details section
  const schema      = extractDetailValue(html, "Schema");
  const objectOwner = extractDetailValue(html, "Object owner");
  const objectType  = extractDetailValue(html, "Object type");
  const tablespace  = extractDetailValue(html, "Tablespace");

  // Object kind: folder name is authoritative, fall back to heuristics
  let objectKind;
  if (group === "views") {
    objectKind = "VIEW";
  } else if (group === "tables") {
    objectKind = "TABLE";
  } else {
    objectKind = objectType.toUpperCase().includes("VIEW")
      ? "VIEW"
      : inferObjectKind(name);
  }

  const description = extractDescription(html);
  const columns     = parseColumns(html, objectKind);
  const primaryKey  = parsePrimaryKey(html);
  const foreignKeys = parseForeignKeys(html);
  const indexes     = parseIndexes(html);
  const query       = objectKind === "VIEW" ? parseQuery(html) : "";

  const relatedTables = Array.from(
    new Set(foreignKeys.map((fk) => fk.foreignTable).filter(Boolean))
  );

  const payload = {
    name,
    slug,
    // Full path context mirrors data/ folder structure
    pathSegments,                                          // e.g. ["HCM", "Absence Management"]
    group,                                                 // "tables" | "views"
    objectKind,
    sourceFile: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
    schema,
    objectOwner,
    objectType,
    tablespace,
    description,
    primaryKey,
    columns,
    foreignKeys,
    indexes,
    relatedTables,
    ...(query && { query }),                               // only present for views
  };

  const outputPath = resolveOutputPath(pathSegments, group, slug);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return { outputPath, name, objectKind };
}

// ─── Entry point ───────────────────────────────────────────────────────────

async function main() {
  const htmlFiles = await collectHtmlFiles(DATA_DIR);

  if (htmlFiles.length === 0) {
    console.log("No HTML files found under", DATA_DIR);
    return;
  }

  console.log(`Found ${htmlFiles.length} HTML file(s) — scraping...\n`);

  let tables = 0, views = 0, errors = 0;

  for (const { filePath, pathSegments, group } of htmlFiles) {
    try {
      const { outputPath, name, objectKind } = await scrapeFile(filePath, pathSegments, group);
      const rel = path.relative(ROOT_DIR, outputPath);
      console.log(`[${objectKind}] ${pathSegments.join(" / ")} / ${name} → ${rel}`);
      objectKind === "VIEW" ? views++ : tables++;
    } catch (err) {
      errors++;
      console.error(`ERROR processing ${path.basename(filePath)}:`, err.message);
    }
  }

  console.log(`
Done — ${tables} table(s), ${views} view(s) written to schema/
Errors: ${errors}
`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
