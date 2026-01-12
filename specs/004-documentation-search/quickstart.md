# Quickstart: Documentation Search Implementation

**Feature**: Documentation Search  
**Date**: 2026-01-23

## Overview

This guide provides a step-by-step approach to implementing documentation search in the Stride web application. The implementation uses client-side search with a build-time generated index.

## Architecture

```
┌─────────────────┐
│  Build Script   │
│ build-docs-     │
│ index.ts        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Search Index    │
│ (JSON file)     │
│ public/docs-    │
│ search-index.   │
│ json            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client Component│
│ Documentation   │
│ Search          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ fuse.js Search  │
│ Results Display │
└─────────────────┘
```

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd apps/web
pnpm add remark remark-gfm @types/mdast
```

**Note**: `fuse.js` is already installed (used by CommandPalette).

### Step 2: Create Build Script

**File**: `apps/web/scripts/build-docs-index.ts`

**Purpose**: Generate search index during Next.js build

**Key Functions**:
1. Find all `.md` files in `docs/` directory
2. Parse each file with `remark` to extract:
   - Title (first h1)
   - Headings (h1-h3)
   - Content (plain text)
   - Anchors (heading slugs)
3. Generate route paths from file locations
4. Output JSON index to `public/docs-search-index.json`

**Example Structure**:
```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

async function buildDocsIndex() {
  const docsDir = join(process.cwd(), '..', '..', 'docs');
  const files = await findMarkdownFiles(docsDir);
  const entries = await Promise.all(
    files.map(file => parseMarkdownFile(file))
  );
  
  const index = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    size: 0, // Calculate after JSON stringify
    entries,
  };
  
  const outputPath = join(process.cwd(), 'public', 'docs-search-index.json');
  await writeFile(outputPath, JSON.stringify(index, null, 2));
}
```

### Step 3: Integrate Build Script

**File**: `apps/web/package.json`

Add build script hook:

```json
{
  "scripts": {
    "build": "pnpm build:docs-index && next build",
    "build:docs-index": "tsx scripts/build-docs-index.ts"
  }
}
```

**Note**: Use `tsx` or `ts-node` to run TypeScript directly, or compile script first.

### Step 4: Create Search Service

**File**: `apps/web/src/lib/search/documentation-search.ts`

**Purpose**: Client-side search service using fuse.js

**Key Functions**:
1. Load search index (lazy, cached)
2. Initialize fuse.js with weighted keys
3. Search entries and return results
4. Handle errors gracefully

**Example Structure**:
```typescript
import Fuse from 'fuse.js';
import type { DocumentationEntry, SearchResult, SearchQuery } from './types';

class DocumentationSearchService {
  private index: DocumentationEntry[] | null = null;
  private fuse: Fuse<DocumentationEntry> | null = null;

  async loadIndex(): Promise<DocumentationEntry[]> {
    if (this.index) return this.index;
    
    const response = await fetch('/docs-search-index.json');
    const data = await response.json();
    this.index = data.entries;
    
    this.fuse = new Fuse(this.index, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'headings', weight: 0.3 },
        { name: 'content', weight: 0.2 },
        { name: 'path', weight: 0.1 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    });
    
    return this.index;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    await this.loadIndex();
    if (!this.fuse) throw new Error('Search index not loaded');
    
    const results = this.fuse.search(query.query, {
      limit: query.limit || 20,
    });
    
    return results.map(result => ({
      entry: result.item,
      score: result.score || 0,
      matches: result.matches || [],
    }));
  }
}

export const documentationSearch = new DocumentationSearchService();
```

### Step 5: Create Search Component

**File**: `packages/ui/src/organisms/DocumentationSearch.tsx`

**Purpose**: Search UI component (similar to CommandPalette)

**Key Features**:
1. Modal overlay with search input
2. Results list with keyboard navigation
3. Preview snippets with highlighted matches
4. Click to navigate to documentation

**Example Structure**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { documentationSearch } from '@stride/web/lib/search/documentation-search';
import type { SearchResult } from '@stride/web/lib/search/types';

export function DocumentationSearch({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    documentationSearch
      .search({ query: query.trim() })
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, open]);

  // Keyboard navigation (similar to CommandPalette)
  // ... handle arrow keys, Enter, Escape

  return (
    <div className="fixed inset-0 z-modal-backdrop ...">
      {/* Modal content */}
    </div>
  );
}
```

### Step 6: Integrate Search into Documentation Pages

**File**: `apps/web/app/docs/layout.tsx` or individual doc pages

**Purpose**: Add search button/input to documentation pages

**Options**:
1. Search button in header (opens modal)
2. Search input in sidebar (always visible)
3. Keyboard shortcut (Cmd/Ctrl+Shift+K)

**Example**:
```typescript
import { DocumentationSearch } from '@stride/ui';

export default function DocsLayout({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1>Documentation</h1>
        <button onClick={() => setSearchOpen(true)}>
          Search (Cmd+Shift+K)
        </button>
      </div>
      {children}
      <DocumentationSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(entry) => {
          router.push(entry.path);
          setSearchOpen(false);
        }}
      />
    </>
  );
}
```

### Step 7: Add Keyboard Shortcut

**File**: `apps/web/src/hooks/useKeyboardShortcut.ts` (or similar)

**Purpose**: Handle Cmd/Ctrl+Shift+K to open search

**Example**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Testing

### Unit Tests

1. **Build script**: Test markdown parsing, index generation
2. **Search service**: Test search logic, result ranking
3. **Component**: Test keyboard navigation, result selection

### Integration Tests

1. **Index generation**: Verify index is created during build
2. **Search flow**: Test search from UI to results display
3. **Navigation**: Test clicking results navigates correctly

### E2E Tests

1. **Search workflow**: Open search, type query, select result
2. **Keyboard navigation**: Test arrow keys, Enter, Escape
3. **Mobile**: Test touch interactions

## Performance Optimization

1. **Lazy load index**: Only load when search is opened
2. **Cache index**: Store in memory after first load
3. **Code split**: Search component in separate chunk
4. **Virtualize results**: Use `react-window` if >50 results

## Deployment

1. **Build process**: Index is generated during `next build`
2. **Static file**: Index is served from `public/` directory
3. **Cache headers**: Set appropriate cache headers for index file
4. **Error handling**: Graceful fallback if index missing

## Troubleshooting

### Index not found
- Check build script runs during build
- Verify index file in `public/docs-search-index.json`
- Check file permissions

### Search returns no results
- Verify index contains entries
- Check fuse.js configuration (threshold, keys)
- Test with simple query first

### Performance issues
- Check index size (<200KB target)
- Verify lazy loading works
- Profile search execution time

## Next Steps

1. Implement build script
2. Create search service
3. Build search component
4. Integrate into documentation pages
5. Add tests
6. Deploy and monitor
