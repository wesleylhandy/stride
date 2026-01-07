import Link from "next/link";

export default function ConfigurationPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Configuration Guide
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Learn how to configure your Stride projects with YAML configuration files.
          </p>

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Overview
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Stride uses YAML configuration files to define project workflows, custom fields, and automation rules.
                This configuration-as-code approach allows you to version control your project settings and customize
                workflows to match your team's processes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Quick Start
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Here's a minimal configuration example to get you started:
              </p>
              <div className="mt-4 rounded-lg bg-gray-900 p-4 dark:bg-gray-800">
                <pre className="text-sm text-gray-100 overflow-x-auto">
                  <code>{`project_key: APP
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

custom_fields: []`}</code>
                </pre>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Common Patterns
              </h2>
              
              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Workflow Setup
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Define your workflow statuses and their types. Status types control transition rules:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600 dark:text-gray-300">
                    <li><code className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">open</code> - Initial status for new issues</li>
                    <li><code className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">in_progress</code> - Active work status</li>
                    <li><code className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">closed</code> - Terminal status (cannot transition back)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Custom Fields
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Add custom fields to capture additional information:
                  </p>
                  <div className="mt-2 rounded-lg bg-gray-900 p-4 dark:bg-gray-800">
                    <pre className="text-sm text-gray-100 overflow-x-auto">
                      <code>{`custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: estimate
    name: Story Points
    type: number
    required: false`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Full Documentation
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                For complete configuration reference, including all available options, validation rules, and advanced
                features, see the{" "}
                <Link
                  href="https://github.com/your-org/stride/docs/configuration"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  full documentation
                </Link>
                {" "}in the repository.
              </p>
            </section>

            <div className="pt-8">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

