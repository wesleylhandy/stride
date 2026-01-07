'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@stride/ui';

export interface ProjectSettingsNavigationProps {
  projectId: string;
  className?: string;
}

/**
 * ProjectSettingsNavigation Component
 * 
 * Provides navigation links to different project settings sections.
 */
export function ProjectSettingsNavigation({
  projectId,
  className,
}: ProjectSettingsNavigationProps) {
  const pathname = usePathname();

  const settingsLinks = [
    {
      id: 'config',
      label: 'Configuration',
      href: `/projects/${projectId}/settings/config`,
      description: 'Edit workflow, statuses, and custom fields',
    },
    // Future settings sections can be added here:
    // {
    //   id: 'members',
    //   label: 'Members',
    //   href: `/projects/${projectId}/settings/members`,
    //   description: 'Manage project members and permissions',
    // },
    // {
    //   id: 'integrations',
    //   label: 'Integrations',
    //   href: `/projects/${projectId}/settings/integrations`,
    //   description: 'Configure Git and monitoring integrations',
    // },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn('space-y-1', className)}
      aria-label="Project settings navigation"
    >
      {settingsLinks.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.id}
            href={link.href}
            className={cn(
              'block rounded-lg px-4 py-3 transition-colors',
              'border border-border dark:border-border-dark',
              active
                ? 'bg-accent/10 border-accent text-accent dark:text-accent'
                : 'bg-surface dark:bg-surface-dark hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <div className="font-medium text-foreground dark:text-foreground-dark">
              {link.label}
            </div>
            {link.description && (
              <div className="mt-1 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                {link.description}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

