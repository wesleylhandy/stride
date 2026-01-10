import { readFile } from "fs/promises";
import { join } from "path";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PageContainer } from "@stride/ui";

// Dynamically import DocumentationPageContent to code-split heavy markdown rendering dependencies
const DynamicDocumentationPageContent = dynamic(
  () =>
    import("@stride/ui").then((mod) => ({
      default: mod.DocumentationPageContent,
    })),
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
  title: "Configuration Documentation - Stride",
  description: "Complete reference for Stride YAML configuration files",
};

interface DocPageProps {
  searchParams: Promise<{ section?: string }>;
}

/**
 * Get documentation content from centralized source of truth
 *
 * Reads from docs/configuration/ or docs/ at repository root (single source of truth)
 * Path resolution: from apps/site, go up 2 levels to repo root, then into docs/configuration/ or docs/
 */
async function getDocContent(section: string): Promise<string> {
  // Path from apps/site to repo root
  const repoRoot = join(process.cwd(), "..", "..");
  let filePath: string;

  switch (section) {
    case "reference":
      filePath = join(repoRoot, "docs", "configuration", "reference.md");
      break;
    case "troubleshooting":
      filePath = join(repoRoot, "docs", "configuration", "troubleshooting.md");
      break;
    case "examples":
      filePath = join(repoRoot, "docs", "configuration", "examples.md");
      break;
    case "board-status":
      filePath = join(repoRoot, "docs", "board-status-configuration-guide.md");
      break;
    default:
      filePath = join(repoRoot, "docs", "configuration", "reference.md");
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    return `# Documentation Not Found\n\nThe requested documentation section could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
  }
}

export default async function ConfigurationPage({
  searchParams,
}: DocPageProps) {
  const params = await searchParams;
  const section = params.section || "reference";
  const content = await getDocContent(section);

  const sections = [
    {
      key: "reference",
      label: "Reference",
      href: "/docs/configuration?section=reference",
    },
    {
      key: "troubleshooting",
      label: "Troubleshooting",
      href: "/docs/configuration?section=troubleshooting",
    },
    {
      key: "examples",
      label: "Examples",
      href: "/docs/configuration?section=examples",
    },
    {
      key: "board-status",
      label: "Board Status Guide",
      href: "/docs/configuration?section=board-status",
    },
  ];

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title="Configuration Documentation"
        description="Complete reference for Stride YAML configuration files"
        sections={sections}
        activeSection={section}
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
      />
    </PageContainer>
  );
}
