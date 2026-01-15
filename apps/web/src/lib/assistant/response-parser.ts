/**
 * Parse assistant response to extract structured metadata
 * Extracts validation findings, documentation links, and suggestions
 */

import { getDocumentationUrl } from "./doc-url-mapper";
import type { DocumentationReference } from "./doc-index";

export interface ParsedResponseMetadata {
  validationFindings?: Array<{
    type: "error" | "warning" | "info" | "best_practice";
    severity: "critical" | "high" | "medium" | "low";
    path?: (string | number)[];
    message: string;
    recommendation?: string;
    documentationLink?: string;
  }>;
  documentationLinks?: Array<{
    title: string;
    url: string;
    description?: string;
    file?: string; // Source file path
    section?: string; // Section anchor if applicable
  }>;
  suggestions?: Array<{
    type: string;
    config: unknown;
    explanation?: string;
  }>;
  // Analytics: Track which documentation was used in prompt context
  documentationUsed?: Array<{
    file: string;
    section?: string;
    description: string;
  }>;
}

/**
 * Extract documentation links from markdown response
 * Looks for markdown links and documentation references
 */
function extractDocumentationLinks(content: string): Array<{
  title: string;
  url: string;
  description?: string;
}> {
  const links: Array<{ title: string; url: string; description?: string }> = [];

  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [, title, url] = match;
    if (!title || !url) {
      continue; // Skip invalid matches
    }
    // Clean URL: remove trailing punctuation (., ), ;, etc.) that might be part of sentence
    const cleanedUrl = url.trim().replace(/[.,;:!?)\]}]+$/, '');
    // Filter for documentation links (GitHub URLs or /docs/ paths)
    // Accept GitHub URLs (containing github.com and /tree/ or /blob/ or /docs/)
    // Or paths containing /docs/ or "documentation"
    const isGitHubDocUrl = cleanedUrl.includes("github.com") && 
      (cleanedUrl.includes("/tree/") || cleanedUrl.includes("/blob/") || cleanedUrl.includes("/docs/"));
    const isDocPath = cleanedUrl.includes("/docs/") || cleanedUrl.includes("documentation");
    
    if (isGitHubDocUrl || isDocPath) {
      // Keep GitHub URLs as-is (they're correct)
      // Keep relative paths as-is (will be converted to GitHub URLs later if needed)
      links.push({ title: title.trim(), url: cleanedUrl });
    }
  }

  // Match explicit documentation references: "See [documentation link]" or "Reference: ..."
  const docReferenceRegex = /(?:See|Reference|Documentation|Docs?):\s*(?:\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s\)]+|[\/][^\s\)]+))/gi;
  while ((match = docReferenceRegex.exec(content)) !== null) {
    const [, linkTitle, linkUrl, plainUrl] = match;
    const rawUrl = linkUrl || plainUrl;
    if (!rawUrl) continue;
    
    // Clean URL: remove trailing punctuation (., ), ;, etc.) that might be part of sentence
    const cleanedUrl = rawUrl.trim().replace(/[.,;:!?)\]}]+$/, '');
    const title = linkTitle || "Documentation";
    
    // Accept GitHub URLs or /docs/ paths
    const isGitHubDocUrl = cleanedUrl.includes("github.com") && 
      (cleanedUrl.includes("/tree/") || cleanedUrl.includes("/blob/") || cleanedUrl.includes("/docs/"));
    const isDocPath = cleanedUrl.includes("/docs/") || cleanedUrl.includes("documentation");
    
    if ((isGitHubDocUrl || isDocPath)) {
      // Avoid duplicates
      if (!links.some((l) => l.url === cleanedUrl)) {
        links.push({ title: title.trim(), url: cleanedUrl });
      }
    }
  }

  return links;
}

/**
 * Extract validation findings from response text
 * Looks for structured validation feedback patterns
 */
function extractValidationFindings(content: string): Array<{
  type: "error" | "warning" | "info" | "best_practice";
  severity: "critical" | "high" | "medium" | "low";
  path?: (string | number)[];
  message: string;
  recommendation?: string;
  documentationLink?: string;
}> {
  const findings: Array<{
    type: "error" | "warning" | "info" | "best_practice";
    severity: "critical" | "high" | "medium" | "low";
    path?: (string | number)[];
    message: string;
    recommendation?: string;
    documentationLink?: string;
  }> = [];

  // Look for validation section headers
  const validationSectionRegex =
    /(?:##\s*)?(?:Validation|Findings|Issues|Problems|Errors|Warnings)(?:\s*##)?/i;
  if (!validationSectionRegex.test(content)) {
    return findings;
  }

  // Try to extract structured findings from lists or sections
  // Pattern: - or * or number. followed by severity indicator and message
  const findingPatterns = [
    // Critical/Error indicators
    /(?:[-*•]\s*|(?:\d+\.)\s*)(?:🔴|CRITICAL|ERROR|❌)\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    // High/Warning indicators
    /(?:[-*•]\s*|(?:\d+\.)\s*)(?:🟠|HIGH|WARNING|⚠️)\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    // Medium indicators
    /(?:[-*•]\s*|(?:\d+\.)\s*)(?:🟡|MEDIUM)\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    // Low/Info indicators
    /(?:[-*•]\s*|(?:\d+\.)\s*)(?:🔵|LOW|INFO|ℹ️)\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
  ];

  for (const pattern of findingPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const message = match[1]?.trim();
      if (message && message.length > 0) {
        // Determine type and severity from pattern
        const isError = pattern.source.includes("CRITICAL|ERROR|❌");
        const isHigh = pattern.source.includes("HIGH|WARNING|⚠️");
        const isMedium = pattern.source.includes("MEDIUM");
        const isLow = pattern.source.includes("LOW|INFO|ℹ️");

        const type = isError ? "error" : isHigh ? "warning" : "best_practice";
        const severity = isError
          ? "critical"
          : isHigh
          ? "high"
          : isMedium
          ? "medium"
          : "low";

        findings.push({
          type,
          severity,
          message,
        });
      }
    }
  }

  // If no structured findings extracted, check if response mentions validation
  if (findings.length === 0) {
    const hasValidationKeywords =
      /(?:valid|invalid|error|warning|issue|problem|recommendation|suggest)/i.test(
        content
      );
    if (hasValidationKeywords) {
      // Extract a summary finding from the response
      const summaryMatch = content.match(
        /(?:Configuration|Config)\s+(?:is|has|contains).*?(?:\.|$)/i
      );
      if (summaryMatch) {
        findings.push({
          type: "info",
          severity: "low",
          message: summaryMatch[0],
        });
      }
    }
  }

  return findings;
}

/**
 * Parse assistant response to extract structured metadata
 * @param content - Assistant response text (markdown)
 * @param validationContext - Optional validation context that was included in prompt
 * @param documentationContext - Optional documentation that was included in prompt context (for analytics)
 * @returns Parsed metadata with findings, links, and suggestions
 */
export function parseAssistantResponse(
  content: string,
  validationContext?: {
    isValid: boolean;
    summary: string;
    findings: Array<{
      type: string;
      severity: string;
      path: (string | number)[];
      message: string;
      recommendation?: string;
      documentationLink?: string;
    }>;
  },
  documentationContext?: Array<{
    reference: {
      file: string;
      section?: string;
      description: string;
    };
  }>
): ParsedResponseMetadata {
  const metadata: ParsedResponseMetadata = {};

  // Extract documentation links from response
  const docLinks = extractDocumentationLinks(content);
  
  // Generate documentation links from context (docs used in prompt)
  // This ensures we have proper URLs even if LLM doesn't format them correctly
  const contextLinks: Array<{
    title: string;
    url: string;
    description?: string;
    file?: string;
    section?: string;
  }> = [];
  
  if (documentationContext) {
    for (const doc of documentationContext) {
      const reference: DocumentationReference = {
        file: doc.reference.file,
        section: doc.reference.section,
        topics: [],
        description: doc.reference.description,
      };
      
      const url = getDocumentationUrl(reference);
      if (url) {
        // Generate a friendly title from file path
        const fileName = doc.reference.file.split('/').pop()?.replace('.md', '') || 'Documentation';
        const title = doc.reference.section 
          ? `${fileName} - ${doc.reference.section.replace(/-/g, ' ')}`
          : fileName;
        
        contextLinks.push({
          title,
          url,
          description: doc.reference.description,
          file: doc.reference.file,
          section: doc.reference.section,
        });
      }
    }
  }

  // Enhance links extracted from response text with GitHub URLs
  const enhancedResponseLinks = docLinks.map((link) => {
    // If it's already a GitHub URL, keep it as-is
    if (link.url.includes("github.com") && (link.url.includes("/tree/") || link.url.includes("/blob/"))) {
      return link;
    }

    // Try to match link URL to documentation context and get GitHub URL
    if (documentationContext) {
      for (const doc of documentationContext) {
        const docPath = doc.reference.file.replace(/^docs\//, '/docs/');
        // Match if URL contains doc path or file name (handles both /docs/path and relative paths)
        const urlMatches = link.url.includes(docPath) || 
                          link.url.includes(doc.reference.file) || 
                          link.url.includes(doc.reference.file.replace(/^docs\//, '')) ||
                          link.url.endsWith(doc.reference.file) ||
                          link.url.includes(`/${doc.reference.file.replace('.md', '')}`);
        
        if (urlMatches) {
          const reference: DocumentationReference = {
            file: doc.reference.file,
            section: doc.reference.section,
            topics: [],
            description: doc.reference.description,
          };
          
          // Get GitHub URL for this documentation reference
          const githubUrl = getDocumentationUrl(reference);
          if (githubUrl) {
            return {
              ...link,
              url: githubUrl, // Use GitHub URL
              file: doc.reference.file,
              section: doc.reference.section,
            };
          }
        }
      }
    }
    // If no match found, return link as-is (might be a valid external GitHub link)
    return link;
  });

  // Combine context links and response links, removing duplicates
  const allLinks = [...contextLinks];
  for (const link of enhancedResponseLinks) {
    // Only add if not already in contextLinks (by URL)
    if (!allLinks.some((l) => l.url === link.url)) {
      allLinks.push(link);
    }
  }

  if (allLinks.length > 0) {
    metadata.documentationLinks = allLinks;
  }

  // Track which documentation was used in prompt context (for analytics)
  if (documentationContext && documentationContext.length > 0) {
    metadata.documentationUsed = documentationContext.map((doc) => ({
      file: doc.reference.file,
      section: doc.reference.section,
      description: doc.reference.description,
    }));
  }

  // If validation context was provided, include those findings in metadata
  if (validationContext && validationContext.findings.length > 0) {
    metadata.validationFindings = validationContext.findings.map((f) => ({
      type: f.type as "error" | "warning" | "info" | "best_practice",
      severity: f.severity as "critical" | "high" | "medium" | "low",
      path: f.path,
      message: f.message,
      recommendation: f.recommendation,
      documentationLink: f.documentationLink,
    }));
  } else {
    // Try to extract findings from response text (fallback)
    const extractedFindings = extractValidationFindings(content);
    if (extractedFindings.length > 0) {
      metadata.validationFindings = extractedFindings;
    }
  }

  // Note: Suggestions parsing is handled separately (already implemented in suggestion-applier)
  // This parser focuses on validation and documentation links

  return metadata;
}
