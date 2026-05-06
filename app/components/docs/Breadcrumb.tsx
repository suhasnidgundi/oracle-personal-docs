import { Link } from "react-router";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
        <li>
          <Link
            to="/"
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
            {item.path && index < items.length - 1 ? (
              <Link
                to={item.path}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
