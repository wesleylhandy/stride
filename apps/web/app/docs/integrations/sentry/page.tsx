import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageContainer } from '@stride/ui';
import { parseDocFrontmatter, type ParsedDoc } from '@stride/ui';

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
  title: 'Sentry Error Tracking Integration',
  description: 'Configure Sentry for error tracking and performance monitoring',
};

async function getDocContent(): Promise<ParsedDoc> {
  // Path from apps/web to repo root
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'integrations', 'sentry.md');

  try {
    const rawContent = await readFile(filePath, 'utf-8');
    const parsed = parseDocFrontmatter(rawContent);
    return parsed;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    const errorContent = `# Documentation Not Found\n\nThe Sentry documentation could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
    return {
      content: errorContent,
      frontmatter: {},
    };
  }
}

export default async function SentryDocsPage() {
  const { content, frontmatter } = await getDocContent();

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
        title="Sentry Error Tracking Integration"
        description="Configure Sentry for error tracking and performance monitoring"
        sections={sections}
        activeSection="sentry"
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
        lastUpdated={frontmatter.lastUpdated}
      />
    </PageContainer>
  );
}
