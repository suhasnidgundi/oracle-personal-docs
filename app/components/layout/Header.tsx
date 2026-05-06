import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Menu, X } from "lucide-react";

interface HeaderProps {
  onSearchOpen: () => void;
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onSearchOpen, onMenuToggle, isSidebarOpen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            id="menu-toggle"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group" id="logo-link">
            {/* Oracle-inspired logo mark */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-oracle-500 to-oracle-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-tight">
                Oracle Docs
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-oracle-100 text-oracle-700 dark:bg-oracle-900/30 dark:text-oracle-300">
                Personal
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-3 w-64 lg:w-80 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors bg-gray-50/50 dark:bg-gray-800/30"
          id="search-trigger"
        >
          <Search className="w-4 h-4" />
          <span>Search docs...</span>
          <kbd className="ml-auto hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[11px] font-mono text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
            ⌘K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search button */}
          <button
            onClick={onSearchOpen}
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Search"
            id="search-trigger-mobile"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <ThemeToggle />

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="GitHub"
            id="github-link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
