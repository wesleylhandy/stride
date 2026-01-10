import Link from "next/link";

/**
 * DocsBreadcrumbs Component
 * 
 * Breadcrumb navigation for documentation pages.
 * Provides navigation context and easy way back to home.
 */
export function DocsBreadcrumbs() {
  return (
    <nav className="mb-8" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
        <li>
          <Link
            href="/"
            className="hover:text-foreground dark:hover:text-foreground-dark transition-colors"
          >
            Home
          </Link>
        </li>
        <li>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </li>
        <li className="text-foreground dark:text-foreground-dark" aria-current="page">
          Documentation
        </li>
      </ol>
    </nav>
  );
}
