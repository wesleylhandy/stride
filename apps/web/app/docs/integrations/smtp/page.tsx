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
  title: 'SMTP Email Integration - Stride',
  description: 'Configure SMTP email for user invitations with any SMTP-compatible service',
};

async function getDocContent(): Promise<string> {
  // Path from apps/web to repo root
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'integrations', 'smtp.md');

  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    return `# Documentation Not Found\n\nThe SMTP documentation could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
  }
}

export default async function SMTPDocsPage() {
  const content = await getDocContent();

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
        title="SMTP Email Integration"
        description="Configure SMTP email for user invitations with any SMTP-compatible service (SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, or self-hosted)"
        sections={sections}
        activeSection="smtp"
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
      />
    </PageContainer>
  );
}
