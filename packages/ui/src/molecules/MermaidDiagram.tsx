'use client';

import * as React from 'react';
import mermaid from 'mermaid';
import { cn } from '../utils/cn';

export interface MermaidDiagramProps {
  /**
   * Mermaid diagram code
   */
  code: string;
  /**
   * Unique ID for this diagram instance
   */
  id: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MermaidDiagram component
 * 
 * Renders Mermaid diagrams client-side with error handling and lazy loading support.
 */
export function MermaidDiagram({
  code,
  id,
  className,
}: MermaidDiagramProps) {
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Initialize Mermaid on mount
  React.useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, []);

  // Render diagram
  React.useEffect(() => {
    if (!code.trim() || !containerRef.current) return;

    setIsLoading(true);
    setError(null);

    const renderDiagram = async () => {
      try {
        // Generate unique ID for this diagram
        const diagramId = `mermaid-${id}`;
        
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(diagramId, code);
        
        setSvg(renderedSvg);
        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to render diagram';
        setError(errorMessage);
        setIsLoading(false);
        console.error('Mermaid rendering error:', err);
      }
    };

    // Small delay for better UX (lazy loading effect - T143)
    const timeoutId = setTimeout(renderDiagram, 100);

    return () => clearTimeout(timeoutId);
  }, [code, id]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 bg-background-secondary rounded-lg border border-border',
          className
        )}
      >
        <div className="text-sm text-foreground-secondary">Rendering diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'p-4 bg-error-light border border-error rounded-lg',
          className
        )}
      >
        <div className="text-sm font-medium text-error-dark mb-1">
          Diagram Error
        </div>
        <div className="text-xs text-error-dark/80">{error}</div>
        <details className="mt-2">
          <summary className="text-xs text-error-dark/60 cursor-pointer">
            Show diagram code
          </summary>
          <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'mermaid-diagram flex items-center justify-center p-4 bg-background-secondary rounded-lg border border-border overflow-auto',
        className
      )}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

