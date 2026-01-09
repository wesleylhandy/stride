'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@stride/ui';

export interface SettingsNavigationProps {
  userRole: 'Admin' | 'Member' | 'Viewer';
  className?: string;
}

interface SettingsTab {
  id: string;
  label: string;
  href: string;
  adminOnly?: boolean;
}

/**
 * SettingsNavigation Component
 * 
 * Horizontal tab-style navigation for settings sections.
 * Shows Users tab only to admin users.
 * Uses URL routing for bookmarkability and shareability.
 */
export function SettingsNavigation({
  userRole,
  className,
}: SettingsNavigationProps) {
  const pathname = usePathname();

  const settingsTabs: SettingsTab[] = [
    {
      id: 'account',
      label: 'Account',
      href: '/settings/account',
    },
    ...(userRole === 'Admin'
      ? [
          {
            id: 'users',
            label: 'Users',
            href: '/settings/users',
            adminOnly: true,
          } as SettingsTab,
        ]
      : []),
  ];

  const isActive = (href: string) => {
    return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
  };

  return (
    <div className="mb-8 border-b border-border dark:border-border-dark">
      <nav className="-mb-px flex space-x-8" aria-label="Settings navigation">
        {settingsTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
                active
                  ? 'border-primary text-primary dark:border-primary-dark dark:text-primary-dark'
                  : 'border-transparent text-foreground-secondary hover:border-border hover:text-foreground dark:text-foreground-dark-secondary dark:hover:border-border-dark dark:hover:text-foreground-dark'
              )}
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
