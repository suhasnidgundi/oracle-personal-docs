import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "./CodeBlock";
import { MermaidDiagram } from "./MermaidDiagram";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

// Generate slug from heading text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    // Headings with anchor links
    h1: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h1 id={id} className="group" {...props}>
          {children}
          <a
            href={`#${id}`}
            className="ml-2 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-oracle-500 dark:hover:text-oracle-400 transition-opacity no-underline"
            aria-label={`Link to ${text}`}
          >
            #
          </a>
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h2 id={id} className="group" {...props}>
          {children}
          <a
            href={`#${id}`}
            className="ml-2 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-oracle-500 dark:hover:text-oracle-400 transition-opacity no-underline"
            aria-label={`Link to ${text}`}
          >
            #
          </a>
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <h3 id={id} className="group" {...props}>
          {children}
          <a
            href={`#${id}`}
            className="ml-2 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-oracle-500 dark:hover:text-oracle-400 transition-opacity no-underline"
            aria-label={`Link to ${text}`}
          >
            #
          </a>
        </h3>
      );
    },

    // Code blocks with mermaid detection
    pre: ({ children }) => {
      // pre > code pattern
      return <>{children}</>;
    },
    code: ({ children, className, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : undefined;
      const codeString = String(children).replace(/\n$/, "");

      // Check if it's an inline code or block code
      const isInline = !className && !codeString.includes("\n");

      if (isInline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      // Mermaid diagrams
      if (language === "mermaid") {
        return <MermaidDiagram chart={codeString} />;
      }

      // Regular code blocks
      return (
        <CodeBlock language={language} className={className}>
          {codeString}
        </CodeBlock>
      );
    },

    // Tables with enhanced styling
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full" {...props}>
          {children}
        </table>
      </div>
    ),

    // Links
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
          {isExternal && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block ml-1 mb-0.5"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          )}
        </a>
      );
    },

    // Images
    img: ({ src, alt, ...props }) => (
      <figure className="my-6">
        <img
          src={src}
          alt={alt || ""}
          className="rounded-lg border border-gray-200 dark:border-gray-800"
          loading="lazy"
          {...props}
        />
        {alt && (
          <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
  };

  return (
    <div className="prose animate-fade-in-up">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Helper to extract text from React children
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (typeof children === "object" && children !== null && "props" in children) {
    return extractText((children as React.ReactElement).props.children);
  }
  return "";
}
