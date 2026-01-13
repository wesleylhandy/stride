'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../utils/cn';

export interface ProjectTab {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface ProjectTabsProps {
  projectId: string;
  tabs?: ProjectTab[];
  className?: string;
}

const defaultTabs: Omit<ProjectTab, 'href'>[] = [
  {
    id: 'board',
    label: 'Board',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'List',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
  },
  {
    id: 'sprints',
    label: 'Sprints',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

/**
 * ProjectTabs component
 * 
 * Displays navigation tabs for project views (Board, List, Sprints, Settings).
 * Highlights the active tab based on current pathname.
 */
export function ProjectTabs({ projectId, tabs, className }: ProjectTabsProps) {
  const pathname = usePathname();

  const projectTabs: ProjectTab[] =
    tabs ||
    defaultTabs.map((tab) => {
      // Map tab IDs to routes
      let href: string;
      switch (tab.id) {
        case 'board':
          href = `/projects/${projectId}/board`;
          break;
        case 'list':
          href = `/projects/${projectId}/issues`;
          break;
        case 'sprints':
          href = `/projects/${projectId}/sprints`;
          break;
        case 'settings':
          href = `/projects/${projectId}/settings`;
          break;
        default:
          href = `/projects/${projectId}/${tab.id}`;
      }
      return {
        ...tab,
        href,
      };
    });

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        'border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark',
        className
      )}
      aria-label="Project navigation"
    >
      <div className="flex space-x-8 px-4 sm:px-6 lg:px-8">
        {projectTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark rounded-t',
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-secondary dark:text-foreground-dark-secondary hover:border-border dark:hover:border-border-dark hover:text-foreground dark:hover:text-foreground-dark'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

