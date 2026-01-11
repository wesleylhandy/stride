import Link from 'next/link';
import type { Metadata } from 'next';
import { PageContainer } from '@stride/ui';

export const metadata: Metadata = {
  title: 'Documentation - Stride',
  description: 'Complete documentation for Stride workflow management platform',
};

interface DocumentationSection {
  title: string;
  description: string;
  href: string;
  icon: string;
  subsections?: { label: string; href: string }[];
}

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
  // Future documentation sections can be added here:
  // {
  //   title: 'Installation',
  //   description: 'Step-by-step installation and deployment guide',
  //   href: '/docs/install',
  //   icon: '📦',
  // },
];

export default function DocsIndexPage() {
  return (
    <PageContainer variant="constrained">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Documentation
          </h1>
          <p className="text-lg text-foreground-secondary dark:text-foreground-dark-secondary max-w-3xl">
            Complete guides and references for configuring and using Stride. All documentation is organized by topic with detailed setup instructions and troubleshooting.
          </p>
        </div>

        {/* Documentation Sections Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documentationSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group block h-full rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 transition-all duration-200 hover:border-accent/50 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" aria-hidden="true">
                  {section.icon}
                </span>
                <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark group-hover:text-accent dark:group-hover:text-accent transition-colors">
                  {section.title}
                </h2>
              </div>
              <p className="text-foreground-secondary dark:text-foreground-dark-secondary mb-4">
                {section.description}
              </p>
              {section.subsections && section.subsections.length > 0 && (
                <ul className="space-y-1.5 mt-4">
                  {section.subsections.map((subsection) => (
                    <li
                      key={subsection.href}
                      className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary group-hover:text-foreground dark:group-hover:text-foreground-dark transition-colors"
                    >
                      <span className="mr-2 text-accent" aria-hidden="true">
                        →
                      </span>
                      {subsection.label}
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-border dark:border-border-dark">
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            Quick Links
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/docs/configuration"
              className="text-sm font-medium text-accent hover:text-accent-hover dark:text-accent dark:hover:text-accent-hover transition-colors"
            >
              Configuration Reference →
            </Link>
            <Link
              href="/docs/integrations"
              className="text-sm font-medium text-accent hover:text-accent-hover dark:text-accent dark:hover:text-accent-hover transition-colors"
            >
              Integration Guide →
            </Link>
            <Link
              href="/docs/integrations/smtp"
              className="text-sm font-medium text-accent hover:text-accent-hover dark:text-accent dark:hover:text-accent-hover transition-colors"
            >
              SMTP Setup →
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
