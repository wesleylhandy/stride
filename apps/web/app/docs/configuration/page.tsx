import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PageContainer } from '@/components/templates/PageContainer';

// Dynamically import MarkdownRenderer to code-split heavy markdown rendering dependencies
const MarkdownRenderer = dynamic(
  () => import('@stride/ui').then((mod) => ({ default: mod.MarkdownRenderer })),
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
  title: 'Configuration Documentation - Stride',
  description: 'Complete reference for Stride YAML configuration files',
};

interface DocPageProps {
  searchParams: Promise<{ section?: string }>;
}

async function getDocContent(section: string): Promise<string> {
  const contentDir = join(process.cwd(), 'content', 'docs');
  let filename: string;

  switch (section) {
    case 'reference':
      filename = 'configuration-reference.md';
      break;
    case 'troubleshooting':
      filename = 'configuration-troubleshooting.md';
      break;
    case 'examples':
      filename = 'configuration-examples.md';
      break;
    default:
      filename = 'configuration-reference.md';
  }

  try {
    const filePath = join(contentDir, filename);
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read doc file ${filename}:`, error);
    return `# Documentation Not Found\n\nThe requested documentation section could not be loaded.`;
  }
}

export default async function ConfigurationDocsPage({ searchParams }: DocPageProps) {
  const params = await searchParams;
  const section = params.section || 'reference';
  const content = await getDocContent(section);

  const sections = [
    { key: 'reference', label: 'Reference', href: '/docs/configuration?section=reference' },
    { key: 'troubleshooting', label: 'Troubleshooting', href: '/docs/configuration?section=troubleshooting' },
    { key: 'examples', label: 'Examples', href: '/docs/configuration?section=examples' },
  ];

  return (
    <PageContainer variant="constrained">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          Configuration Documentation
        </h1>
        <p className="mt-4 text-lg text-foreground-secondary dark:text-foreground-dark-secondary">
          Complete reference for Stride YAML configuration files
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-border dark:border-border-dark">
        <nav className="-mb-px flex space-x-8">
          {sections.map((sec) => (
            <Link
              key={sec.key}
              href={sec.href}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                section === sec.key
                  ? 'border-primary text-primary dark:border-primary-dark dark:text-primary-dark'
                  : 'border-transparent text-foreground-secondary hover:border-border hover:text-foreground dark:text-foreground-dark-secondary dark:hover:border-border-dark dark:hover:text-foreground-dark'
              }`}
            >
              {sec.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer content={content} enableMermaid={false} enableLinkPreviews={false} />
      </div>
    </PageContainer>
  );
}

