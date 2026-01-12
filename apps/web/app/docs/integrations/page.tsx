import { readFile } from 'fs/promises';
import { join } from 'path';
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
  title: 'Integration Guide - Stride',
  description: 'Complete guide to configuring Stride service integrations',
};

/**
 * Get documentation content from centralized source of truth
 * 
 * Reads from docs/integrations/ at repository root (single source of truth)
 * Path resolution: from apps/web, go up 2 levels to repo root, then into docs/integrations/
 * 
 * Parses frontmatter and returns both content (with frontmatter stripped) and metadata
 */
async function getDocContent(): Promise<ParsedDoc> {
  // Path from apps/web to repo root
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'integrations', 'index.md');

  try {
    const rawContent = await readFile(filePath, 'utf-8');
    const parsed = parseDocFrontmatter(rawContent);
    return parsed;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    const errorContent = `# Documentation Not Found\n\nThe requested documentation could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
    return {
      content: errorContent,
      frontmatter: {},
    };
  }
}

export default async function IntegrationsDocsPage() {
  const { content, frontmatter } = await getDocContent();

  // Integration status table (static for now, can be made dynamic with API later)
  const integrationStatus = [
    { name: 'SMTP Email', status: 'Optional', configured: false, link: '/docs/integrations/smtp' },
    { name: 'Sentry', status: 'Optional', configured: false, link: '/docs/integrations/sentry' },
    { name: 'AI Providers', status: 'Optional', configured: false, link: '/docs/integrations/ai-providers' },
    { name: 'Git OAuth', status: 'Optional', configured: false, link: '/docs/integrations/git-oauth' },
    { name: 'Monitoring Webhooks', status: 'Optional', configured: false, link: '/docs/integrations/monitoring-webhooks' },
  ];

  const sections = [
    { key: 'overview', label: 'Overview', href: '/docs/integrations' },
    { key: 'smtp', label: 'SMTP', href: '/docs/integrations/smtp' },
    { key: 'sentry', label: 'Sentry', href: '/docs/integrations/sentry' },
    { key: 'ai-providers', label: 'AI Providers', href: '/docs/integrations/ai-providers' },
    { key: 'git-oauth', label: 'Git OAuth', href: '/docs/integrations/git-oauth' },
    { key: 'monitoring-webhooks', label: 'Monitoring Webhooks', href: '/docs/integrations/monitoring-webhooks' },
  ];

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title="Integration Guide"
        description="Complete guide to configuring Stride service integrations. All integrations are optional—Stride works perfectly without them."
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
