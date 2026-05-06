import Fuse from "fuse.js";
import type { SearchEntry } from "./types";

// ─── Fuse.js Configuration ────────────────────────────────────────

const FUSE_OPTIONS: Fuse.IFuseOptions<SearchEntry> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "tags", weight: 0.25 },
    { name: "module", weight: 0.15 },
    { name: "contentType", weight: 0.1 },
    { name: "excerpt", weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

// ─── Search Engine ─────────────────────────────────────────────────

let fuseInstance: Fuse<SearchEntry> | null = null;

export function initializeSearch(entries: SearchEntry[]): void {
  fuseInstance = new Fuse(entries, FUSE_OPTIONS);
}

export function search(
  query: string
): Fuse.FuseResult<SearchEntry>[] {
  if (!fuseInstance) return [];
  if (!query.trim()) return [];
  return fuseInstance.search(query, { limit: 20 });
}

/**
 * Group search results by module
 */
export function groupResultsByModule(
  results: Fuse.FuseResult<SearchEntry>[]
): Map<string, Fuse.FuseResult<SearchEntry>[]> {
  const groups = new Map<string, Fuse.FuseResult<SearchEntry>[]>();
  for (const result of results) {
    const mod = result.item.module;
    if (!groups.has(mod)) groups.set(mod, []);
    groups.get(mod)!.push(result);
  }
  return groups;
}
