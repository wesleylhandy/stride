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
      stride: "✅ MIT License",
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
    <section className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600 dark:text-primary-400">
            How We Compare
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Built for Developers
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            We match Linear's speed while adding self-hosting and configuration
            as code. No Jira complexity, no enterprise overhead.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg dark:ring-gray-700">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 dark:text-white"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Stride
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Linear
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Jira
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {comparisons.map((comparison) => (
                  <tr key={comparison.feature}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 dark:text-white">
                      {comparison.feature}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {comparison.stride}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {comparison.linear}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
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

