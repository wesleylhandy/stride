"use client";

import Link from 'next/link';
import type { Project } from '@stride/database';

interface ProjectCardProps {
  project: Project;
}

/**
 * ProjectCard Component
 * 
 * Displays individual project information with navigation.
 * 
 * Features:
 * - Project name and key display (T006)
 * - Navigation to project board (T007)
 * - Tailwind CSS styling (T008)
 */
export function ProjectCard({ project }: ProjectCardProps) {
  // Format relative time for last activity
  const formatRelativeTime = (date: Date | string): string => {
    const now = new Date();
    const updatedAt = new Date(date);
    const diffInMs = now.getTime() - updatedAt.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Link href={`/projects/${project.id}/board`} className="block">
      <div className="border border-border dark:border-border-dark rounded-lg p-6 hover:shadow-lg transition-shadow bg-surface dark:bg-surface-dark hover:border-accent dark:hover:border-accent cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-1 truncate">
              {project.name}
            </h3>
            <p className="text-sm font-mono text-foreground-secondary dark:text-foreground-dark-secondary">
              {project.key}
            </p>
          </div>
        </div>
        
        {project.description && (
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border dark:border-border-dark">
          <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            Updated {formatRelativeTime(project.updatedAt)}
          </span>
          <span className="text-sm text-accent hover:text-accent-dark transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

