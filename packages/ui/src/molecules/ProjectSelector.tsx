'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../utils/cn';

export interface Project {
  id: string;
  key: string;
  name: string;
}

export interface ProjectSelectorProps {
  projects?: Project[];
  currentProjectId?: string | null;
  className?: string;
}

/**
 * ProjectSelector component
 * 
 * Allows switching between projects in the sidebar.
 * Fetches projects if not provided as prop.
 */
export function ProjectSelector({
  projects: initialProjects,
  currentProjectId,
  className,
}: ProjectSelectorProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState(initialProjects);
  const [loading, setLoading] = React.useState(!initialProjects);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch projects if not provided
  React.useEffect(() => {
    if (!initialProjects) {
      fetch('/api/projects')
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          // API returns { items: [...], total: ..., page: ..., ... }
          if (data?.items && Array.isArray(data.items)) {
            // Map to ProjectSelector format (id, key, name)
            const mappedProjects = data.items.map((item: any) => ({
              id: item.id,
              key: item.key,
              name: item.name,
            }));
            setProjects(mappedProjects);
          } else if (data?.projects && Array.isArray(data.projects)) {
            // Fallback for different API response format
            setProjects(data.projects);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch projects:', error);
          setLoading(false);
        });
    }
  }, [initialProjects]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const currentProject = projects?.find((p) => p.id === currentProjectId);

  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className={cn('p-2', className)}>
        <div className="h-8 bg-background-secondary dark:bg-background-dark rounded animate-pulse" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className={cn('p-2', className)}>
        <button
          onClick={() => router.push('/projects')}
          className={cn(
            'w-full px-3 py-2 text-left rounded-md',
            'text-sm text-foreground-secondary dark:text-foreground-dark-secondary',
            'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
            'focus:outline-none focus:ring-2 focus:ring-accent',
            'transition-colors'
          )}
        >
          No projects
        </button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-md',
          'text-sm font-medium',
          'bg-surface dark:bg-surface-dark',
          'border border-border dark:border-border-dark',
          'text-foreground dark:text-foreground-dark',
          'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
          'focus:outline-none focus:ring-2 focus:ring-accent',
          'transition-colors'
        )}
        aria-label="Select project"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <span className="truncate">
          {currentProject ? currentProject.name : 'Select project'}
        </span>
        <svg
          className={cn(
            'ml-2 h-4 w-4 text-foreground-secondary dark:text-foreground-dark-secondary flex-shrink-0',
            'transition-transform',
            showDropdown && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showDropdown && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-1 z-50',
            'bg-surface dark:bg-surface-dark',
            'border border-border dark:border-border-dark rounded-md shadow-lg',
            'max-h-64 overflow-auto'
          )}
          role="menu"
        >
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelectProject(project.id)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'text-foreground dark:text-foreground-dark',
                'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
                'focus:outline-none focus:bg-background-secondary dark:focus:bg-background-dark-secondary',
                'transition-colors',
                currentProjectId === project.id &&
                  'bg-accent/10 text-accent font-medium'
              )}
              role="menuitem"
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{project.name}</span>
                <span className="ml-2 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                  {project.key}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

