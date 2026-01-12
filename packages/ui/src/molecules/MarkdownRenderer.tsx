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
import { CodeBlock } from './CodeBlock';

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
 * Generate anchor ID from heading text (GitHub-style)
 * Converts "Updating Stride" to "updating-stride"
 */
function generateAnchorId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract text content from React node
 */
function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join('');
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    if (element.props?.children) {
      return extractTextContent(element.props.children);
    }
  }
  return '';
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
        'prose-headings:font-semibold prose-headings:text-foreground dark:prose-headings:text-foreground-dark',
        'prose-p:text-foreground-secondary dark:prose-p:text-foreground-dark-secondary',
        'prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono',
        // Remove prose-pre styles - CodeBlock component handles all pre styling
        'prose-pre:p-0 prose-pre:border-0 prose-pre:m-0',
        'prose-blockquote:border-l-4 prose-blockquote:border-primary dark:prose-blockquote:border-primary-dark prose-blockquote:text-foreground-secondary dark:prose-blockquote:text-foreground-dark-secondary',
        'prose-a:text-primary dark:prose-a:text-primary-dark prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground dark:prose-strong:text-foreground-dark prose-strong:font-semibold',
        'prose-ul:text-foreground-secondary dark:prose-ul:text-foreground-dark-secondary',
        'prose-ol:text-foreground-secondary dark:prose-ol:text-foreground-dark-secondary',
        'prose-li:text-foreground-secondary dark:prose-li:text-foreground-dark-secondary',
        'prose-table:border-collapse prose-th:border prose-th:border-border dark:prose-th:border-border-dark prose-th:p-2 prose-th:bg-gray-50 dark:prose-th:bg-gray-900',
        'prose-td:border prose-td:border-border dark:prose-td:border-border-dark prose-td:p-2',
        // Heading anchor link styles - ensure headings have relative positioning and group for hover
        'prose-headings:relative prose-headings:group',
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
                '*': ['className', 'id'],
                a: ['href', 'title', 'target', 'rel', 'aria-label'],
                img: ['src', 'alt', 'title', 'width', 'height'],
                code: ['className'],
                pre: ['className'],
              },
            },
          ],
          rehypeHighlight, // Syntax highlighting for code blocks
        ]}
        components={{
          // Customize headings - add anchor links with hover visibility
          h1: (props) => {
            const { children, ...restProps } = props;
            const text = extractTextContent(children);
            const anchorId = generateAnchorId(text);
            return (
              <h1 id={anchorId} className="group relative scroll-mt-20" {...restProps}>
                <a
                  href={`#${anchorId}`}
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary dark:text-foreground-dark-secondary hover:text-primary dark:hover:text-primary-dark no-underline font-normal"
                  aria-label={`Link to ${text}`}
                  title={`Link to ${text}`}
                >
                  #
                </a>
                {children}
              </h1>
            );
          },
          h2: (props) => {
            const { children, ...restProps } = props;
            const text = extractTextContent(children);
            const anchorId = generateAnchorId(text);
            return (
              <h2 id={anchorId} className="group relative scroll-mt-20" {...restProps}>
                <a
                  href={`#${anchorId}`}
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary dark:text-foreground-dark-secondary hover:text-primary dark:hover:text-primary-dark no-underline font-normal"
                  aria-label={`Link to ${text}`}
                  title={`Link to ${text}`}
                >
                  #
                </a>
                {children}
              </h2>
            );
          },
          h3: (props) => {
            const { children, ...restProps } = props;
            const text = extractTextContent(children);
            const anchorId = generateAnchorId(text);
            return (
              <h3 id={anchorId} className="group relative scroll-mt-20" {...restProps}>
                <a
                  href={`#${anchorId}`}
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary dark:text-foreground-dark-secondary hover:text-primary dark:hover:text-primary-dark no-underline font-normal"
                  aria-label={`Link to ${text}`}
                  title={`Link to ${text}`}
                >
                  #
                </a>
                {children}
              </h3>
            );
          },
          h4: (props) => {
            const { children, ...restProps } = props;
            const text = extractTextContent(children);
            const anchorId = generateAnchorId(text);
            return (
              <h4 id={anchorId} className="group relative scroll-mt-20" {...restProps}>
                <a
                  href={`#${anchorId}`}
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary dark:text-foreground-dark-secondary hover:text-primary dark:hover:text-primary-dark no-underline font-normal"
                  aria-label={`Link to ${text}`}
                  title={`Link to ${text}`}
                >
                  #
                </a>
                {children}
              </h4>
            );
          },
          h5: (props) => {
            const { children, ...restProps } = props;
            const text = extractTextContent(children);
            const anchorId = generateAnchorId(text);
            return (
              <h5 id={anchorId} className="group relative scroll-mt-20" {...restProps}>
                <a
                  href={`#${anchorId}`}
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary dark:text-foreground-dark-secondary hover:text-primary dark:hover:text-primary-dark no-underline font-normal"
                  aria-label={`Link to ${text}`}
                  title={`Link to ${text}`}
                >
                  #
                </a>
                {children}
              </h5>
            );
          },
          h6: (props) => {
            const { children, ...restProps } = props;
            const text = extractTextContent(children);
            const anchorId = generateAnchorId(text);
            return (
              <h6 id={anchorId} className="group relative scroll-mt-20" {...restProps}>
                <a
                  href={`#${anchorId}`}
                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary dark:text-foreground-dark-secondary hover:text-primary dark:hover:text-primary-dark no-underline font-normal"
                  aria-label={`Link to ${text}`}
                  title={`Link to ${text}`}
                >
                  #
                </a>
                {children}
              </h6>
            );
          },
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
          // Customize pre blocks to handle Mermaid and use CodeBlock
          pre({ children }) {
            // Check if this pre contains a Mermaid code block
            const child = React.Children.only(children) as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
            if (
              child?.props?.className?.includes('language-mermaid') &&
              enableMermaid
            ) {
              // MermaidDiagram is already rendered in the code component
              return <>{children}</>;
            }

            // Extract language and content from code element
            const codeElement = child as React.ReactElement<{ className?: string; children?: React.ReactNode; dangerouslySetInnerHTML?: { __html: string } }>;
            const className = codeElement?.props?.className || '';
            const match = /language-(\w+)/.exec(className);
            const language = match ? match[1] : undefined;
            
            // Helper function to extract plain text for copy functionality
            const extractText = (node: React.ReactNode): string => {
              if (typeof node === 'string') {
                return node;
              }
              if (typeof node === 'number') {
                return String(node);
              }
              if (Array.isArray(node)) {
                return node.map(extractText).join('');
              }
              if (React.isValidElement(node)) {
                const element = node as React.ReactElement<{ children?: React.ReactNode; dangerouslySetInnerHTML?: { __html: string } }>;
                if (element.props?.dangerouslySetInnerHTML?.__html) {
                  // Strip HTML tags using regex (works in SSR)
                  return element.props.dangerouslySetInnerHTML.__html
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                }
                if (element.props?.children) {
                  return extractText(element.props.children);
                }
              }
              return '';
            };
            
            // Get code content - preserve HTML structure for syntax highlighting
            const codeContent = codeElement?.props?.children;
            const codeHtml = codeElement?.props?.dangerouslySetInnerHTML?.__html;
            const plainText = codeHtml 
              ? codeHtml
                  .replace(/<[^>]*>/g, '')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .trim()
              : extractText(codeContent).trim();

            // Use CodeBlock component for better styling and copy functionality
            // Preserve the HTML structure from rehype-highlight for syntax highlighting
            return (
              <CodeBlock language={language} codeText={plainText}>
                {codeHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: codeHtml }} />
                ) : (
                  codeContent
                )}
              </CodeBlock>
            );
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

