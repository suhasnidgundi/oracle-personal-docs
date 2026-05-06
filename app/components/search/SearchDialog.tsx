import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { initializeSearch, search } from "~/lib/search";
import { SearchResult } from "./SearchResult";
import type { SearchEntry } from "~/lib/types";

interface SearchDialogProps {
  searchIndex: SearchEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ searchIndex, isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Initialize Fuse.js with search index
  useEffect(() => {
    if (searchIndex.length > 0) {
      initializeSearch(searchIndex);
    }
  }, [searchIndex]);

  // Keyboard shortcut: ⌘K / Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // We need to trigger open from outside
          // This is handled by the parent component
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults = search(query);
    setResults(searchResults.map((r) => r.item));
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [results, selectedIndex, onClose]
  );

  const navigateToResult = useCallback(
    (result: SearchEntry) => {
      navigate(`/docs/${result.slug}`);
      onClose();
    },
    [navigate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" id="search-dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#161822] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-scale-in overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 dark:text-gray-500 shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tables, flows, concepts..."
            className="flex-1 py-4 text-base bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            id="search-input"
          />
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results found for "<span className="font-medium text-gray-700 dark:text-gray-300">{query}</span>"
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try different keywords or check the sidebar navigation
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <SearchResult
                  key={result.slug}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => navigateToResult(result)}
                />
              ))}
            </div>
          )}

          {!query && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start typing to search documentation
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">↵</kbd>
                  Open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">ESC</kbd>
                  Close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500">
            <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
            <span>Powered by Fuse.js</span>
          </div>
        )}
      </div>
    </div>
  );
}
