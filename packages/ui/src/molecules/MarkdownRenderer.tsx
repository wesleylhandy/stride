'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { cn } from '../utils/cn';
import { MermaidDiagram } from './MermaidDiagram';
import { LinkPreview, type LinkPreviewData } from './LinkPreview';

// Import highlight.js styles (you can customize this)
// Note: highlight.js styles should be imported where the component is used
// or added to the global stylesheet. For now, syntax highlighting will work
// but styles may need to be added separately.

export interface MarkdownRendererProps {
  /**
   * Markdown content to render
   */
  content: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Enable Mermaid diagram rendering (default: true)
   */
  enableMermaid?: boolean;
  /**
   * Enable link preview rendering (default: true)
   */
  enableLinkPreviews?: boolean;
}

/**
 * Extract URLs from markdown text
 */
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * MarkdownRenderer component
 * 
 * Renders Markdown content with:
 * - GitHub Flavored Markdown support (tables, strikethrough, etc.)
 * - Code syntax highlighting
 * - HTML sanitization for security
 * - Table rendering
 * - Mermaid diagram rendering (T140)
 * - Link preview rendering (T150)
 */
export function MarkdownRenderer({
  content,
  className,
  enableMermaid = true,
  enableLinkPreviews = true,
}: MarkdownRendererProps) {
  // Extract URLs for link previews (T150)
  const [linkPreviews, setLinkPreviews] = React.useState<
    Map<string, LinkPreviewData>
  >(new Map());
  const [loadingPreviews, setLoadingPreviews] = React.useState<Set<string>>(
    new Set(),
  );

  // Extract and fetch link previews
  React.useEffect(() => {
    if (!enableLinkPreviews) return;

    const urls = extractUrls(content);
    const uniqueUrls = Array.from(new Set(urls));

    // Filter out URLs that are already loaded or loading
    const urlsToFetch = uniqueUrls.filter(
      (url) => !linkPreviews.has(url) && !loadingPreviews.has(url),
    );

    if (urlsToFetch.length === 0) return;

    // Fetch previews for new URLs
    urlsToFetch.forEach((url) => {
      setLoadingPreviews((prev) => new Set(prev).add(url));

      fetch(`/api/preview-link?url=${encodeURIComponent(url)}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((preview: LinkPreviewData | null) => {
          if (preview) {
            setLinkPreviews((prev) => {
              const next = new Map(prev);
              next.set(url, preview);
              return next;
            });
          }
        })
        .catch((error) => {
          console.error(`Failed to fetch preview for ${url}:`, error);
        })
        .finally(() => {
          setLoadingPreviews((prev) => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        });
    });
  }, [content, enableLinkPreviews, linkPreviews, loadingPreviews]);
  return (
    <div
      className={cn(
        'prose prose-slate dark:prose-invert',
        'prose-headings:font-semibold',
        'prose-code:text-sm prose-code:bg-background-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-background-secondary prose-pre:border prose-pre:border-border',
        'prose-blockquote:border-l-4 prose-blockquote:border-primary',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2',
        'prose-td:border prose-td:border-border prose-td:p-2',
        'max-w-none',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw, // Allow raw HTML (will be sanitized)
          [
            rehypeSanitize,
            {
              // Allow common HTML tags used in markdown
              tagNames: [
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'p',
                'br',
                'strong',
                'em',
                'u',
                's',
                'del',
                'code',
                'pre',
                'blockquote',
                'ul',
                'ol',
                'li',
                'a',
                'img',
                'table',
                'thead',
                'tbody',
                'tr',
                'th',
                'td',
                'hr',
              ],
              attributes: {
                '*': ['className'],
                a: ['href', 'title', 'target', 'rel'],
                img: ['src', 'alt', 'title', 'width', 'height'],
                code: ['className'],
                pre: ['className'],
              },
            },
          ],
          rehypeHighlight, // Syntax highlighting for code blocks
        ]}
        components={{
          // Customize code blocks - handle Mermaid diagrams (T140)
          code: (props) => {
            const { node: _node, inline, className, children, ...restProps } = props as { node?: unknown; inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: unknown };
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : null;
            const codeContent = String(children).replace(/\n$/, '');

            // Render Mermaid diagrams
            if (!inline && language === 'mermaid' && enableMermaid) {
              // Generate unique ID from content hash
              const diagramId = `mermaid-${btoa(codeContent)
                .replace(/[^a-zA-Z0-9]/g, '')
                .substring(0, 10)}`;

              return (
                <MermaidDiagram
                  key={diagramId}
                  code={codeContent}
                  id={diagramId}
                  className="my-4"
                />
              );
            }

            // Regular code blocks
            return (
              <code className={className} {...(restProps as React.HTMLAttributes<HTMLElement>)}>
                {children}
              </code>
            );
          },
          // Customize pre blocks to handle Mermaid
          pre({ children, ...props }) {
            // Check if this pre contains a Mermaid code block
            const child = React.Children.only(children) as React.ReactElement<{ className?: string }>;
            if (
              child?.props?.className?.includes('language-mermaid') &&
              enableMermaid
            ) {
              // MermaidDiagram is already rendered in the code component
              return <>{children}</>;
            }

            return <pre {...props}>{children}</pre>;
          },
          // Customize links - render link previews (T150)
          a({ node, href, children, ...props }) {
            if (!href || !enableLinkPreviews) {
              return (
                <a href={href} {...props}>
                  {children}
                </a>
              );
            }

            const preview = linkPreviews.get(href);
            const isLoading = loadingPreviews.has(href);

            // If we have a preview, render it
            if (preview) {
              return (
                <div className="my-4">
                  <LinkPreview preview={preview} />
                </div>
              );
            }

            // If loading, show link with loading indicator
            if (isLoading) {
              return (
                <a
                  href={href}
                  {...props}
                  className="inline-flex items-center gap-1"
                >
                  {children}
                  <span className="text-xs text-foreground-secondary">
                    (loading preview...)
                  </span>
                </a>
              );
            }

            // Regular link (preview not available or not fetched yet)
            return (
              <a href={href} {...props}>
                {children}
              </a>
            );
          },
          // Customize tables for better styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse">
                  {children}
                </table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

