import { Link } from "react-router";
import type { Route } from "./+types/module";
import {
  getDocsByModule,
  getModuleStats,
  getNavTree,
  getSearchIndex,
} from "~/lib/content.server";
import {
  MODULE_META,
  CONTENT_TYPE_META,
  FALLBACK_ICONS,
} from "~/lib/types";
import { DocsLayout } from "~/components/layout/DocsLayout";
import {
  ArrowRight,
  Clock,
  BookOpen,
} from "lucide-react";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.moduleMeta) {
    return [{ title: "Module Not Found — Oracle Personal Docs" }];
  }
  return [
    {
      title: `${data.moduleMeta.label} — Oracle Personal Docs`,
    },
    {
      name: "description",
      content: `${data.moduleMeta.label} (${data.moduleMeta.description}) — Explore tables, concepts, flows, and queries for Oracle Fusion ${data.moduleMeta.label}.`,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const moduleKey = params.module;
  if (!moduleKey) throw new Response("Not Found", { status: 404 });

  const moduleMeta = MODULE_META[moduleKey];
  if (!moduleMeta) throw new Response("Not Found", { status: 404 });

  const docs = getDocsByModule(moduleKey);
  const stats = getModuleStats(moduleKey);
  const navTree = getNavTree();
  const searchIndex = getSearchIndex();

  // Group docs by content type for display
  const docsByType: Record<string, typeof docs> = {};
  for (const doc of docs) {
    const ct = doc.frontmatter.contentType;
    if (!docsByType[ct]) docsByType[ct] = [];
    docsByType[ct].push(doc);
  }

  return {
    moduleKey,
    moduleMeta: {
      label: moduleMeta.label,
      description: moduleMeta.description,
    },
    stats,
    docsByType,
    navTree,
    searchIndex,
  };
}

export default function ModulePage({ loaderData }: Route.ComponentProps) {
  const { moduleKey, moduleMeta, stats, docsByType, navTree, searchIndex } =
    loaderData;

  const ModuleIcon = MODULE_META[moduleKey]?.icon || FALLBACK_ICONS.module;

  const contentTypes = [
    { key: "table", plural: "Tables", count: stats.tables },
    { key: "concept", plural: "Concepts", count: stats.concepts },
    { key: "flow", plural: "Flows", count: stats.flows },
    { key: "query", plural: "Queries", count: stats.queries },
  ].filter((ct) => ct.count > 0);

  return (
    <DocsLayout navTree={navTree} searchIndex={searchIndex}>
      <article className="animate-fade-in-up">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-oracle-500 to-oracle-600 flex items-center justify-center shadow-lg">
              <ModuleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                {moduleMeta.label}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {moduleMeta.description}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-1.5 text-gray-400" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalDocs}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Docs
            </div>
          </div>
          {contentTypes.map((ct) => {
            const ctMeta = CONTENT_TYPE_META[ct.key];
            const Icon = ctMeta?.icon || FALLBACK_ICONS.doc;
            return (
              <div
                key={ct.key}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 text-center"
              >
                <Icon
                  className="w-5 h-5 mx-auto mb-1.5"
                  style={{ color: ctMeta?.color }}
                />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {ct.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {ct.plural}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-modules */}
        {stats.subModules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Sub-modules
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.subModules.map((sm) => (
                <span
                  key={sm}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-oracle-50 dark:bg-oracle-900/20 text-oracle-700 dark:text-oracle-300 border border-oracle-100 dark:border-oracle-800/30"
                >
                  {sm.toUpperCase().replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Type Cards — link to list views */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {contentTypes.map((ct) => {
            const ctMeta = CONTENT_TYPE_META[ct.key];
            const Icon = ctMeta?.icon || FALLBACK_ICONS.doc;
            return (
              <Link
                key={ct.key}
                to={`/docs/${moduleKey}/${ct.key}s`}
                className="group p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-oracle-200 dark:hover:border-oracle-800/50 hover:shadow-lg transition-all"
                prefetch="intent"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: ctMeta?.color
                        ? `${ctMeta.color}15`
                        : undefined,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: ctMeta?.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-oracle-600 dark:group-hover:text-oracle-400 transition-colors">
                      {ct.plural}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {ct.count} document{ct.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-oracle-500 dark:text-oracle-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Docs by Type */}
        {contentTypes.map((ct) => {
          const docs = docsByType[ct.key] || [];
          const ctMeta = CONTENT_TYPE_META[ct.key];
          const Icon = ctMeta?.icon || FALLBACK_ICONS.doc;
          if (docs.length === 0) return null;

          return (
            <section key={ct.key} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <Icon
                    className="w-4.5 h-4.5"
                    style={{ color: ctMeta?.color }}
                  />
                  {ct.plural}
                </h2>
                <Link
                  to={`/docs/${moduleKey}/${ct.key}s`}
                  className="text-xs text-oracle-500 hover:text-oracle-600 dark:text-oracle-400 dark:hover:text-oracle-300 font-medium flex items-center gap-1 transition-colors"
                  prefetch="intent"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-1">
                {docs.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.slug}
                    to={`/docs/${doc.slug}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    prefetch="intent"
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: ctMeta?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-oracle-600 dark:group-hover:text-oracle-400 transition-colors">
                        {doc.frontmatter.title}
                      </span>
                      {doc.frontmatter.subModule && (
                        <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500 uppercase">
                          {doc.frontmatter.subModule}
                        </span>
                      )}
                    </div>
                    {doc.frontmatter.difficulty && (
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
                        {doc.frontmatter.difficulty}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-oracle-400 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </article>
    </DocsLayout>
  );
}
