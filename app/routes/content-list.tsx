import { Link } from "react-router";
import type { Route } from "./+types/content-list";
import {
  getDocsByContentType,
  getNavTree,
  getSearchIndex,
} from "~/lib/content.server";
import {
  MODULE_META,
  CONTENT_TYPE_META,
  DIFFICULTY_META,
  FALLBACK_ICONS,
} from "~/lib/types";
import { DocsLayout } from "~/components/layout/DocsLayout";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";

// Map plural route param to singular content type
function singularize(plural: string): string {
  const map: Record<string, string> = {
    tables: "table",
    flows: "flow",
    concepts: "concept",
    queries: "query",
  };
  return map[plural] || plural;
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.moduleMeta || !data?.ctMeta) {
    return [{ title: "Not Found — Oracle Personal Docs" }];
  }
  return [
    {
      title: `${data.ctMeta.label}s — ${data.moduleMeta.label} — Oracle Personal Docs`,
    },
    {
      name: "description",
      content: `Browse all ${data.ctMeta.label.toLowerCase()}s in the ${data.moduleMeta.label} module of Oracle Fusion.`,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const moduleKey = params.module;
  const contentTypePlural = params.contentType;
  if (!moduleKey || !contentTypePlural) {
    throw new Response("Not Found", { status: 404 });
  }

  const contentType = singularize(contentTypePlural);
  const moduleMeta = MODULE_META[moduleKey];
  const ctMeta = CONTENT_TYPE_META[contentType];

  if (!moduleMeta || !ctMeta) {
    throw new Response("Not Found", { status: 404 });
  }

  const docs = getDocsByContentType(moduleKey, contentType);
  const navTree = getNavTree();
  const searchIndex = getSearchIndex();

  return {
    moduleKey,
    contentType,
    contentTypePlural,
    moduleMeta: { label: moduleMeta.label, description: moduleMeta.description },
    ctMeta: { label: ctMeta.label, color: ctMeta.color },
    docs: docs.map((d) => ({
      slug: d.slug,
      frontmatter: d.frontmatter,
      excerpt: d.content
        .slice(0, 250)
        .replace(/[#*_`>\[\]]/g, "")
        .replace(/---[\s\S]*?---/, "")
        .trim(),
    })),
    navTree,
    searchIndex,
  };
}

export default function ContentListPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    moduleKey,
    contentTypePlural,
    moduleMeta,
    ctMeta,
    docs,
    navTree,
    searchIndex,
  } = loaderData;

  const ModuleIcon = MODULE_META[moduleKey]?.icon || FALLBACK_ICONS.module;
  const ContentIcon =
    CONTENT_TYPE_META[singularize(contentTypePlural)]?.icon ||
    FALLBACK_ICONS.doc;

  return (
    <DocsLayout navTree={navTree} searchIndex={searchIndex}>
      <article className="animate-fade-in-up">
        {/* Back link */}
        <Link
          to={`/docs/${moduleKey}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-oracle-600 dark:hover:text-oracle-400 transition-colors mb-6"
          prefetch="intent"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {moduleMeta.label}
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: ctMeta.color ? `${ctMeta.color}15` : undefined,
            }}
          >
            <ContentIcon
              className="w-5 h-5"
              style={{ color: ctMeta.color }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              {ctMeta.label}s
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <ModuleIcon className="w-3.5 h-3.5" />
              {moduleMeta.label} · {docs.length} document
              {docs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b border-gray-200 dark:border-gray-800 my-6" />

        {/* Doc list */}
        {docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <ContentIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No {ctMeta.label.toLowerCase()}s yet</p>
            <p className="text-sm mt-1">
              Check back soon — content is being added.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => {
              const diffMeta = doc.frontmatter.difficulty
                ? DIFFICULTY_META[doc.frontmatter.difficulty]
                : null;

              return (
                <Link
                  key={doc.slug}
                  to={`/docs/${doc.slug}`}
                  className="block p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-oracle-200 dark:hover:border-oracle-800/50 hover:shadow-md transition-all group"
                  prefetch="intent"
                  id={`doc-${doc.slug.replace(/\//g, "-")}`}
                >
                  <div className="flex items-start gap-3">
                    <ContentIcon
                      className="w-4.5 h-4.5 mt-0.5 shrink-0"
                      style={{ color: ctMeta.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-oracle-600 dark:group-hover:text-oracle-400 transition-colors truncate">
                          {doc.frontmatter.title}
                        </h3>
                        {diffMeta && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              backgroundColor: `${diffMeta.color}15`,
                              color: diffMeta.color,
                            }}
                          >
                            {diffMeta.label}
                          </span>
                        )}
                      </div>

                      {doc.excerpt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                          {doc.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.frontmatter.subModule && (
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {doc.frontmatter.subModule}
                          </span>
                        )}
                        {doc.frontmatter.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-gray-400 dark:text-gray-500"
                          >
                            #{tag}
                          </span>
                        ))}
                        {doc.frontmatter.lastUpdated && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 ml-auto">
                            <Clock className="w-3 h-3" />
                            {doc.frontmatter.lastUpdated}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-oracle-400 transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </article>
    </DocsLayout>
  );
}
