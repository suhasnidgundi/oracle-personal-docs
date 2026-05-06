import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { DocEntry, DocFrontmatter, NavItem, SearchEntry } from "./types";

// ─── Constants ─────────────────────────────────────────────────────
const CONTENT_DIR = path.join(process.cwd(), "content");

// ─── Helpers ───────────────────────────────────────────────────────

function slugFromFilePath(filePath: string): string {
  return path
    .relative(CONTENT_DIR, filePath)
    .replace(/\.mdx?$/, "")
    .split(path.sep)
    .join("/");
}

function readMarkdownFile(filePath: string): DocEntry | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const frontmatter = data as DocFrontmatter;

    // Ensure required fields
    if (!frontmatter.title || !frontmatter.module || !frontmatter.contentType) {
      console.warn(`Skipping ${filePath}: missing required frontmatter fields`);
      return null;
    }

    return {
      slug: slugFromFilePath(filePath),
      frontmatter,
      content: content.trim(),
    };
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (/\.mdx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Get all documentation entries
 */
export function getAllDocs(): DocEntry[] {
  const files = walkDir(CONTENT_DIR);
  return files
    .map(readMarkdownFile)
    .filter((doc): doc is DocEntry => doc !== null)
    .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
}

/**
 * Get a single doc by slug (e.g., "hcm/tables/hwm-time-records")
 */
export function getDocBySlug(slug: string): DocEntry | null {
  // Try .md then .mdx
  for (const ext of [".md", ".mdx"]) {
    const filePath = path.join(CONTENT_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      return readMarkdownFile(filePath);
    }
  }
  return null;
}

/**
 * Build navigation tree from all docs
 */
export function getNavTree(): NavItem[] {
  const docs = getAllDocs();
  const tree: NavItem[] = [];

  // Group by module
  const moduleGroups = new Map<string, DocEntry[]>();
  for (const doc of docs) {
    const mod = doc.frontmatter.module;
    if (!moduleGroups.has(mod)) moduleGroups.set(mod, []);
    moduleGroups.get(mod)!.push(doc);
  }

  for (const [module, moduleDocs] of moduleGroups) {
    // Group by content type within module
    const typeGroups = new Map<string, DocEntry[]>();
    for (const doc of moduleDocs) {
      const ct = doc.frontmatter.contentType;
      if (!typeGroups.has(ct)) typeGroups.set(ct, []);
      typeGroups.get(ct)!.push(doc);
    }

    const moduleChildren: NavItem[] = [];
    for (const [contentType, typeDocs] of typeGroups) {
      const typeChildren: NavItem[] = typeDocs.map((doc) => ({
        label: doc.frontmatter.title,
        path: `/docs/${doc.slug}`,
        contentType: doc.frontmatter.contentType,
        module: doc.frontmatter.module,
      }));

      moduleChildren.push({
        label: contentType.charAt(0).toUpperCase() + contentType.slice(1) + "s",
        contentType,
        children: typeChildren,
        module,
      });
    }

    tree.push({
      label: module.toUpperCase(),
      module,
      children: moduleChildren,
    });
  }

  return tree;
}

/**
 * Build search index from all docs
 */
export function getSearchIndex(): SearchEntry[] {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    title: doc.frontmatter.title,
    slug: doc.slug,
    module: doc.frontmatter.module,
    subModule: doc.frontmatter.subModule,
    contentType: doc.frontmatter.contentType,
    tags: doc.frontmatter.tags || [],
    excerpt: doc.content.slice(0, 200).replace(/[#*_`>\[\]]/g, "").trim(),
    difficulty: doc.frontmatter.difficulty,
  }));
}

/**
 * Get related docs by their slugs
 */
export function getRelatedDocs(
  slugs: string[]
): Pick<DocEntry, "slug" | "frontmatter">[] {
  return slugs
    .map((slug) => {
      const doc = getDocBySlug(slug);
      if (!doc) return null;
      return { slug: doc.slug, frontmatter: doc.frontmatter };
    })
    .filter(
      (doc): doc is Pick<DocEntry, "slug" | "frontmatter"> => doc !== null
    );
}

/**
 * Get stats about the content
 */
export function getContentStats(): {
  totalDocs: number;
  modules: number;
  tables: number;
  flows: number;
  concepts: number;
  queries: number;
} {
  const docs = getAllDocs();
  const modules = new Set(docs.map((d) => d.frontmatter.module));
  return {
    totalDocs: docs.length,
    modules: modules.size,
    tables: docs.filter((d) => d.frontmatter.contentType === "table").length,
    flows: docs.filter((d) => d.frontmatter.contentType === "flow").length,
    concepts: docs.filter((d) => d.frontmatter.contentType === "concept")
      .length,
    queries: docs.filter((d) => d.frontmatter.contentType === "query").length,
  };
}

/**
 * Get all docs for a specific module
 */
export function getDocsByModule(module: string): DocEntry[] {
  return getAllDocs().filter((d) => d.frontmatter.module === module);
}

/**
 * Get docs filtered by module and content type
 */
export function getDocsByContentType(
  module: string,
  contentType: string
): DocEntry[] {
  return getAllDocs().filter(
    (d) =>
      d.frontmatter.module === module &&
      d.frontmatter.contentType === contentType
  );
}

/**
 * Get module-level stats
 */
export function getModuleStats(module: string): {
  tables: number;
  flows: number;
  concepts: number;
  queries: number;
  totalDocs: number;
  subModules: string[];
} {
  const docs = getDocsByModule(module);
  const subModules = [
    ...new Set(
      docs
        .map((d) => d.frontmatter.subModule)
        .filter((s): s is string => !!s)
    ),
  ];
  return {
    tables: docs.filter((d) => d.frontmatter.contentType === "table").length,
    flows: docs.filter((d) => d.frontmatter.contentType === "flow").length,
    concepts: docs.filter((d) => d.frontmatter.contentType === "concept")
      .length,
    queries: docs.filter((d) => d.frontmatter.contentType === "query").length,
    totalDocs: docs.length,
    subModules,
  };
}
