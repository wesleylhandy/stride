'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProjectSelector } from '../molecules/ProjectSelector';
import { cn } from '../utils/cn';

// Sidebar collapsed state key for localStorage
const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

export interface SidebarProps {
  currentProjectId?: string | null;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Projects',
    href: '/projects',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    name: 'Documentation',
    href: '/docs/configuration',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
];

/**
 * Sidebar component
 * 
 * Provides navigation and project selection.
 * Collapsible on mobile devices.
 */
export function Sidebar({ currentProjectId: propProjectId, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsedState] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  const [isMobile, setIsMobile] = React.useState(false);

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
    }
  }, []);

  // Extract project ID from pathname if not provided as prop
  // Pathname format: /projects/[projectId]/...
  const currentProjectId = propProjectId || (() => {
    const match = pathname?.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  })();

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setCollapsed]);

  const isActive = (href: string) => {
    if (href === '/projects') {
      return pathname === '/projects' || pathname?.startsWith('/projects/');
    }
    if (href === '/docs/configuration') {
      return pathname === '/docs/configuration' || pathname?.startsWith('/docs/configuration');
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        'bg-surface dark:bg-surface-dark',
        'border-r border-border dark:border-border-dark',
        'transition-all duration-200',
        isMobile
          ? collapsed
            ? 'w-0 overflow-hidden'
            : 'fixed inset-y-0 left-0 z-50 w-64'
          : collapsed
            ? 'w-16'
            : 'w-64',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Stride
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'p-2 rounded-md',
              'text-foreground-secondary dark:text-foreground-dark-secondary',
              'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
              'focus:outline-none focus:ring-2 focus:ring-accent',
              'transition-colors'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {collapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Project Selector */}
        {!collapsed && (
          <div className="p-4 border-b border-border dark:border-border-dark">
            <ProjectSelector currentProjectId={currentProjectId} />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                      'transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground-secondary dark:text-foreground-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary hover:text-foreground dark:hover:text-foreground-dark'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}
    </aside>
  );
}

