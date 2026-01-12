# Data Model: Documentation Search

**Feature**: Documentation Search  
**Date**: 2026-01-23

## Overview

Documentation search uses a client-side search index generated at build time. The index is a JSON file containing structured documentation metadata that enables fast, client-side full-text search.

## Search Index Structure

### Index File Format

**Location**: `apps/web/public/docs-search-index.json` (or `.next/static/docs-search-index.json`)

**Format**: JSON array of documentation entries

### Documentation Entry Schema

```typescript
interface DocumentationEntry {
  /**
   * Unique identifier for this documentation entry
   * Format: relative path from docs/ directory (e.g., "configuration/reference")
   */
  id: string;

  /**
   * Documentation title (first h1 heading or filename)
   */
  title: string;

  /**
   * Documentation path/route in the web app
   * Format: "/docs/{section}" or "/docs/{section}?section={subsection}"
   */
  path: string;

  /**
   * Section/category name (e.g., "Configuration", "Integrations")
   * Extracted from directory structure or frontmatter
   */
  section: string;

  /**
   * Subsection name if applicable (e.g., "Reference", "Troubleshooting")
   * Extracted from filename or heading
   */
  subsection?: string;

  /**
   * All headings (h1-h3) from the document
   * Used for search matching and result display
   */
  headings: string[];

  /**
   * Full text content (markdown stripped, plain text)
   * Used for full-text search
   */
  content: string;

  /**
   * Preview snippet (2-3 lines, ~150 characters)
   * Extracted from content around first match or document start
   */
  snippet: string;

  /**
   * Anchor links to headings within the document
   * Format: { heading: string, anchor: string }
   * Used for deep linking to specific sections
   */
  anchors: Array<{
    heading: string;
    anchor: string; // URL hash fragment (e.g., "#installation")
  }>;
}
```

### Example Entry

```json
{
  "id": "configuration/reference",
  "title": "Configuration Reference",
  "path": "/docs/configuration?section=reference",
  "section": "Configuration",
  "subsection": "Reference",
  "headings": [
    "Configuration Reference",
    "Project Configuration",
    "Workflow Definitions",
    "Custom Fields"
  ],
  "content": "Complete reference for Stride YAML configuration files. This guide covers all available configuration options...",
  "snippet": "Complete reference for Stride YAML configuration files. This guide covers all available configuration options including workflow definitions, custom fields, and automation rules.",
  "anchors": [
    { "heading": "Project Configuration", "anchor": "#project-configuration" },
    { "heading": "Workflow Definitions", "anchor": "#workflow-definitions" },
    { "heading": "Custom Fields", "anchor": "#custom-fields" }
  ]
}
```

## Search Result Schema

### Client-Side Search Result

```typescript
interface SearchResult {
  /**
   * Documentation entry (from index)
   */
  entry: DocumentationEntry;

  /**
   * Relevance score from fuse.js (0-1, lower is better match)
   */
  score: number;

  /**
   * Matched terms/fields
   * Used for highlighting in UI
   */
  matches: Array<{
    field: 'title' | 'headings' | 'content' | 'path';
    value: string;
    indices: Array<[number, number]>; // Character ranges for highlighting
  }>;
}
```

## Index Generation Process

### Build Script: `apps/web/scripts/build-docs-index.ts`

**Input**: All markdown files in `docs/` directory (recursive)

**Process**:
1. Find all `.md` files in `docs/` directory
2. For each file:
   - Parse markdown with `remark` to extract AST
   - Extract title (first h1 or filename)
   - Extract all headings (h1-h3)
   - Extract content (strip markdown, plain text)
   - Generate snippet (first 150 chars or around first heading)
   - Generate anchors (heading slugs)
   - Determine section/subsection from path structure
3. Generate route path from file location
4. Output JSON array to `public/docs-search-index.json`

**Error Handling**:
- Skip files that fail to parse (log warning, continue)
- Validate JSON output before writing
- Include file count and generation timestamp in index metadata

### Index Metadata

```typescript
interface SearchIndexMetadata {
  /**
   * Index version (for cache busting)
   */
  version: string;

  /**
   * Generation timestamp (ISO 8601)
   */
  generatedAt: string;

  /**
   * Total number of documentation entries
   */
  totalEntries: number;

  /**
   * Index file size in bytes
   */
  size: number;
}
```

## Client-Side Usage

### Loading Index

```typescript
// Lazy load index on component mount
const loadSearchIndex = async (): Promise<DocumentationEntry[]> => {
  const response = await fetch('/docs-search-index.json');
  if (!response.ok) {
    throw new Error('Failed to load search index');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.entries; // Handle metadata wrapper
};
```

### Search Implementation

```typescript
import Fuse from 'fuse.js';

const fuse = new Fuse(entries, {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'headings', weight: 0.3 },
    { name: 'content', weight: 0.2 },
    { name: 'path', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true, // Match anywhere in content
});

const results = fuse.search(query);
```

## Data Flow

```
Build Time:
  docs/*.md → build-docs-index.ts → docs-search-index.json

Runtime:
  User opens search → Load index (lazy) → User types query → 
  fuse.js search → Display results → User clicks result → 
  Navigate to documentation page
```

## Validation Rules

### Index Entry Validation

- `id`: Required, unique, non-empty string
- `title`: Required, non-empty string
- `path`: Required, valid route path starting with `/docs/`
- `section`: Required, non-empty string
- `headings`: Required, array of strings (can be empty)
- `content`: Required, non-empty string (min 50 chars)
- `snippet`: Required, non-empty string (max 200 chars)
- `anchors`: Required, array (can be empty)

### Search Query Validation

- Minimum length: 2 characters
- Maximum length: 100 characters
- Sanitize: Remove special characters that could break search
- Trim: Remove leading/trailing whitespace

## Performance Considerations

### Index Size

- Target: <200KB compressed
- Current docs: ~440KB raw, ~35 files
- Estimated index: ~100-150KB (structured, no markdown syntax)

### Search Performance

- Index load: <100ms (lazy-loaded, cached)
- Search execution: <50ms (client-side, fuse.js)
- Result rendering: <50ms (React, virtualized list if needed)

### Optimization Strategies

1. **Lazy loading**: Load index only when search is opened
2. **Caching**: Cache index in memory after first load
3. **Code splitting**: Search component and index in separate chunk
4. **Compression**: Gzip index file (Next.js handles automatically)

## Future Enhancements

### Potential Additions

- **Search analytics**: Track popular queries, no-result queries
- **Search history**: Remember recent searches
- **Autocomplete**: Suggest queries as user types
- **Filters**: Filter by section, file type
- **Advanced search**: Boolean operators, phrase matching
- **Search suggestions**: "Did you mean..." for typos

### Schema Extensions

If adding filters or advanced features:

```typescript
interface DocumentationEntry {
  // ... existing fields ...
  
  // Future additions:
  tags?: string[];
  lastModified?: string; // ISO 8601 date
  fileSize?: number; // bytes
  wordCount?: number;
}
```
