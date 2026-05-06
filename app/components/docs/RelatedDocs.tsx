import { Link } from "react-router";
import { CONTENT_TYPE_META, MODULE_META, FALLBACK_ICONS } from "~/lib/types";
import type { DocFrontmatter } from "~/lib/types";
import { Link2, ChevronRight } from "lucide-react";

interface RelatedDoc {
  slug: string;
  frontmatter: DocFrontmatter;
}

interface RelatedDocsProps {
  docs: RelatedDoc[];
}

export function RelatedDocs({ docs }: RelatedDocsProps) {
  if (docs.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Link2 className="w-[18px] h-[18px] text-gray-400" />
        Related Documentation
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => {
          const ctMeta = CONTENT_TYPE_META[doc.frontmatter.contentType];
          const modMeta = MODULE_META[doc.frontmatter.module];
          const CTIcon = ctMeta?.icon || FALLBACK_ICONS.doc;

          return (
            <Link
              key={doc.slug}
              to={`/docs/${doc.slug}`}
              className="group flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-oracle-200 dark:hover:border-oracle-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all"
              prefetch="intent"
            >
              <CTIcon
                className="w-5 h-5 mt-0.5 shrink-0"
                style={{ color: ctMeta?.color }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-oracle-600 dark:group-hover:text-oracle-400 transition-colors truncate">
                  {doc.frontmatter.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {modMeta?.label || doc.frontmatter.module}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: ctMeta?.color }}
                  >
                    {ctMeta?.label || doc.frontmatter.contentType}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-oracle-400 transition-colors mt-1 shrink-0 ml-auto" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
