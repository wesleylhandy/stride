export function FeatureHighlights() {
  const features = [
    {
      name: "Blazing Fast UX",
      description:
        "Keyboard-driven command palette with instant responses. No page reloads, no waiting.",
      icon: "⚡",
    },
    {
      name: "Configuration as Code",
      description:
        "Version-controlled workflow configuration. Edit YAML in the browser, changes apply instantly.",
      icon: "📝",
    },
    {
      name: "Deep Git Integration",
      description:
        "Automatic issue status updates from branch and PR activity. Link issues to code seamlessly.",
      icon: "🔗",
    },
    {
      name: "Rich Context",
      description:
        "Mermaid diagrams, link previews, and error traces. Everything you need to understand an issue.",
      icon: "🎨",
    },
    {
      name: "Self-Hosted",
      description:
        "Deploy in minutes with Docker. Your data stays in your infrastructure, no vendor lock-in.",
      icon: "🏠",
    },
    {
      name: "Open Source",
      description:
        "Open source licensed. Customize, extend, and contribute. Built by developers, for developers.",
      icon: "🌱",
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-background dark:bg-background-dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-accent dark:text-accent">
            Everything You Need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl dark:text-foreground-dark">
            Focused on EPD Flow
          </p>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-foreground-dark-secondary">
            No enterprise bloat, no unfocused features. Just what you need to
            track issues, manage sprints, and ship faster.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative pl-16 transition-all duration-300 hover:translate-x-1"
              >
                <dt className="text-base font-semibold leading-7 text-foreground dark:text-foreground-dark">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-white text-2xl shadow-md shadow-accent/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/30 group-hover:bg-accent-hover">
                    {feature.icon}
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-foreground-secondary dark:text-foreground-dark-secondary transition-colors duration-300 group-hover:text-foreground dark:group-hover:text-foreground-dark">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

