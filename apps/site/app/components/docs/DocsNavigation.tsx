"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DocsTab {
  id: string;
  label: string;
  href: string;
}

const docsTabs: DocsTab[] = [
  {
    id: 'install',
    label: 'Installation',
    href: '/docs/install',
  },
  {
    id: 'configuration',
    label: 'Configuration',
    href: '/docs/configuration',
  },
];

/**
 * DocsNavigation Component
 * 
 * Horizontal tab-style navigation for documentation sections.
 * Provides navigation between top-level docs pages (Install, Configuration).
 * Uses URL routing for bookmarkability and shareability.
 */
export function DocsNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div className="border-b border-border dark:border-border-dark mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Documentation navigation">
        {docsTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark ${
                active
                  ? 'border-accent text-accent dark:border-accent dark:text-accent'
                  : 'border-transparent text-foreground-secondary hover:border-border hover:text-foreground dark:text-foreground-dark-secondary dark:hover:border-border-dark dark:hover:text-foreground-dark'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
