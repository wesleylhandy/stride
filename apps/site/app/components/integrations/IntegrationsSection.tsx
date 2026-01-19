import { SMTPIcons } from './smtp-icons';
import { SentryIcon } from './sentry-icon';
import { AIIcons } from './ai-icons';
import { GitIcons } from './git-icons';
import { MonitoringIcons } from './monitoring-icons';

export function IntegrationsSection() {
  const integrations = [
    {
      name: 'SMTP Email',
      description: 'Send email invitations and notifications with any SMTP-compatible service',
      icon: <SMTPIcons />,
      services: ['SendGrid', 'AWS SES', 'Mailgun', 'Gmail', 'Microsoft 365', 'Self-hosted'],
    },
    {
      name: 'Error Tracking',
      description: 'Monitor application errors and performance with Sentry',
      icon: <SentryIcon />,
      services: ['Sentry'],
    },
    {
      name: 'AI Providers',
      description: 'Enable AI-powered issue triage with your preferred AI provider',
      icon: <AIIcons />,
      services: ['Ollama', 'OpenAI', 'Anthropic', 'Google Gemini'],
    },
    {
      name: 'Git OAuth',
      description: 'Connect your repositories for seamless webhook integration',
      icon: <GitIcons />,
      services: ['GitHub', 'GitLab', 'Bitbucket'],
    },
    {
      name: 'Monitoring Webhooks',
      description: 'Automatically create issues from error events in your monitoring stack',
      icon: <MonitoringIcons />,
      services: ['Sentry', 'Datadog', 'New Relic'],
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-background dark:bg-background-dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-accent dark:text-accent">
            Integrations
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl dark:text-foreground-dark">
            Works with Your Stack
          </p>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-foreground-dark-secondary">
            Connect Stride with your existing tools and services. All integrations are optional—the app works perfectly without them.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="group relative rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 transition-all duration-300 hover:shadow-lg hover:border-accent/30 dark:hover:border-accent/30 hover:-translate-y-1"
              >
                <dt className="text-base font-semibold leading-7 text-foreground dark:text-foreground-dark mb-3">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-accent/10 dark:bg-accent/20 border border-accent/20 dark:border-accent/30 transition-all duration-300 group-hover:bg-accent/15 dark:group-hover:bg-accent/25 group-hover:scale-110">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{integration.name}</div>
                    </div>
                  </div>
                </dt>
                <dd className="mt-2 text-base leading-7 text-foreground-secondary dark:text-foreground-dark-secondary mb-4">
                  {integration.description}
                </dd>
                <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
                  <div className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                    Supported Services:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {integration.services.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center rounded-md bg-background dark:bg-background-dark px-2.5 py-1 text-xs font-medium text-foreground-secondary ring-1 ring-inset ring-border dark:text-foreground-dark-secondary dark:ring-border-dark"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
