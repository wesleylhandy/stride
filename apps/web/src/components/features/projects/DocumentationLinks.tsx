/**
 * DocumentationLinks component
 * Displays documentation references with clickable links
 */

interface DocumentationLink {
  title: string;
  url: string;
  description?: string;
  file?: string;
  section?: string;
}

export interface DocumentationLinksProps {
  links: DocumentationLink[];
  className?: string;
}

/**
 * DocumentationLinks component
 * Renders a list of documentation references with links
 */
export function DocumentationLinks({
  links,
  className = "",
}: DocumentationLinksProps) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-dark-secondary">
        Documentation References
      </h4>
      <div className="space-y-1">
        {links.map((link, index) => {
          // Check if this is an external GitHub link
          const isGitHubLink = link.url.startsWith("http") && 
            (link.url.includes("github.com") || link.url.includes("/tree/"));
          // Check if this is an internal web URL (starts with /)
          const isInternalLink = link.url.startsWith("/");
          
          return (
            <a
              key={index}
              href={link.url}
              target={isInternalLink ? undefined : "_blank"}
              rel={isInternalLink ? undefined : "noopener noreferrer"}
              className="flex items-center gap-2 text-sm text-accent hover:underline"
              aria-label={`Open documentation: ${link.title}${isGitHubLink ? " (external)" : ""}`}
            >
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="flex-1">{link.title}</span>
              {isGitHubLink && (
                <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary" title="Opens in GitHub">
                  ↗
                </span>
              )}
              {link.description && (
                <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary hidden sm:inline">
                  {link.description}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
