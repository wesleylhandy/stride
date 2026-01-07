"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Project } from '@prisma/client';
import { formatRelativeTime } from '@/lib/utils/date';

interface ProjectCardProps {
  project: Project & {
    _count?: {
      issues: number;
    };
  };
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
 * - Issue count display (T019)
 * - Last activity timestamp (T021)
 * - Project description with truncation (T022)
 * - Quick access links to project settings (T023)
 * - Keyboard navigation support (T024)
 * - WCAG 2.1 AA compliance (T027)
 * - Screen reader labels (T028)
 * - Long project name truncation with tooltip (T032)
 * 
 * Accessibility:
 * - Semantic HTML (article, heading, navigation)
 * - ARIA labels for screen readers
 * - Keyboard navigation support
 * - Focus indicators
 * - Color contrast meets WCAG 2.1 AA standards
 * - Touch targets meet 44x44px minimum
 * 
 * @param project - Project data including optional issue count
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const issueCount = project._count?.issues ?? 0;
  const [showTooltip, setShowTooltip] = useState(false);
  const [isNameTruncated, setIsNameTruncated] = useState(false);
  const nameRef = useRef<HTMLHeadingElement | null>(null);

  // Check if name is truncated (T032)
  useEffect(() => {
    if (nameRef.current) {
      setIsNameTruncated(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  }, [project.name]);

  // Handle keyboard navigation (T024, T029)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const link = e.currentTarget.querySelector('a[href]') as HTMLAnchorElement;
      if (link) {
        link.click();
      }
    }
  };

  return (
    <article
      className="border border-border dark:border-border-dark rounded-lg p-6 hover:shadow-lg transition-shadow bg-surface dark:bg-surface-dark hover:border-accent dark:hover:border-accent h-full flex flex-col"
      aria-label={`Project ${project.name}`}
      role="article"
    >
      <Link 
        href={`/projects/${project.id}/board`} 
        className="block flex-1 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
        aria-label={`View ${project.name} project board. ${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}. Updated ${formatRelativeTime(project.updatedAt)}`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="relative group">
              <h3
                ref={nameRef}
                className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-1 truncate"
                title={isNameTruncated ? project.name : undefined}
                onMouseEnter={() => {
                  if (nameRef.current && nameRef.current.scrollWidth > nameRef.current.clientWidth) {
                    setShowTooltip(true);
                  }
                }}
                onMouseLeave={() => setShowTooltip(false)}
                aria-label={project.name}
              >
                {project.name}
              </h3>
              {/* Tooltip for long project names (T032) */}
              {showTooltip && isNameTruncated && (
                <div
                  className="absolute z-10 px-2 py-1 text-sm text-foreground bg-surface-secondary dark:bg-surface-dark-secondary border border-border dark:border-border-dark rounded shadow-lg bottom-full mb-2 left-0 max-w-xs whitespace-normal"
                  role="tooltip"
                  aria-hidden="true"
                >
                  {project.name}
                </div>
              )}
            </div>
            <p 
              className="text-sm font-mono text-foreground-secondary dark:text-foreground-dark-secondary"
              aria-label={`Project key: ${project.key}`}
            >
              {project.key}
            </p>
          </div>
        </div>
        
        {project.description && (
          <p 
            className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-4 line-clamp-2"
            aria-label={`Project description: ${project.description}`}
          >
            {project.description}
          </p>
        )}
        
        {/* Issue count and last activity (T019, T021) */}
        <div className="flex items-center gap-4 mb-4 text-sm" role="group" aria-label="Project statistics">
          <span 
            className="text-foreground-secondary dark:text-foreground-dark-secondary"
            aria-label={`${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}`}
          >
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
          </span>
          <span 
            className="text-foreground-secondary dark:text-foreground-dark-secondary"
            aria-label={`Last updated ${formatRelativeTime(project.updatedAt)}`}
          >
            Updated {formatRelativeTime(project.updatedAt)}
          </span>
        </div>
      </Link>
      
      {/* Quick access links (T023) */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border dark:border-border-dark">
        <Link
          href={`/projects/${project.id}/settings`}
          className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary hover:text-accent dark:hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded px-2 py-1 min-h-[44px] min-w-[44px] flex items-center"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open settings for ${project.name} project`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Allow default navigation
            }
          }}
        >
          Settings
        </Link>
        <span className="text-sm text-accent" aria-hidden="true">
          View →
        </span>
      </div>
    </article>
  );
}

