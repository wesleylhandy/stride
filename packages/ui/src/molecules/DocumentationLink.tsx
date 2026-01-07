'use client';

import * as React from 'react';

export interface DocumentationLinkProps {
  /**
   * Documentation section to link to
   */
  section?: 'reference' | 'troubleshooting' | 'examples';
  /**
   * Custom href (overrides section)
   */
  href?: string;
  /**
   * Link text
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Open in new tab
   */
  target?: '_blank' | '_self';
  /**
   * onClick handler (for use with Next.js Link wrapper)
   */
  onClick?: () => void;
}

/**
 * DocumentationLink component
 * 
 * Provides consistent links to configuration documentation.
 * Use with Next.js Link wrapper in app components.
 */
export function DocumentationLink({
  section = 'reference',
  href,
  children,
  className,
  target = '_blank',
  onClick,
}: DocumentationLinkProps) {
  const linkHref = href || `/docs/configuration${section !== 'reference' ? `?section=${section}` : ''}`;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={className || 'text-primary hover:text-primary-dark dark:text-primary-dark dark:hover:text-primary underline'}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={linkHref}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className || 'text-primary hover:text-primary-dark dark:text-primary-dark dark:hover:text-primary underline'}
    >
      {children}
    </a>
  );
}

