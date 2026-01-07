"use client";

import Link from "next/link";
import { cn } from "../utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component
 *
 * Displays navigation path with links.
 * Last item is not a link (current page).
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="h-4 w-4 mx-2 text-foreground-secondary dark:text-foreground-dark-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span
                  className="text-foreground dark:text-foreground-dark font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "text-foreground-secondary dark:text-foreground-dark-secondary",
                    "hover:text-foreground dark:hover:text-foreground-dark",
                    "transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-accent rounded"
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
