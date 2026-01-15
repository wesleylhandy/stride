'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@stride/ui';
import { CreateProjectModal } from './CreateProjectModal';

export interface ProjectsPageClientProps {
  /**
   * Number of projects to display in header
   */
  projectCount: number;
}

/**
 * ProjectsPageClient component
 *
 * Client component wrapper for projects listing page.
 * Handles the "Create Project" button and modal state.
 */
export function ProjectsPageClient({
  projectCount,
}: ProjectsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
          {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        </p>
        <div className="flex items-center gap-3">
          <Link href="/projects/import">
            <Button variant="secondary" aria-label="Import project from git provider">
              Import Project
            </Button>
          </Link>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            aria-label="Create new project"
          >
            Create Project
          </Button>
        </div>
      </div>

      <CreateProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
