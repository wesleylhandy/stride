import Link from "next/link";
import { CodeBlock } from "../../components/docs/CodeBlock";

export default function ConfigurationPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl dark:text-foreground-dark">
        Configuration Guide
      </h1>
      <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-foreground-dark-secondary">
        Learn how to configure your Stride projects with YAML configuration
        files.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Overview
          </h2>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Stride uses YAML configuration files to define project workflows,
            custom fields, and automation rules. This configuration-as-code
            approach allows you to version control your project settings and
            customize workflows to match your team&apos;s processes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Quick Start
          </h2>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Here&apos;s a minimal configuration example to get you started:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`project_key: APP
project_name: My Application

workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
    - key: done
      name: Done
      type: closed

custom_fields: []`}
              language="yaml"
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Common Patterns
          </h2>

          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground-dark">
                Workflow Setup
              </h3>
              <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
                Define your workflow statuses and their types. Status types
                control transition rules:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-foreground-secondary dark:text-foreground-dark-secondary">
                <li>
                  <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1.5 py-0.5 text-sm font-mono border border-border dark:border-border-dark">
                    open
                  </code>{" "}
                  - Initial status for new issues
                </li>
                <li>
                  <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1.5 py-0.5 text-sm font-mono border border-border dark:border-border-dark">
                    in_progress
                  </code>{" "}
                  - Active work status
                </li>
                <li>
                  <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1.5 py-0.5 text-sm font-mono border border-border dark:border-border-dark">
                    closed
                  </code>{" "}
                  - Terminal status (cannot transition back)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground-dark">
                Custom Fields
              </h3>
              <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
                Add custom fields to capture additional information:
              </p>
              <div className="mt-2">
                <CodeBlock
                  code={`custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: estimate
    name: Story Points
    type: number
    required: false`}
                  language="yaml"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
            Full Documentation
          </h2>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            For complete configuration reference, including all available
            options, validation rules, and advanced features, see the{" "}
            <Link
              href={
                process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL
                  ? `${process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL}/docs/configuration`
                  : "https://github.com/your-org/stride/docs/configuration"
              }
              className="text-accent hover:text-accent-hover dark:text-accent dark:hover:text-accent-hover underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              full documentation
            </Link>{" "}
            in the repository.
          </p>
        </section>
      </div>
    </>
  );
}
