/**
 * Client-Side Documentation Search Interface
 * 
 * TypeScript interfaces for client-side search implementation.
 * No API endpoint needed - search is performed client-side using fuse.js.
 */

/**
 * Documentation entry in search index
 */
export interface DocumentationEntry {
  /**
   * Unique identifier (relative path from docs/)
   */
  id: string;

  /**
   * Documentation title
   */
  title: string;

  /**
   * Route path in web app
   */
  path: string;

  /**
   * Section/category name
   */
  section: string;

  /**
   * Subsection name (optional)
   */
  subsection?: string;

  /**
   * All headings from document
   */
  headings: string[];

  /**
   * Full text content (plain text)
   */
  content: string;

  /**
   * Preview snippet
   */
  snippet: string;

  /**
   * Anchor links to headings
   */
  anchors: Array<{
    heading: string;
    anchor: string;
  }>;
}

/**
 * Search index metadata
 */
export interface SearchIndexMetadata {
  version: string;
  generatedAt: string;
  totalEntries: number;
  size: number;
}

/**
 * Complete search index structure
 */
export interface SearchIndex {
  version: string;
  generatedAt: string;
  totalEntries: number;
  size: number;
  entries: DocumentationEntry[];
}

/**
 * Search result from fuse.js
 */
export interface SearchResult {
  /**
   * Documentation entry
   */
  entry: DocumentationEntry;

  /**
   * Relevance score (0-1, lower is better)
   */
  score: number;

  /**
   * Matched terms/fields for highlighting
   */
  matches: Array<{
    field: 'title' | 'headings' | 'content' | 'path';
    value: string;
    indices: Array<[number, number]>;
  }>;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  /**
   * Search query string
   */
  query: string;

  /**
   * Maximum number of results (default: 20)
   */
  limit?: number;

  /**
   * Filter by section (optional)
   */
  section?: string;
}

/**
 * Search service interface
 */
export interface DocumentationSearchService {
  /**
   * Load search index from JSON file
   */
  loadIndex(): Promise<DocumentationEntry[]>;

  /**
   * Search documentation entries
   */
  search(query: SearchQuery): SearchResult[];

  /**
   * Get all entries (for debugging/testing)
   */
  getAllEntries(): DocumentationEntry[];
}

/**
 * Search component props
 */
export interface DocumentationSearchProps {
  /**
   * Whether search is open
   */
  open: boolean;

  /**
   * Callback when search should close
   */
  onClose: () => void;

  /**
   * Callback when a result is selected
   */
  onSelect?: (entry: DocumentationEntry) => void;
}
