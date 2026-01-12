# Quickstart: Deployment Documentation Routing

**Feature**: Deployment Documentation Routing  
**Created**: 2026-01-23

## Overview

This guide provides step-by-step instructions to add Next.js routes for deployment documentation, fixing 404 errors when users click links to `/docs/deployment/*` pages. This follows the existing `/docs/integrations/*` pattern exactly.

## Prerequisites

- Existing `/docs/integrations/*` routes as reference
- Existing `DocumentationPageContent` component from `@stride/ui`
- Existing `docs/layout.tsx` for authentication
- Documentation files in `docs/deployment/` at repository root

## Implementation Steps

### Step 1: Create Deployment Overview Page

**File**: `apps/web/app/docs/deployment/page.tsx`

Create the overview page that serves `docs/deployment/README.md`:

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageContainer } from '@stride/ui';

const DynamicDocumentationPageContent = dynamic(
  () => import('@stride/ui').then((mod) => ({ default: mod.DocumentationPageContent })),
  {
    ssr: true,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading documentation...
          </p>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Deployment Guide - Stride',
  description: 'Complete guides for deploying Stride (Docker, infrastructure configuration, SMTP)',
};

async function getDocContent(): Promise<string> {
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'deployment', 'README.md');

  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    return `# Documentation Not Found\n\nThe deployment documentation could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
  }
}

export default async function DeploymentDocsPage() {
  const content = await getDocContent();

  const sections = [
    { key: 'overview', label: 'Overview', href: '/docs/deployment' },
    { key: 'docker', label: 'Docker Deployment', href: '/docs/deployment/docker' },
    { key: 'infrastructure-configuration', label: 'Infrastructure Configuration', href: '/docs/deployment/infrastructure-configuration' },
    { key: 'smtp-configuration', label: 'SMTP Configuration', href: '/docs/deployment/smtp-configuration' },
  ];

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title="Deployment Guide"
        description="Complete guides for deploying Stride (Docker, infrastructure configuration, SMTP)"
        sections={sections}
        activeSection="overview"
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
      />
    </PageContainer>
  );
}
```

### Step 2: Create Dynamic Route for Individual Guides

**File**: `apps/web/app/docs/deployment/[guide]/page.tsx`

Create the dynamic route that serves individual deployment guides:

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { PageContainer } from '@stride/ui';

const DynamicDocumentationPageContent = dynamic(
  () => import('@stride/ui').then((mod) => ({ default: mod.DocumentationPageContent })),
  {
    ssr: true,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading documentation...
          </p>
        </div>
      </div>
    ),
  }
);

// Whitelist of valid guide names for security
const VALID_GUIDES = ['docker', 'infrastructure-configuration', 'smtp-configuration'] as const;

type GuideName = typeof VALID_GUIDES[number];

// Map guide names to human-readable titles
const GUIDE_TITLES: Record<GuideName, string> = {
  'docker': 'Docker Deployment',
  'infrastructure-configuration': 'Infrastructure Configuration',
  'smtp-configuration': 'SMTP Configuration',
};

// Map guide names to descriptions
const GUIDE_DESCRIPTIONS: Record<GuideName, string> = {
  'docker': 'Complete guide for deploying Stride using Docker Compose',
  'infrastructure-configuration': 'Complete guide for configuring global infrastructure settings (Git OAuth and AI Gateway)',
  'smtp-configuration': 'Email service configuration for invitation emails',
};

async function getDocContent(guide: string): Promise<string> {
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'deployment', `${guide}.md`);

  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    return `# Documentation Not Found\n\nThe ${guide} documentation could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ guide: string }> }): Promise<Metadata> {
  const { guide } = await params;
  
  if (!VALID_GUIDES.includes(guide as GuideName)) {
    return {
      title: 'Documentation Not Found - Stride',
    };
  }

  const title = GUIDE_TITLES[guide as GuideName];
  const description = GUIDE_DESCRIPTIONS[guide as GuideName];

  return {
    title: `${title} - Stride`,
    description,
  };
}

export default async function DeploymentGuidePage({ params }: { params: Promise<{ guide: string }> }) {
  const { guide } = await params;

  // Validate guide name to prevent path traversal
  if (!VALID_GUIDES.includes(guide as GuideName)) {
    notFound();
  }

  const content = await getDocContent(guide);
  const title = GUIDE_TITLES[guide as GuideName];

  const sections = [
    { key: 'overview', label: 'Overview', href: '/docs/deployment' },
    { key: 'docker', label: 'Docker Deployment', href: '/docs/deployment/docker' },
    { key: 'infrastructure-configuration', label: 'Infrastructure Configuration', href: '/docs/deployment/infrastructure-configuration' },
    { key: 'smtp-configuration', label: 'SMTP Configuration', href: '/docs/deployment/smtp-configuration' },
  ];

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title={title}
        description={GUIDE_DESCRIPTIONS[guide as GuideName]}
        sections={sections}
        activeSection={guide}
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
      />
    </PageContainer>
  );
}
```

### Step 3: Update Documentation Index Page

**File**: `apps/web/app/docs/page.tsx`

Add "Deployment" section to the `documentationSections` array:

```typescript
const documentationSections: DocumentationSection[] = [
  {
    title: 'Configuration',
    description: 'Complete reference for Stride YAML configuration files, workflow definitions, and custom fields',
    href: '/docs/configuration',
    icon: '⚙️',
    subsections: [
      { label: 'Reference', href: '/docs/configuration?section=reference' },
      { label: 'Troubleshooting', href: '/docs/configuration?section=troubleshooting' },
      { label: 'Examples', href: '/docs/configuration?section=examples' },
      { label: 'Board Status Guide', href: '/docs/configuration?section=board-status' },
    ],
  },
  {
    title: 'Integrations',
    description: 'Complete guide to configuring Stride service integrations (SMTP, Sentry, AI Providers, Git OAuth, Monitoring Webhooks)',
    href: '/docs/integrations',
    icon: '🔗',
    subsections: [
      { label: 'SMTP Email', href: '/docs/integrations/smtp' },
      { label: 'Sentry', href: '/docs/integrations/sentry' },
      { label: 'AI Providers', href: '/docs/integrations/ai-providers' },
      { label: 'Git OAuth', href: '/docs/integrations/git-oauth' },
      { label: 'Monitoring Webhooks', href: '/docs/integrations/monitoring-webhooks' },
    ],
  },
  {
    title: 'Deployment',
    description: 'Complete guides for deploying Stride (Docker, infrastructure configuration, SMTP)',
    href: '/docs/deployment',
    icon: '🚀',
    subsections: [
      { label: 'Docker Deployment', href: '/docs/deployment/docker' },
      { label: 'Infrastructure Configuration', href: '/docs/deployment/infrastructure-configuration' },
      { label: 'SMTP Configuration', href: '/docs/deployment/smtp-configuration' },
    ],
  },
];
```

### Step 4: Update Breadcrumb Generator

**File**: `apps/web/src/lib/navigation/docs-breadcrumbs.ts`

Add deployment labels to `DOCS_SEGMENT_LABELS`:

```typescript
const DOCS_SEGMENT_LABELS: Record<string, string> = {
  'configuration': 'Configuration',
  'integrations': 'Integrations',
  'deployment': 'Deployment',
  'docker': 'Docker Deployment',
  'infrastructure-configuration': 'Infrastructure Configuration',
  'smtp-configuration': 'SMTP Configuration',
  'monitoring-webhooks': 'Monitoring Webhooks',
};
```

## Verification

### Test Routes

1. **Overview Route**: Navigate to `http://localhost:3000/docs/deployment`
   - Should display deployment overview from `docs/deployment/README.md`
   - Should show navigation sidebar with all deployment guides

2. **Individual Guides**:
   - `http://localhost:3000/docs/deployment/docker` → Should display Docker guide
   - `http://localhost:3000/docs/deployment/infrastructure-configuration` → Should display infrastructure guide
   - `http://localhost:3000/docs/deployment/smtp-configuration` → Should display SMTP guide

3. **Invalid Routes**: Navigate to `http://localhost:3000/docs/deployment/invalid`
   - Should return 404 (not found)

4. **Navigation**: From `/docs` index page
   - Should see "Deployment" section with subsections
   - Clicking should navigate to deployment overview
   - Subsections should link to individual guides

5. **Breadcrumbs**: When viewing deployment guides
   - Should show "Documentation > Deployment > [Guide Name]"
   - Should be clickable for navigation

6. **Existing Links**: Test links from other documentation
   - Links to `/docs/deployment/infrastructure-configuration` should work
   - No more 404 errors

## Troubleshooting

### File Not Found Errors

**Problem**: Routes return "Documentation Not Found" message.

**Solution**:
1. Verify markdown files exist in `docs/deployment/` at repository root
2. Check file names match route parameters exactly
3. Verify path resolution (should go up 2 levels from `apps/web`)

### 404 Errors

**Problem**: Routes return 404.

**Solution**:
1. Verify route files are in correct location:
   - `apps/web/app/docs/deployment/page.tsx`
   - `apps/web/app/docs/deployment/[guide]/page.tsx`
2. Check Next.js routing (restart dev server if needed)
3. Verify guide name is in `VALID_GUIDES` whitelist

### Navigation Not Appearing

**Problem**: Deployment section doesn't appear in docs index.

**Solution**:
1. Verify `documentationSections` array was updated in `apps/web/app/docs/page.tsx`
2. Check for TypeScript errors
3. Restart dev server

## Next Steps

After implementing these routes:

1. Test all existing links to deployment docs (should no longer 404)
2. Verify markdown rendering works correctly
3. Test navigation and breadcrumbs
4. Verify authentication works (via existing `docs/layout.tsx`)
