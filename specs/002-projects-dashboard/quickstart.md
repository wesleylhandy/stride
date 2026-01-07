# Quickstart: Projects Dashboard Implementation

**Feature**: Projects Dashboard and Listing Page  
**Created**: 2024-12-19

## Overview

This guide provides step-by-step instructions to implement the projects listing page that resolves the 404 error after onboarding completion.

## Prerequisites

- Existing `/api/projects` endpoint (already implemented)
- Existing `projectRepository` with pagination support
- Existing `requireAuth` middleware
- Existing UI components (Button, etc.)

## Implementation Steps

### Step 1: Create Projects Listing Page

**File**: `apps/web/app/projects/page.tsx`

```typescript
import { redirect } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { projectRepository } from '@stride/database';
import { headers } from 'next/headers';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectsEmptyState } from '@/components/ProjectsEmptyState';

export default async function ProjectsPage() {
  // Authenticate user
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    redirect('/login');
  }

  // Fetch projects
  const projects = await projectRepository.findManyPaginated(undefined, {
    page: 1,
    pageSize: 20,
  });

  // Handle empty state
  if (projects.items.length === 0) {
    return <ProjectsEmptyState />;
  }

  // Render projects list
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
```

### Step 2: Create Project Card Component

**File**: `apps/web/components/ProjectCard.tsx`

```typescript
"use client";

import Link from 'next/link';
import { Project } from '@stride/types';
import { Button } from '@stride/ui';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}/board`}>
      <div className="border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
        <p className="text-sm text-foreground-secondary mb-2">
          {project.key}
        </p>
        {project.description && (
          <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-secondary">
            Updated {formatRelativeTime(project.updatedAt)}
          </span>
          <Button variant="ghost" size="sm">
            View →
          </Button>
        </div>
      </div>
    </Link>
  );
}

function formatRelativeTime(date: Date): string {
  // Implement relative time formatting (e.g., "2 hours ago")
  // Use date-fns or similar library
  return new Date(date).toLocaleDateString();
}
```

### Step 3: Create Empty State Component

**File**: `apps/web/components/ProjectsEmptyState.tsx`

```typescript
"use client";

import Link from 'next/link';
import { Button } from '@stride/ui';

export function ProjectsEmptyState() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">No Projects Yet</h2>
        <p className="text-foreground-secondary mb-8">
          Get started by creating your first project. You can link a repository
          and start managing issues right away.
        </p>
        <Link href="/onboarding/project">
          <Button size="lg">Create Your First Project</Button>
        </Link>
      </div>
    </div>
  );
}
```

### Step 4: Add Error Boundary

**File**: `apps/web/app/projects/error.tsx`

```typescript
"use client";

import { useEffect } from 'react';
import { Button } from '@stride/ui';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Projects page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-foreground-secondary mb-8">
        We couldn't load your projects. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### Step 5: Add Loading State (Optional)

**File**: `apps/web/app/projects/loading.tsx`

```typescript
export default function ProjectsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-surface-secondary rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface-secondary rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 6: Test the Implementation

1. **Complete onboarding flow**: Go through onboarding to create a project
2. **Click "Go to Dashboard"**: Should redirect to `/projects` (no 404)
3. **Verify project displays**: Project card should show project information
4. **Test navigation**: Click project card to navigate to board
5. **Test empty state**: Delete all projects and verify empty state appears
6. **Test authentication**: Log out and verify redirect to login

## Verification Checklist

- [ ] `/projects` route is accessible after authentication
- [ ] Projects list displays correctly with project cards
- [ ] Empty state shows when no projects exist
- [ ] Project cards navigate to project board on click
- [ ] Error boundary handles failures gracefully
- [ ] Loading state displays during data fetch (if implemented)
- [ ] Onboarding completion redirect works (no 404)

## Next Steps (P2 Enhancements)

After core functionality is working:

1. Add issue count to project cards
2. Improve last activity formatting
3. Add search/filter functionality
4. Add pagination UI (if needed)
5. Add project creation quick action button

## Notes

- The existing `/api/projects` endpoint is already implemented and tested
- This implementation follows the same patterns as `/projects/[projectId]/board/page.tsx`
- Server Components are used for data fetching (better performance, SEO)
- Client Components are used only where interactivity is needed

