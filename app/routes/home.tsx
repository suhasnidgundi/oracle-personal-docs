import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getContentStats, getNavTree, getSearchIndex } from "~/lib/content.server";
import { MODULE_META, CONTENT_TYPE_META, FALLBACK_ICONS } from "~/lib/types";
import { SearchDialog } from "~/components/search/SearchDialog";
import { ThemeToggle } from "~/components/layout/ThemeToggle";
import { useState, useEffect } from "react";
import type { SearchEntry, NavItem } from "~/lib/types";
import {
  Search,
  BookOpen,
  Table2,
  GitBranch,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Oracle Personal Docs — Developer Knowledge Platform" },
    {
      name: "description",
      content:
        "A markdown-driven Oracle Fusion technical knowledge platform for developers. Explore tables, views, relationships, business flows, SQL joins, and more.",
    },
  ];
}

export async function loader() {
  const stats = getContentStats();
  const navTree = getNavTree();
  const searchIndex = getSearchIndex();
  return { stats, navTree, searchIndex };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { stats, navTree, searchIndex } = loaderData;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Collect all doc links from nav tree
  const allDocLinks: { label: string; path: string; module: string; contentType: string }[] = [];
  for (const mod of navTree) {
    if (mod.children) {
      for (const group of mod.children) {
        if (group.children) {
          for (const doc of group.children) {
            if (doc.path) {
              allDocLinks.push({
                label: doc.label,
                path: doc.path,
                module: doc.module || mod.module || "",
                contentType: doc.contentType || group.contentType || "",
              });
            }
          }
        }
      }
    }
  }

  // Active modules (ones that have content)
  const activeModules = Object.entries(MODULE_META).filter(([key]) =>
    navTree.some((n) => n.module === key)
  );

  // All modules for "coming soon"
  const comingSoonModules = Object.entries(MODULE_META).filter(
    ([key]) => !navTree.some((n) => n.module === key)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117]">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="h-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-oracle-500 to-oracle-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-tight">
              Oracle Docs
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-oracle-50 dark:bg-oracle-900/20 text-oracle-600 dark:text-oracle-400 text-xs font-medium mb-6 border border-oracle-100 dark:border-oracle-800/30">
            <Sparkles className="w-3.5 h-3.5" />
            Developer Knowledge Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-gray-900 dark:text-gray-50">Oracle Fusion</span>
            <br />
            <span className="text-gradient">Technical Docs</span>
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            A personal knowledge base for Oracle Fusion modules — tables, relationships, 
            business flows, SQL patterns, and technical concepts.
          </p>

          {/* Search bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex items-center gap-3 w-full max-w-md mx-auto h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition-all bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-md group"
            id="hero-search"
          >
            <Search className="w-[18px] h-[18px] group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            <span className="text-sm">Search tables, flows, concepts...</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[11px] font-mono text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
              ⌘K
            </kbd>
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {[
              { label: "Total Docs", value: stats.totalDocs, Icon: BookOpen },
              { label: "Tables", value: stats.tables, Icon: Table2 },
              { label: "Flows", value: stats.flows, Icon: GitBranch },
              { label: "Concepts", value: stats.concepts, Icon: Lightbulb },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
              >
                <stat.Icon className="w-5 h-5 mx-auto mb-1.5 text-gray-400 dark:text-gray-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <section className="pb-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Explore Modules
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeModules.map(([key, meta]) => {
                const moduleNav = navTree.find((n) => n.module === key);
                const docCount = moduleNav?.children?.reduce(
                  (acc, group) => acc + (group.children?.length || 0),
                  0
                ) || 0;
                const Icon = meta.icon;

                return (
                  <Link
                    key={key}
                    to={`/docs/${key}`}
                    className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-oracle-200 dark:hover:border-oracle-800/50 hover:shadow-md transition-all group"
                    prefetch="intent"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-oracle-50 dark:bg-oracle-900/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-oracle-600 dark:text-oracle-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-oracle-600 dark:group-hover:text-oracle-400 transition-colors">
                          {meta.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {meta.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {docCount} document{docCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-oracle-400 transition-colors shrink-0 mt-1" />
                    </div>
                    {/* Quick links for this module */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                      {allDocLinks
                        .filter((d) => d.module === key)
                        .slice(0, 4)
                        .map((doc) => {
                          const CTIcon =
                            CONTENT_TYPE_META[doc.contentType]?.icon ||
                            FALLBACK_ICONS.doc;
                          return (
                            <span
                              key={doc.path}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            >
                              <CTIcon className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{doc.label}</span>
                            </span>
                          );
                        })}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* All Docs */}
      {allDocLinks.length > 0 && (
        <section className="pb-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              All Documentation
            </h2>
            <div className="space-y-1">
              {allDocLinks.map((doc) => {
                const CTIcon =
                  CONTENT_TYPE_META[doc.contentType]?.icon || FALLBACK_ICONS.doc;
                return (
                  <Link
                    key={doc.path}
                    to={doc.path}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    prefetch="intent"
                  >
                    <CTIcon className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-oracle-600 dark:group-hover:text-oracle-400 transition-colors">
                        {doc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        {MODULE_META[doc.module]?.label || doc.module}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-oracle-400 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon Modules */}
      {comingSoonModules.length > 0 && (
        <section className="pb-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Coming Soon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {comingSoonModules.map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 opacity-60"
                  >
                    <Icon className="w-5 h-5 mb-1.5 text-gray-400 dark:text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Suhas Nidgundi</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs italic">Decoding Oracle, one table at a time.</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/suhasnidgundi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/suhasnidgundi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </footer>


      {/* Search dialog */}
      <SearchDialog
        searchIndex={searchIndex}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
