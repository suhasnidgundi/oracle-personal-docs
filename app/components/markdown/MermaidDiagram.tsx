import { useState, useEffect, useRef, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const renderDiagram = useCallback(async () => {
    try {
      // Dynamic import for client-only
      const mermaid = (await import("mermaid")).default;

      const isDark = document.documentElement.classList.contains("dark");

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        themeVariables: isDark
          ? {
              primaryColor: "#1e2030",
              primaryTextColor: "#e5e7eb",
              primaryBorderColor: "#374151",
              lineColor: "#6b7280",
              secondaryColor: "#161822",
              tertiaryColor: "#0f1117",
            }
          : {
              primaryColor: "#f0f4ff",
              primaryTextColor: "#1f2937",
              primaryBorderColor: "#d1d5db",
              lineColor: "#6b7280",
            },
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        securityLevel: "loose",
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
      setSvg(renderedSvg);
      setError(null);
    } catch (err) {
      console.error("Mermaid render error:", err);
      setError(err instanceof Error ? err.message : "Failed to render diagram");
    } finally {
      setIsLoading(false);
    }
  }, [chart]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  // Re-render on theme change
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          setIsLoading(true);
          renderDiagram();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [renderDiagram]);

  if (isLoading) {
    return (
      <div className="mermaid-wrapper">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Rendering diagram...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mermaid-wrapper border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
        <div className="text-sm text-red-600 dark:text-red-400">
          <p className="font-medium mb-1">⚠️ Diagram Error</p>
          <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrapper animate-fade-in"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
