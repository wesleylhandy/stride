"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Project } from '@stride/database';
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
      className="relative border border-border dark:border-border-dark rounded-lg p-6 hover:shadow-lg transition-shadow bg-surface dark:bg-surface-dark hover:border-accent dark:hover:border-accent flex-1 grid grid-rows-[auto_auto_1fr_auto] gap-3 min-h-0 cursor-pointer"
      aria-label={`Project ${project.name}`}
      role="article"
    >
      {/* Header: Title and Subtitle - Row 1 (auto, aligns across cards) */}
      <div className="relative z-10 pointer-events-none">
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
              className="absolute z-10 px-2 py-1 text-sm text-foreground bg-surface-secondary dark:bg-surface-dark-secondary border border-border dark:border-border-dark rounded shadow-lg bottom-full mb-2 left-0 max-w-xs whitespace-normal pointer-events-auto"
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
      
      {/* Description - Row 2 (auto, can vary) */}
      <div className="relative z-10 min-h-0 pointer-events-none">
        {project.description && (
          <p 
            className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary line-clamp-2"
            aria-label={`Project description: ${project.description}`}
          >
            {project.description}
          </p>
        )}
      </div>
      
      {/* Stats - Row 3 (1fr, takes remaining space, pushes footer down) */}
      <div className="relative z-10 flex flex-col min-h-0 pointer-events-none" role="group" aria-label="Project statistics">
        {/* Spacer to push issues/updated to consistent vertical position */}
        <div className="flex-grow" />
        {issueCount > 0 ? (
          <Link
            href={`/projects/${project.id}/issues`}
            className="text-sm text-secondary dark:text-secondary font-medium hover:text-secondary-hover dark:hover:text-secondary-hover transition-colors pointer-events-auto mb-1"
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${issueCount} ${issueCount === 1 ? 'issue' : 'issues'} for ${project.name}`}
          >
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
          </Link>
        ) : (
          <span 
            className="text-sm text-secondary dark:text-secondary font-medium mb-1"
            aria-label={`${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}`}
          >
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
          </span>
        )}
        <span 
          className="text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary"
          aria-label={`Last updated ${formatRelativeTime(project.updatedAt)}`}
        >
          Updated {formatRelativeTime(project.updatedAt)}
        </span>
      </div>
      
      {/* Footer - Row 4 (auto, always at bottom) */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border dark:border-border-dark">
        <Link
          href={`/projects/${project.id}/settings`}
          className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary hover:text-accent dark:hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded px-2 py-1 min-h-[44px] min-w-[44px] flex items-center pointer-events-auto"
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
        <Link
          href={`/projects/${project.id}/board`}
          className="text-sm text-accent hover:text-accent-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded pointer-events-auto"
          aria-label={`View ${project.name} project board`}
          onClick={(e) => e.stopPropagation()}
        >
          View →
        </Link>
      </div>
      
      {/* Main clickable overlay for card navigation */}
      <Link 
        href={`/projects/${project.id}/board`} 
        className="absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 z-0"
        aria-label={`View ${project.name} project board. ${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}. Updated ${formatRelativeTime(project.updatedAt)}`}
        onKeyDown={handleKeyDown}
      />
    </article>
  );
}

