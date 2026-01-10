import { ReactNode, ComponentType } from 'react';
import { MarkdownRenderer } from '../molecules/MarkdownRenderer';

export interface DocumentationSection {
  key: string;
  label: string;
  href: string;
}

export interface DocumentationPageContentProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Page description/subtitle
   */
  description: string;
  /**
   * Navigation sections/tabs
   */
  sections: DocumentationSection[];
  /**
   * Currently active section key
   */
  activeSection: string;
  /**
   * Markdown content to render
   */
  content: string;
  /**
   * Whether to enable Mermaid diagram rendering
   */
  enableMermaid?: boolean;
  /**
   * Whether to enable link previews
   */
  enableLinkPreviews?: boolean;
  /**
   * Custom header content (optional, overrides title/description)
   */
  header?: ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Link component to use for navigation (defaults to anchor tag)
   * Pass Next.js Link component: LinkComponent={Link}
   */
  LinkComponent?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
}

/**
 * DocumentationPageContent component
 * 
 * Provides consistent structure and styling for documentation pages across
 * marketing site and web app. Handles header, navigation tabs, and markdown rendering.
 * 
 * Usage:
 * ```tsx
 * <DocumentationPageContent
 *   title="Configuration Documentation"
 *   description="Complete reference for Stride YAML configuration files"
 *   sections={sections}
 *   activeSection={section}
 *   content={markdownContent}
 * />
 * ```
 */
export function DocumentationPageContent({
  title,
  description,
  sections,
  activeSection,
  content,
  enableMermaid = false,
  enableLinkPreviews = false,
  header,
  className,
  LinkComponent,
}: DocumentationPageContentProps) {
  // Default to anchor tag if no LinkComponent provided
  const Link = LinkComponent || (({ href, className, children }: { href: string; className?: string; children: ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ));

  return (
    <div className={className}>
      {/* Header */}
      {header || (
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            {title}
          </h1>
          <p className="mt-4 text-lg text-foreground-secondary dark:text-foreground-dark-secondary">
            {description}
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-border dark:border-border-dark">
        <nav className="-mb-px flex space-x-8">
          {sections.map((sec) => (
            <Link
              key={sec.key}
              href={sec.href}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeSection === sec.key
                  ? 'border-primary text-primary dark:border-primary-dark dark:text-primary-dark'
                  : 'border-transparent text-foreground-secondary hover:border-border hover:text-foreground dark:text-foreground-dark-secondary dark:hover:border-border-dark dark:hover:text-foreground-dark'
              }`}
            >
              {sec.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer
          content={content}
          enableMermaid={enableMermaid}
          enableLinkPreviews={enableLinkPreviews}
        />
      </div>
    </div>
  );
}
