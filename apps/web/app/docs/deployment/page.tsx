import { readFile } from 'fs/promises';
import { join } from 'path';
import { access } from 'fs/promises';
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

export const metadata: Metadata = {
  title: 'Deployment Guide - Stride',
  description: 'Complete guides for deploying Stride (Docker, infrastructure configuration)',
};

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
async function getDocContent(): Promise<ParsedDoc> {
  // Path from apps/web to repo root
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'deployment', 'README.md');

  try {
    // Step 1: Check file existence
    try {
      await access(filePath);
    } catch (error) {
      // File does not exist
      const errorMessage = `# Documentation Not Found\n\nThe deployment overview documentation could not be loaded. Please check that the documentation file exists at the repository root in \`docs/deployment/\`.`;
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
      const errorMessage = `# Documentation Error\n\nAn error occurred while loading the deployment overview documentation. Please try again later or check the repository documentation at \`docs/deployment/\`.`;
      console.error(`[Deployment Docs] Read error for ${filePath}:`, error);
      return {
        content: errorMessage,
        frontmatter: {},
      };
    }

    // Step 3: Check if content is empty (trim and check length)
    const trimmedContent = rawContent.trim();
    if (trimmedContent.length === 0) {
      const errorMessage = `# Documentation Empty\n\nThe deployment overview documentation file exists but is empty. Please check the repository documentation at \`docs/deployment/\`.`;
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
    const errorMessage = `# Documentation Error\n\nAn unexpected error occurred while loading the deployment overview documentation. Please try again later or check the repository documentation at \`docs/deployment/\`.`;
    return {
      content: errorMessage,
      frontmatter: {},
    };
  }
}

export default async function DeploymentDocsPage() {
  const { content, frontmatter } = await getDocContent();

  const sections = [
    { key: 'overview', label: 'Overview', href: '/docs/deployment' },
    { key: 'docker', label: 'Docker Deployment', href: '/docs/deployment/docker' },
    { key: 'infrastructure-configuration', label: 'Infrastructure Configuration', href: '/docs/deployment/infrastructure-configuration' },
  ];

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title="Deployment Guide"
        description="Complete guides for deploying Stride (Docker, infrastructure configuration)"
        sections={sections}
        activeSection="overview"
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
        lastUpdated={frontmatter.lastUpdated}
      />
    </PageContainer>
  );
}
