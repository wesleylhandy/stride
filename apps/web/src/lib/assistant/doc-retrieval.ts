/**
 * Documentation retrieval service for AI assistant
 * Loads relevant documentation files based on user queries
 */

import { readFileSync } from "fs";
import { join } from "path";
import { existsSync } from "fs";
import {
  findDocumentation,
  type DocumentationReference,
} from "./doc-index";
import {
  getDocumentationUrl,
  getGitHubRepositoryUrl,
  getDefaultBranch,
} from "./doc-url-mapper";

export interface RetrievedDocumentation {
  reference: DocumentationReference;
  content: string;
  filePath: string;
}

/**
 * Default number of documentation references to include
 */
const DEFAULT_DOC_LIMIT = 5;

/**
 * Get the base directory for documentation files
 * Documentation is relative to the workspace root
 */
function getDocsBasePath(): string {
  // In Next.js, we need to resolve from the project root
  // For server-side execution, process.cwd() should be the workspace root
  const workspaceRoot = process.cwd();
  return join(workspaceRoot, "docs");
}

/**
 * Load documentation content from file system
 * @param filePath - Relative path from docs/ directory (e.g., "configuration/reference.md")
 * @returns File content or null if file doesn't exist
 */
export function loadDocumentationFile(
  filePath: string
): string | null {
  const docsBase = getDocsBasePath();
  const fullPath = join(docsBase, filePath);

  try {
    if (!existsSync(fullPath)) {
      console.warn(`Documentation file not found: ${fullPath}`);
      return null;
    }

    const content = readFileSync(fullPath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error loading documentation file ${fullPath}:`, error);
    return null;
  }
}

/**
 * Extract relevant sections from markdown content based on query keywords
 * Finds headings that match query terms and includes surrounding context
 */
function extractRelevantSections(
  content: string,
  query: string,
  maxSections: number = 3
): string {
  const queryLower = query.toLowerCase();
  const keywords = queryLower
    .split(/\s+/)
    .filter((word) => word.length > 2); // Filter out short words

  if (keywords.length === 0) {
    return content;
  }

  // Split content into sections by headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections: Array<{ level: number; title: string; start: number; end: number }> = [];
  let lastIndex = 0;
  let match;

  // Find all headings and their positions
  while ((match = headingRegex.exec(content)) !== null) {
    if (!match[1] || !match[2]) {
      continue; // Skip invalid matches
    }
    
    const level = match[1].length;
    const title = match[2].trim();
    const start = match.index;

    // Close previous section
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        lastSection.end = start;
      }
    }

    sections.push({
      level,
      title,
      start,
      end: content.length, // Will be updated by next section
    });

    lastIndex = match.index + match[0].length;
  }

  // Score sections by keyword matches
  const scoredSections = sections.map((section) => {
    const titleLower = section.title.toLowerCase();
    const sectionContent = content
      .slice(section.start, section.end)
      .toLowerCase();

    let score = 0;
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        score += 3; // Title match is more important
      }
      if (sectionContent.includes(keyword)) {
        score += 1;
      }
    }

    return { ...section, score };
  });

  // Sort by score (highest first)
  scoredSections.sort((a, b) => b.score - a.score);

  // Get top N sections
  const topSections = scoredSections.slice(0, maxSections).filter((s) => s.score > 0);

  if (topSections.length === 0) {
    return content; // Return full content if no matches
  }

  // Extract and combine relevant sections
  const extractedParts: string[] = [];
  for (const section of topSections) {
    const sectionContent = content.slice(section.start, section.end).trim();
    extractedParts.push(sectionContent);
  }

  // Combine sections, preserving structure
  return extractedParts.join("\n\n---\n\n");
}

/**
 * Retrieve relevant documentation based on user query
 * Enhanced with better keyword matching and section extraction
 * @param query - User query string
 * @param limit - Maximum number of documentation references to return (default: 5)
 * @param extractSections - Whether to extract only relevant sections from docs (default: true)
 * @returns Array of retrieved documentation with content
 */
export async function retrieveDocumentation(
  query: string,
  limit: number = DEFAULT_DOC_LIMIT,
  extractSections: boolean = true
): Promise<RetrievedDocumentation[]> {
  // Find matching documentation references
  const references = findDocumentation(query);
  
  // Score and sort references by relevance
  const queryLower = query.toLowerCase();
  const queryKeywords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  const scoredRefs = references.map((ref) => {
    let score = 0;
    const topicsLower = ref.topics.map((t) => t.toLowerCase());
    const descriptionLower = ref.description.toLowerCase();

    for (const keyword of queryKeywords) {
      // Topic matches (most important)
      for (const topic of topicsLower) {
        if (topic === keyword) {
          score += 5; // Exact match
        } else if (topic.includes(keyword) || keyword.includes(topic)) {
          score += 2; // Partial match
        }
      }

      // Description match
      if (descriptionLower.includes(keyword)) {
        score += 1;
      }
    }

    return { ref, score };
  });

  // Sort by score (highest first)
  scoredRefs.sort((a, b) => b.score - a.score);

  // Limit results
  const limitedReferences = scoredRefs.slice(0, limit).map((sr) => sr.ref);

  // Load content for each reference
  const retrieved: RetrievedDocumentation[] = [];

  for (const ref of limitedReferences) {
    const fullContent = loadDocumentationFile(ref.file);
    if (fullContent) {
      // Extract relevant sections if enabled
      const content = extractSections
        ? extractRelevantSections(fullContent, query)
        : fullContent;

      retrieved.push({
        reference: ref,
        content,
        filePath: ref.file,
      });
    }
  }

  return retrieved;
}

/**
 * Retrieve documentation by specific file paths
 * Useful when you know exactly which docs to include
 * @param filePaths - Array of relative file paths from docs/ directory
 * @returns Array of retrieved documentation with content
 */
export async function retrieveDocumentationByPaths(
  filePaths: string[]
): Promise<RetrievedDocumentation[]> {
  const retrieved: RetrievedDocumentation[] = [];

  for (const filePath of filePaths) {
    const content = loadDocumentationFile(filePath);
    if (content) {
      // Try to find the reference in the index
      const { getAllDocumentation, getDocumentationByPath } = await import("./doc-index");
      const ref = getDocumentationByPath(filePath);
      
      retrieved.push({
        reference: ref ?? {
          file: filePath,
          topics: [],
          description: "",
        },
        content,
        filePath,
      });
    }
  }

  return retrieved;
}

/**
 * Strip YAML frontmatter from markdown content if present
 * Frontmatter is not useful for LLM context and wastes tokens
 */
function stripFrontmatter(content: string): string {
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('\n---\n', 3);
    if (endIndex !== -1) {
      // Remove frontmatter block
      return content.slice(endIndex + 5).trim();
    }
    // Handle case where frontmatter doesn't end properly
    const endIndexAlt = content.indexOf('\n---', 3);
    if (endIndexAlt !== -1) {
      return content.slice(endIndexAlt + 5).trim();
    }
  }
  return content.trim();
}

/**
 * Format documentation for inclusion in prompt context
 * 
 * Note: Documentation content is included as-is (markdown format),
 * not wrapped in code blocks, to allow LLM to parse it as documentation
 * rather than code. This improves model understanding and accuracy.
 * 
 * Includes GitHub repository URLs for each documentation file to ensure
 * the LLM uses GitHub URLs when referencing documentation.
 * 
 * @param docs - Array of retrieved documentation
 * @returns Formatted string for prompt inclusion
 */
export function formatDocumentationForPrompt(
  docs: RetrievedDocumentation[]
): string {
  if (docs.length === 0) {
    return "";
  }

  // Get GitHub repo info for context
  const repoUrl = getGitHubRepositoryUrl();
  const branch = getDefaultBranch();

  const sections = docs.map((doc, index) => {
    const sectionAnchor = doc.reference.section
      ? `#${doc.reference.section}`
      : "";
    
    // Get GitHub URL for this documentation file
    const githubUrl = getDocumentationUrl(doc.reference);
    
    // Strip frontmatter and include markdown content directly (not in code fences)
    const content = stripFrontmatter(doc.content);
    
    const urlInfo = githubUrl 
      ? `\n**GitHub URL**: ${githubUrl}\n`
      : repoUrl 
        ? `\n**File Path**: docs/${doc.reference.file}${sectionAnchor}\n**Repository**: ${repoUrl}/tree/${branch}/docs/${doc.reference.file}${sectionAnchor}\n`
        : `\n**File Path**: docs/${doc.reference.file}${sectionAnchor}\n`;
    
    return `## Documentation Reference ${index + 1}: ${doc.reference.file}${sectionAnchor}

**Description**: ${doc.reference.description}${urlInfo}

${content}
`;
  });

  const instruction = repoUrl 
    ? `\n**IMPORTANT**: When referencing documentation in your response, ALWAYS use the GitHub repository URLs provided above (format: \`[Link Text](${repoUrl}/tree/${branch}/docs/file.md#section)\`). Do NOT use relative web paths or absolute URLs with guessed domains. Use only the GitHub URLs shown above.\n`
    : `\n**IMPORTANT**: When referencing documentation in your response, reference the file paths shown above (format: \`docs/file.md#section\`). Use relative paths from the repository root.\n`;

  return `# Relevant Documentation${instruction}\n\n${sections.join("\n\n---\n\n")}\n`;
}
