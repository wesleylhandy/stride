"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@stride/ui";
import { PageContainer } from "@/components/templates/PageContainer";
import {
  ProjectSettingsContent,
  type SettingsTab,
} from "./ProjectSettingsContent";

export interface ProjectSettingsPageClientProps {
  projectId: string;
  projectName: string;
  projectKey: string;
  activeTab: SettingsTab;
}

/**
 * ProjectSettingsPageClient component
 *
 * Client component that handles the settings page UI matching the docs pattern:
 * - Title at top
 * - Tabs below title
 * - Content below tabs
 * - First tab (Configuration) is preloaded
 */
export function ProjectSettingsPageClient({
  projectId,
  projectName,
  projectKey,
  activeTab,
}: ProjectSettingsPageClientProps) {
  const pathname = usePathname();

  const settingsTabs = [
    {
      id: "config" as const,
      label: "Configuration",
      href: `/projects/${projectId}/settings`,
    },
    {
      id: "integrations" as const,
      label: "Integrations",
      href: `/projects/${projectId}/settings/integrations`,
    },
  ];

  const isActive = (tabId: SettingsTab) => {
    if (tabId === "config") {
      // Config is active on base /settings route
      return pathname === `/projects/${projectId}/settings`;
    }
    // Integrations is active on /settings/integrations route
    return pathname === `/projects/${projectId}/settings/integrations`;
  };

  return (
    <PageContainer variant="full" className="py-6">
      {/* Header and Tabs - constrained width within full container */}
      {/* Uses constrained container with no padding to avoid double padding from outer container */}
      <PageContainer variant="full" withPadding={false}>
        {/* Header - matches docs/configuration pattern */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Project Settings
          </h1>
          <p className="mt-4 text-lg text-foreground-secondary dark:text-foreground-dark-secondary">
            Manage your project configuration, workflows, and integrations
          </p>
          <div className="mt-2">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              {projectName}
            </p>
            <p className="text-xs font-mono text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
              {projectKey}
            </p>
          </div>
        </div>

        {/* Navigation Tabs - matches docs/configuration pattern */}
        <div className="mb-8 border-b border-border dark:border-border-dark">
          <nav className="-mb-px flex space-x-8">
            {settingsTabs.map((tab) => {
              const active = isActive(tab.id);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-surface-dark",
                    active
                      ? "border-accent text-accent dark:text-accent"
                      : "border-transparent text-foreground-secondary hover:border-border hover:text-foreground dark:text-foreground-dark-secondary dark:hover:border-border-dark dark:hover:text-foreground-dark"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </PageContainer>

      {/* Content - width varies by tab (full for config, constrained for integrations) */}
      {activeTab === "config" ? (
        // Config tab uses full width (matches Board/List pattern)
        // No additional container needed - content flows within outer full container
        <ProjectSettingsContent activeTab={activeTab} projectId={projectId} />
      ) : (
        // Integrations content uses constrained width (matches header/tabs)
        <PageContainer variant="full" withPadding={false}>
          <ProjectSettingsContent activeTab={activeTab} projectId={projectId} />
        </PageContainer>
      )}
    </PageContainer>
  );
}
