import { readFile } from 'fs/promises';
import { join } from 'path';
import { access } from 'fs/promises';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageContainer } from '@stride/ui';
import { parseDocFrontmatter, type ParsedDoc } from '@stride/ui';

// Dynamically import DocumentationPageContent to code-split heavy markdown rendering dependencies
const DynamicDocumentationPageContent = dynamic(
  () => import('@stride/ui').then((mod) => ({ default: mod.DocumentationPageContent })),
  {
    ssr: true, // Keep SSR for SEO since this is documentation content
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

// Strict whitelist of valid guide names for security (prevents path traversal)
const VALID_GUIDES = ['docker', 'infrastructure-configuration'] as const;

// Guide name to file name mapping
const GUIDE_FILE_MAP: Record<string, string> = {
  'docker': 'docker.md',
  'infrastructure-configuration': 'infrastructure-configuration.md',
};

// Guide name to display name mapping
const GUIDE_DISPLAY_NAMES: Record<string, string> = {
  'docker': 'Docker Deployment',
  'infrastructure-configuration': 'Infrastructure Configuration',
};

// Guide name to description mapping
const GUIDE_DESCRIPTIONS: Record<string, string> = {
  'docker': 'Complete guide for deploying Stride using Docker Compose',
  'infrastructure-configuration': 'Complete guide for configuring global infrastructure settings (Git OAuth and AI Gateway)',
};

/**
 * Generate metadata for deployment guide pages
 */
export async function generateMetadata({ params }: { params: Promise<{ guide: string }> }): Promise<Metadata> {
  const { guide } = await params;
  
  if (!VALID_GUIDES.includes(guide as any)) {
    return {
      title: 'Deployment Guide Not Found',
      description: 'The requested deployment guide could not be found',
    };
  }

  const displayName = GUIDE_DISPLAY_NAMES[guide];
  const description = GUIDE_DESCRIPTIONS[guide];

  return {
    title: displayName,
    description,
  };
}

/**
 * Get documentation content from centralized source of truth
 * 
 * Reads from docs/deployment/ at repository root (single source of truth)
 * Path resolution: from apps/web, go up 2 levels to repo root, then into docs/deployment/
 * 
 * Error handling per FR4 specification:
 * 1. Check file existence first
 * 2. Check file readability second
 * 3. Check file content (empty) third
 * 
 * Parses frontmatter and returns both content (with frontmatter stripped) and metadata
 */
async function getDocContent(guide: string): Promise<ParsedDoc> {
  // Path from apps/web to repo root
  const repoRoot = join(process.cwd(), '..', '..');
  const fileName = GUIDE_FILE_MAP[guide];
  
  // This should never happen if guide validation is correct, but TypeScript requires the check
  if (!fileName) {
    const displayName = GUIDE_DISPLAY_NAMES[guide] || guide;
    const errorContent = `# Documentation Error\n\nThe ${displayName} documentation could not be loaded. Invalid guide name: ${guide}`;
    return {
      content: errorContent,
      frontmatter: {},
    };
  }
  
  const filePath = join(repoRoot, 'docs', 'deployment', fileName);
  const displayName = GUIDE_DISPLAY_NAMES[guide] || guide;

  try {
    // Step 1: Check file existence
    try {
      await access(filePath);
    } catch (error) {
      // File does not exist
      const errorMessage = `# Documentation Not Found\n\nThe ${displayName} documentation could not be loaded. Please check that the documentation file exists at the repository root in \`docs/deployment/\`.`;
      console.error(`[Deployment Docs] File not found: ${filePath}`, error);
      return {
        content: errorMessage,
        frontmatter: {},
      };
    }

    // Step 2: Try to read file (checks readability)
    let rawContent: string;
    try {
      rawContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File exists but cannot be read
      const errorMessage = `# Documentation Error\n\nAn error occurred while loading the ${displayName} documentation. Please try again later or check the repository documentation at \`docs/deployment/\`.`;
      console.error(`[Deployment Docs] Read error for ${filePath}:`, error);
      return {
        content: errorMessage,
        frontmatter: {},
      };
    }

    // Step 3: Check if content is empty (trim and check length)
    const trimmedContent = rawContent.trim();
    if (trimmedContent.length === 0) {
      const errorMessage = `# Documentation Empty\n\nThe ${displayName} documentation file exists but is empty. Please check the repository documentation at \`docs/deployment/\`.`;
      console.error(`[Deployment Docs] Empty file: ${filePath}`);
      return {
        content: errorMessage,
        frontmatter: {},
      };
    }

    // Parse frontmatter and strip it from content
    const parsed = parseDocFrontmatter(rawContent);
    return parsed;
  } catch (error) {
    // Fallback for any unexpected errors
    console.error(`[Deployment Docs] Unexpected error reading ${filePath}:`, error);
    const errorMessage = `# Documentation Error\n\nAn unexpected error occurred while loading the ${displayName} documentation. Please try again later or check the repository documentation at \`docs/deployment/\`.`;
    return {
      content: errorMessage,
      frontmatter: {},
    };
  }
}

export default async function DeploymentGuidePage({ params }: { params: Promise<{ guide: string }> }) {
  const { guide } = await params;

  // Validate route parameter with strict whitelist
  if (!VALID_GUIDES.includes(guide as any)) {
    notFound();
  }

  const { content, frontmatter } = await getDocContent(guide);
  const displayName = GUIDE_DISPLAY_NAMES[guide] || guide;
  const description = GUIDE_DESCRIPTIONS[guide] || '';

  const sections = [
    { key: 'overview', label: 'Overview', href: '/docs/deployment' },
    { key: 'docker', label: 'Docker Deployment', href: '/docs/deployment/docker' },
    { key: 'infrastructure-configuration', label: 'Infrastructure Configuration', href: '/docs/deployment/infrastructure-configuration' },
  ];

  // Determine active section based on guide name
  const activeSection = guide;

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title={displayName}
        description={description}
        sections={sections}
        activeSection={activeSection}
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
        lastUpdated={frontmatter.lastUpdated}
      />
    </PageContainer>
  );
}
