import type { LucideIcon } from "lucide-react";
import {
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Wallet,
  Link2,
  Table2,
  GitBranch,
  Lightbulb,
  Search,
  BookOpen,
  FileText,
} from "lucide-react";

// ─── Frontmatter Schema ────────────────────────────────────────────
export interface DocFrontmatter {
  title: string;
  module: string; // "hcm" | "scm" | "finance" | "procurement" | "payroll"
  subModule?: string; // "otl" | "workforce-management" etc.
  contentType: string; // "table" | "flow" | "concept" | "query"
  tags: string[];
  related?: string[]; // slugs of related docs
  aliases?: string[]; // alternative names for search
  difficulty?: "beginner" | "intermediate" | "advanced";
  status?: "draft" | "review" | "published";
  lastUpdated?: string; // ISO date string
}

// ─── Parsed Document ───────────────────────────────────────────────
export interface DocEntry {
  slug: string; // e.g., "hcm/tables/hwm-time-records"
  frontmatter: DocFrontmatter;
  content: string; // raw markdown body (without frontmatter)
}

// ─── Navigation ────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  path?: string; // if it's a link
  children?: NavItem[];
  contentType?: string;
  module?: string;
  isExpanded?: boolean;
}

// ─── Search ────────────────────────────────────────────────────────
export interface SearchEntry {
  title: string;
  slug: string;
  module: string;
  subModule?: string;
  contentType: string;
  tags: string[];
  excerpt: string; // first ~150 chars of content
  difficulty?: string;
}

// ─── Content Type Metadata ─────────────────────────────────────────
export const CONTENT_TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  table: { label: "Table", icon: Table2, color: "var(--color-accent-table)" },
  flow: { label: "Flow", icon: GitBranch, color: "var(--color-accent-flow)" },
  concept: {
    label: "Concept",
    icon: Lightbulb,
    color: "var(--color-accent-concept)",
  },
  query: { label: "Query", icon: Search, color: "var(--color-accent-query)" },
};

// ─── Module Metadata ───────────────────────────────────────────────
export const MODULE_META: Record<
  string,
  { label: string; description: string; icon: LucideIcon }
> = {
  hcm: {
    label: "HCM",
    description: "Human Capital Management",
    icon: Users,
  },
  scm: {
    label: "SCM",
    description: "Supply Chain Management",
    icon: Package,
  },
  finance: {
    label: "Finance",
    description: "Financial Management",
    icon: DollarSign,
  },
  procurement: {
    label: "Procurement",
    description: "Procurement & Sourcing",
    icon: ShoppingCart,
  },
  payroll: {
    label: "Payroll",
    description: "Payroll Management",
    icon: Wallet,
  },
  integrations: {
    label: "Integrations",
    description: "APIs & Integrations",
    icon: Link2,
  },
};

// ─── Fallback Icons ────────────────────────────────────────────────
export const FALLBACK_ICONS = {
  doc: FileText,
  module: BookOpen,
} as const;

// ─── Difficulty Metadata ───────────────────────────────────────────
export const DIFFICULTY_META: Record<
  string,
  { label: string; color: string }
> = {
  beginner: { label: "Beginner", color: "#10b981" },
  intermediate: { label: "Intermediate", color: "#f59e0b" },
  advanced: { label: "Advanced", color: "#ef4444" },
};

// ─── Status Metadata ───────────────────────────────────────────────
export const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#94a3b8" },
  review: { label: "In Review", color: "#f59e0b" },
  published: { label: "Published", color: "#10b981" },
};
