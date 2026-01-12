import matter from 'gray-matter';

export interface DocFrontmatter {
  /**
   * Purpose of the documentation
   */
  purpose?: string;
  /**
   * Target audience for the documentation
   */
  targetAudience?: string;
  /**
   * Last updated date (ISO format: YYYY-MM-DD)
   */
  lastUpdated?: string;
  /**
   * Any other frontmatter fields
   */
  [key: string]: unknown;
}

export interface ParsedDoc {
  /**
   * Markdown content with frontmatter stripped
   */
  content: string;
  /**
   * Parsed frontmatter metadata
   */
  frontmatter: DocFrontmatter;
}

/**
 * Parse frontmatter from markdown content
 * 
 * Extracts YAML frontmatter from markdown files and returns both
 * the stripped content and parsed metadata.
 * 
 * @param markdown - Raw markdown content with optional frontmatter
 * @returns Object with content (frontmatter stripped) and frontmatter metadata
 */
export function parseDocFrontmatter(markdown: string): ParsedDoc {
  const parsed = matter(markdown);
  
  return {
    content: parsed.content.trim(),
    frontmatter: parsed.data as DocFrontmatter,
  };
}
