import { CONTENT_TYPE_META, MODULE_META, FALLBACK_ICONS } from "~/lib/types";
import type { SearchEntry } from "~/lib/types";
import { ChevronRight } from "lucide-react";

interface SearchResultProps {
  result: SearchEntry;
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResult({ result, isSelected, onClick }: SearchResultProps) {
  const ctMeta = CONTENT_TYPE_META[result.contentType];
  const modMeta = MODULE_META[result.module];

  const CTIcon = ctMeta?.icon || FALLBACK_ICONS.doc;
  const ModIcon = modMeta?.icon || FALLBACK_ICONS.module;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
        isSelected
          ? "bg-oracle-50 dark:bg-oracle-900/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
      id={`search-result-${result.slug.replace(/\//g, "-")}`}
    >
      {/* Icon */}
      <CTIcon
        className="w-4.5 h-4.5 mt-0.5 shrink-0"
        style={{ color: ctMeta?.color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {result.title}
          </span>
        </div>

        {/* Module & type badges */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            <ModIcon className="w-3 h-3" /> {result.module}
          </span>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
            style={{
              backgroundColor: ctMeta?.color ? `${ctMeta.color}15` : undefined,
              color: ctMeta?.color,
            }}
          >
            {ctMeta?.label || result.contentType}
          </span>
        </div>

        {/* Excerpt */}
        {result.excerpt && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {result.excerpt}
          </p>
        )}

        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {result.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 3 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                +{result.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow indicator when selected */}
      {isSelected && (
        <ChevronRight className="w-4 h-4 text-oracle-500 dark:text-oracle-400 mt-1 shrink-0" />
      )}
    </button>
  );
}
