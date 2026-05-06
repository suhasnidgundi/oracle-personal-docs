import {
  CONTENT_TYPE_META,
  MODULE_META,
  DIFFICULTY_META,
  STATUS_META,
  FALLBACK_ICONS,
} from "~/lib/types";
import type { DocFrontmatter } from "~/lib/types";

interface DocMetaProps {
  frontmatter: DocFrontmatter;
}

export function DocMeta({ frontmatter }: DocMetaProps) {
  const ctMeta = CONTENT_TYPE_META[frontmatter.contentType];
  const modMeta = MODULE_META[frontmatter.module];
  const diffMeta = frontmatter.difficulty
    ? DIFFICULTY_META[frontmatter.difficulty]
    : null;
  const statMeta = frontmatter.status
    ? STATUS_META[frontmatter.status]
    : null;

  const ModIcon = modMeta?.icon || FALLBACK_ICONS.module;
  const CTIcon = ctMeta?.icon || FALLBACK_ICONS.doc;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {/* Module badge */}
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
        <ModIcon className="w-3.5 h-3.5" />
        {modMeta?.label || frontmatter.module.toUpperCase()}
        {frontmatter.subModule && (
          <span className="text-gray-400 dark:text-gray-500">
            / {frontmatter.subModule.toUpperCase()}
          </span>
        )}
      </span>

      {/* Content type badge */}
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
        style={{
          backgroundColor: ctMeta?.color ? `${ctMeta.color}15` : undefined,
          color: ctMeta?.color,
        }}
      >
        <CTIcon className="w-3.5 h-3.5" />
        {ctMeta?.label || frontmatter.contentType}
      </span>

      {/* Difficulty badge */}
      {diffMeta && (
        <span
          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
          style={{
            backgroundColor: `${diffMeta.color}15`,
            color: diffMeta.color,
          }}
        >
          {diffMeta.label}
        </span>
      )}

      {/* Status badge */}
      {statMeta && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
          style={{
            backgroundColor: `${statMeta.color}15`,
            color: statMeta.color,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statMeta.color }}
          />
          {statMeta.label}
        </span>
      )}

      {/* Last updated */}
      {frontmatter.lastUpdated && (
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          Updated {frontmatter.lastUpdated}
        </span>
      )}
    </div>
  );
}
