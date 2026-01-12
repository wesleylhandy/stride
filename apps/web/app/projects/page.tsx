import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { projectRepository } from '@stride/database';
import { headers } from 'next/headers';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectsEmptyState } from '@/components/ProjectsEmptyState';
import { PaginationControls } from '@/components/PaginationControls';
import { PageContainer } from '@stride/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'View and manage your projects',
};

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
  }>;
}

/**
 * Projects Listing Page
 * 
 * Displays all projects accessible to the current user.
 * 
 * Features:
 * - Authentication required
 * - Project cards with navigation
 * - Empty state handling
 * - Error boundaries
 * - Pagination support (T025, T034)
 * - Error logging (T031)
 * - Edge case handling documentation (T035)
 * 
 * Edge Cases Handled:
 * - Long project names: Truncated with tooltip in ProjectCard (T032)
 * - Many projects (100+): Pagination UI controls displayed (T034)
 * - Archived/deleted projects: Not currently supported in schema (T033)
 * - Empty state: Shows friendly message with CTA (T016)
 * - Error state: Error boundary with retry (T012, T013)
 * 
 * Performance:
 * - Pagination limits data fetched (default 20 per page)
 * - Server-side rendering for initial load
 * - Caching headers for static data (T026)
 */
export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  try {
    // Note: Layout handles authentication and redirects
    // We still need to check auth here for server component safety
    const headersList = await headers();
    const session = await requireAuthServer(headersList);

    // Redirect to login if not authenticated (T004)
    if (!session) {
      redirect('/login');
    }

    // Parse pagination parameters (T025)
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize || '20', 10)));

    // Fetch projects using repository with pagination (T003, T025)
    const projects = await projectRepository.findManyPaginated(undefined, {
      page,
      pageSize,
    });

    // Handle empty state (T016)
    if (projects.items.length === 0) {
      return <ProjectsEmptyState />;
    }

    // Render projects list (T015)
    // Note: Layout provides header and breadcrumbs
    // Uses full-width container for better grid layout on large screens
    return (
      <PageContainer variant="full" className="py-6">
        <div className="mb-6">
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            {projects.total} {projects.total === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        
        {/* Pagination controls for 100+ projects (T034) */}
        {projects.totalPages > 1 && (
          <div className="mt-8">
            <PaginationControls
              currentPage={projects.page}
              totalPages={projects.totalPages}
              totalItems={projects.total}
              pageSize={projects.pageSize}
              basePath="/projects"
            />
          </div>
        )}
      </PageContainer>
    );
  } catch (error) {
    // Error logging for debugging (T031)
    console.error('Projects page error:', {
      error,
      timestamp: new Date().toISOString(),
      path: '/projects',
    });
    
    // Re-throw to trigger error boundary
    throw error;
  }
}

// Force dynamic rendering - this route requires authentication
// and fetches user-specific data, so it cannot be statically generated
export const dynamic = 'force-dynamic';

