export function ComparisonSection() {
  const comparisons = [
    {
      feature: "Developer Experience",
      stride: "✅ Keyboard-first, instant",
      linear: "✅ Excellent",
      jira: "❌ Slow, clunky",
    },
    {
      feature: "Self-Hosted",
      stride: "✅ Docker in minutes",
      linear: "❌ Cloud only",
      jira: "⚠️ Complex setup",
    },
    {
      feature: "Configuration as Code",
      stride: "✅ YAML in browser",
      linear: "❌ No",
      jira: "⚠️ Complex XML",
    },
    {
      feature: "Git Integration",
      stride: "✅ Deep, automatic",
      linear: "✅ Good",
      jira: "⚠️ Plugins required",
    },
    {
      feature: "Open Source",
      stride: "✅ Open Source",
      linear: "❌ Proprietary",
      jira: "❌ Proprietary",
    },
    {
      feature: "Focused Scope",
      stride: "✅ EPD flow only",
      linear: "⚠️ General purpose",
      jira: "❌ Enterprise bloat",
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-background-secondary dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-accent dark:text-accent">
            How We Compare
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl dark:text-foreground-dark">
            Built for Developers
          </p>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-foreground-dark-secondary">
            We match Linear's speed while adding self-hosting and configuration
            as code. No Jira complexity, no enterprise overhead.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden shadow-lg shadow-black/5 ring-1 ring-border/20 md:rounded-lg dark:ring-border-dark/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-black/10">
            <table className="min-w-full divide-y divide-border dark:divide-border-dark">
              <thead className="bg-surface dark:bg-surface-dark">
                <tr>
                  <th
                    scope="col"
                    className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6 dark:text-foreground-dark"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-left text-sm font-semibold text-foreground dark:text-foreground-dark"
                  >
                    Stride
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-left text-sm font-semibold text-foreground dark:text-foreground-dark"
                  >
                    Linear
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-left text-sm font-semibold text-foreground dark:text-foreground-dark"
                  >
                    Jira
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface dark:divide-border-dark dark:bg-surface-dark-secondary">
                {comparisons.map((comparison) => (
                  <tr
                    key={comparison.feature}
                    className="transition-colors duration-200 hover:bg-surface-secondary dark:hover:bg-surface-dark"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6 dark:text-foreground-dark">
                      {comparison.feature}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-accent dark:text-accent transition-colors duration-200">
                      {comparison.stride}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                      {comparison.linear}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                      {comparison.jira}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

