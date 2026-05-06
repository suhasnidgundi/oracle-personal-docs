import { Breadcrumb } from "./Breadcrumb";
import { DocMeta } from "./DocMeta";
import { RelatedDocs } from "./RelatedDocs";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import type { DocEntry, DocFrontmatter } from "~/lib/types";
import { MODULE_META } from "~/lib/types";

interface RelatedDoc {
  slug: string;
  frontmatter: DocFrontmatter;
}

interface DocPageProps {
  doc: DocEntry;
  relatedDocs: RelatedDoc[];
}

export function DocPage({ doc, relatedDocs }: DocPageProps) {
  const { frontmatter, slug, content } = doc;
  const moduleMeta = MODULE_META[frontmatter.module];

  // Build breadcrumb items with navigation paths
  const slugParts = slug.split("/");
  const breadcrumbItems = [
    {
      label: moduleMeta?.label || frontmatter.module.toUpperCase(),
      path: `/docs/${frontmatter.module}`,
    },
    ...(slugParts.length > 2
      ? [
          {
            label:
              slugParts[1].charAt(0).toUpperCase() + slugParts[1].slice(1),
            path: `/docs/${frontmatter.module}/${slugParts[1]}`,
          },
        ]
      : []),
    {
      label: frontmatter.title,
    },
  ];

  return (
    <article className="animate-fade-in-up">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-4 leading-tight">
        {frontmatter.title}
      </h1>

      {/* Metadata */}
      <DocMeta frontmatter={frontmatter} />

      {/* Tags */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {frontmatter.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-default"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Markdown content */}
      <MarkdownRenderer content={content} />

      {/* Related docs */}
      <RelatedDocs docs={relatedDocs} />

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          {frontmatter.aliases && frontmatter.aliases.length > 0 && (
            <span>
              Also known as:{" "}
              {frontmatter.aliases.map((alias, i) => (
                <span key={alias}>
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px]">
                    {alias}
                  </code>
                  {i < frontmatter.aliases!.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}
