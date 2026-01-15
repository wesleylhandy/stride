/**
 * Documentation URL mapping utilities
 * Maps documentation file paths to web URLs (primary) or GitHub URLs (fallback)
 * 
 * Hybrid approach:
 * - Primary: Web URLs for docs served via Next.js routes (better UX, stays in app)
 * - Fallback: GitHub URLs for docs without web routes (accessible if repo URL configured)
 */

import type { DocumentationReference } from "./doc-index";

/**
 * Get the GitHub repository URL from environment variables
 * Falls back to empty string if not configured
 */
export function getGitHubRepositoryUrl(): string {
  return process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL || "";
}

/**
 * Get the default branch name (can be extended to detect from git)
 * Defaults to 'main' which is the modern standard
 */
export function getDefaultBranch(): string {
  return process.env.GITHUB_DEFAULT_BRANCH || "main";
}

/**
 * Map documentation file path to web URL (if served via Next.js routes)
 * Returns null if doc is not served via web routes
 */
export function mapDocPathToWebUrl(
  filePath: string,
  section?: string
): string | null {
  // Remove 'docs/' prefix if present
  const normalizedPath = filePath.replace(/^docs\//, "");

  // Configuration docs: /docs/configuration?section={section}
  if (normalizedPath.startsWith("configuration/")) {
    const fileName = normalizedPath.replace("configuration/", "").replace(".md", "");
    
    if (fileName === "reference") {
      return section 
        ? `/docs/configuration?section=reference#${section}`
        : `/docs/configuration?section=reference`;
    }
    if (fileName === "troubleshooting") {
      return `/docs/configuration?section=troubleshooting${section ? `#${section}` : ""}`;
    }
    if (fileName === "examples") {
      return `/docs/configuration?section=examples${section ? `#${section}` : ""}`;
    }
    if (fileName === "README") {
      // Configuration overview - no section param needed
      return `/docs/configuration`;
    }
  }

  // Board status guide (special case)
  if (normalizedPath === "board-status-configuration-guide.md") {
    return `/docs/configuration?section=board-status${section ? `#${section}` : ""}`;
  }

  // Integration docs: /docs/integrations/{service}
  if (normalizedPath.startsWith("integrations/")) {
    const serviceName = normalizedPath
      .replace("integrations/", "")
      .replace(".md", "");
    
    const serviceMap: Record<string, string> = {
      "ai-providers": "ai-providers",
      "git-oauth": "git-oauth",
      "monitoring-webhooks": "monitoring-webhooks",
      "sentry": "sentry",
      "smtp": "smtp",
    };

    const route = serviceMap[serviceName];
    if (route) {
      return `/docs/integrations/${route}${section ? `#${section}` : ""}`;
    }
  }

  // Deployment docs: /docs/deployment/{guide}
  if (normalizedPath.startsWith("deployment/")) {
    const guideName = normalizedPath
      .replace("deployment/", "")
      .replace(".md", "");
    
    const guideMap: Record<string, string> = {
      "docker": "docker",
      "infrastructure-configuration": "infrastructure-configuration",
      "README": "", // Overview page
    };

    const route = guideMap[guideName];
    if (route !== undefined) {
      return route
        ? `/docs/deployment/${route}${section ? `#${section}` : ""}`
        : `/docs/deployment${section ? `#${section}` : ""}`;
    }
  }

  // Doc not served via web routes
  return null;
}

/**
 * Map documentation file path to GitHub URL
 * Returns null if GitHub repository URL is not configured
 */
export function mapDocPathToGitHubUrl(
  filePath: string,
  section?: string
): string | null {
  const repoUrl = getGitHubRepositoryUrl();
  if (!repoUrl) {
    return null;
  }

  const branch = getDefaultBranch();
  
  // Remove 'docs/' prefix if present (it will be added back)
  const normalizedPath = filePath.startsWith("docs/")
    ? filePath
    : `docs/${filePath}`;

  // Build GitHub URL: {repoUrl}/tree/{branch}/{filePath}
  // GitHub supports anchor links with # for markdown sections
  const githubUrl = `${repoUrl}/tree/${branch}/${normalizedPath}`;
  
  return section ? `${githubUrl}#${section}` : githubUrl;
}

/**
 * Get the best available URL for a documentation reference
 * ALWAYS returns GitHub URL if available (source of truth)
 * Falls back to null if GitHub URL cannot be constructed
 * 
 * @param reference - Documentation reference
 * @returns GitHub URL for the documentation file, or null if not available
 */
export function getDocumentationUrl(
  reference: DocumentationReference
): string | null {
  // ALWAYS use GitHub URL as the source of truth
  // This ensures consistent, deployment-independent references
  const githubUrl = mapDocPathToGitHubUrl(reference.file, reference.section);
  if (githubUrl) {
    return githubUrl;
  }

  // No URL available (GitHub repository URL not configured)
  return null;
}

/**
 * Check if a documentation reference has an accessible URL
 */
export function hasDocumentationUrl(
  reference: DocumentationReference
): boolean {
  return getDocumentationUrl(reference) !== null;
}
