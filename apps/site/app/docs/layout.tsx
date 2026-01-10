import { ReactNode } from "react";
import { DocsNavigation } from "../components/docs/DocsNavigation";
import { DocsBreadcrumbs } from "../components/docs/DocsBreadcrumbs";

interface DocsLayoutProps {
  children: ReactNode;
}

/**
 * Documentation Layout
 *
 * Shared layout for all documentation pages.
 * Provides consistent navigation, breadcrumbs, and styling.
 * Ensures dark mode consistency across all docs pages.
 */
export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs - Top of page for easy navigation */}
          <DocsBreadcrumbs />

          {/* Top-level docs navigation tabs */}
          <DocsNavigation />

          {/* Page content */}
          {children}
        </div>
      </div>
    </div>
  );
}
