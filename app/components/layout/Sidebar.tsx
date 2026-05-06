import { NavLink, useLocation } from "react-router";
import type { NavItem } from "~/lib/types";
import { CONTENT_TYPE_META, MODULE_META, FALLBACK_ICONS } from "~/lib/types";
import { useState, useEffect } from "react";
import { ChevronRight, FolderOpen } from "lucide-react";

interface SidebarProps {
  navTree: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

function NavSection({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand if current path is under this section
  useEffect(() => {
    if (item.children) {
      const isActive = item.children.some((child) => {
        if (child.path && location.pathname === child.path) return true;
        if (child.children) {
          return child.children.some(
            (grandchild) => grandchild.path && location.pathname === grandchild.path
          );
        }
        return false;
      });
      if (isActive) setIsExpanded(true);
    }
  }, [location.pathname, item.children]);

  const hasChildren = item.children && item.children.length > 0;

  // Module-level header
  if (depth === 0 && hasChildren) {
    const moduleMeta = MODULE_META[item.module || ""];
    const Icon = moduleMeta?.icon || FALLBACK_ICONS.module;
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <Icon className="w-4 h-4" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>
        {isExpanded && (
          <div className="mt-0.5 animate-fade-in">
            {item.children!.map((child, idx) => (
              <NavSection key={idx} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Content type group (e.g., "Tables", "Flows")
  if (depth === 1 && hasChildren) {
    const ctMeta = CONTENT_TYPE_META[item.contentType || ""];
    const Icon = ctMeta?.icon || FALLBACK_ICONS.doc;
    return (
      <div className="mb-0.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-3 py-1.5 ml-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <Icon className="w-3.5 h-3.5" style={{ color: ctMeta?.color }} />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight
            className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>
        {isExpanded && (
          <div className="mt-0.5 ml-2 border-l border-gray-200 dark:border-gray-800 animate-fade-in">
            {item.children!.map((child, idx) => (
              <NavSection key={idx} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Leaf node (individual doc page)
  if (item.path) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-1.5 ml-4 text-[13px] rounded-md transition-all duration-150 ${
            isActive
              ? "text-oracle-600 dark:text-oracle-400 bg-oracle-50 dark:bg-oracle-900/20 font-medium"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }`
        }
        prefetch="intent"
      >
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  }

  return null;
}

export function Sidebar({ navTree, isOpen, onClose }: SidebarProps) {
  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-[var(--sidebar-width)] bg-white dark:bg-[#0f1117] border-r border-gray-200/80 dark:border-gray-800/80 overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="sidebar"
      >
        <nav className="p-3 pb-20" aria-label="Documentation navigation">
          {/* Nav tree */}
          <div className="space-y-1">
            {navTree.map((item, idx) => (
              <NavSection key={idx} item={item} />
            ))}
          </div>

          {/* Empty state */}
          {navTree.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No documentation yet.
              </p>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
