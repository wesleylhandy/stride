import { readFile } from "fs/promises";
import { join } from "path";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PageContainer } from "@stride/ui";
import { parseDocFrontmatter, type ParsedDoc } from "@stride/ui";

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
  title: "Installation Guide - Stride",
  description: "Quick start guide for installing and running Stride with Docker Compose",
};

/**
 * Get documentation content from centralized source of truth
 *
 * Reads from docs/install.md at repository root (single source of truth)
 * Path resolution: from apps/site, go up 2 levels to repo root, then into docs/
 * 
 * Parses frontmatter and returns both content (with frontmatter stripped) and metadata
 */
async function getDocContent(): Promise<ParsedDoc> {
  // Path from apps/site to repo root
  const repoRoot = join(process.cwd(), "..", "..");
  const filePath = join(repoRoot, "docs", "install.md");

  try {
    const rawContent = await readFile(filePath, "utf-8");
    const parsed = parseDocFrontmatter(rawContent);
    return parsed;
  } catch (error) {
    console.error(`Failed to read doc file from ${filePath}:`, error);
    const errorContent = `# Documentation Not Found\n\nThe installation guide could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
    return {
      content: errorContent,
      frontmatter: {},
    };
  }
}

export default async function InstallPage() {
  const { content, frontmatter } = await getDocContent();

  // No sections prop - uses layout-level navigation (DocsNavigation component)
  // This prevents duplicate navigation tabs

  return (
    <PageContainer variant="constrained">
      <DynamicDocumentationPageContent
        title="Installation Guide"
        description="Quick start guide for installing and running Stride with Docker Compose"
        content={content}
        enableMermaid={false}
        enableLinkPreviews={false}
        LinkComponent={Link}
        lastUpdated={frontmatter.lastUpdated}
      />
    </PageContainer>
  );
}

