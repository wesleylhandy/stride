# Research: Documentation Search Implementation

**Feature**: Documentation Search  
**Date**: 2026-01-23  
**Status**: Complete

## Research Questions & Decisions

### CLARIFICATION-001: Client-side vs Server-side Search

**Question**: Should search be client-side (faster, simpler) or server-side (more control, better for large docs)?

**Research Findings**:
- Documentation size: ~440KB total, 35 markdown files
- Existing pattern: Documentation is read from `docs/` directory at repository root
- CommandPalette already uses `fuse.js` for client-side fuzzy search
- Next.js App Router supports both Server Components and Client Components

**Decision**: **Client-side search with build-time indexing**

**Rationale**:
1. **Documentation size is small** (~440KB, 35 files) - well within client-side limits
2. **Performance**: Client-side search is instant (<200ms) with no network latency
3. **Consistency**: Reuse existing `fuse.js` pattern from CommandPalette
4. **Simplicity**: No API endpoint needed, reduces server load
5. **Offline capability**: Search works without network connection
6. **Bundle size**: Search index will be small (~100-200KB compressed)

**Alternatives Considered**:
- Server-side search API: More control but adds complexity, network latency, and server load. Not needed for small documentation set.
- Hybrid approach: Client-side for common queries, server-side for advanced. Rejected due to YAGNI - keep simple for MVP.

---

### CLARIFICATION-002: Build-time vs Runtime Indexing

**Question**: Should search index be built at build-time (static, faster runtime) or runtime (dynamic, always current)?

**Research Findings**:
- Next.js supports build-time data generation via `generateStaticParams` or build scripts
- Documentation files are in `docs/` directory at repository root
- Documentation updates require redeployment anyway (markdown files are in repo)
- Existing pattern: Documentation pages read files at request time (Server Components)

**Decision**: **Build-time indexing with runtime fallback**

**Rationale**:
1. **Faster runtime**: Pre-built index loads instantly, no parsing delay
2. **Documentation is version-controlled**: Changes require commit/deploy anyway
3. **Build-time generation**: Use Next.js build script to generate search index JSON
4. **Runtime fallback**: If index missing, parse files on first search (graceful degradation)
5. **Bundle optimization**: Index can be code-split and lazy-loaded

**Implementation Approach**:
- Build script: `apps/web/scripts/build-docs-index.ts` runs during `next build`
- Output: `apps/web/public/docs-search-index.json` (or in `.next/static/`)
- Index structure: Array of `{ title, path, content, headings, snippet }` objects
- Client component: Loads index on mount, uses `fuse.js` for search

**Alternatives Considered**:
- Runtime indexing: Parse files on app startup or first search. Rejected due to slower initial load and unnecessary parsing overhead.
- Hybrid: Build-time for production, runtime for development. Considered but adds complexity - build-time works for both.

---

### CLARIFICATION-003: Search UI Integration

**Question**: Should search be integrated into CommandPalette or a separate dedicated interface?

**Research Findings**:
- CommandPalette is accessible via Cmd/Ctrl+K and used for app commands
- Documentation search is a different use case (content search vs command execution)
- CommandPalette has grouping, keyboard navigation, and fuzzy search already implemented
- Documentation pages have their own navigation structure

**Decision**: **Dedicated search component with CommandPalette-style UI**

**Rationale**:
1. **Separation of concerns**: Documentation search is content discovery, not command execution
2. **Different interaction model**: Search results navigate to docs, commands execute actions
3. **Reuse patterns**: Use CommandPalette's UI patterns (modal, keyboard nav, fuzzy search) but as separate component
4. **Discoverability**: Search button/input on documentation pages is more discoverable than hidden in CommandPalette
5. **Future extensibility**: Dedicated component allows adding filters, advanced search later

**Implementation Approach**:
- New component: `DocumentationSearch` in `packages/ui/src/organisms/`
- UI pattern: Similar to CommandPalette (modal overlay, search input, result list)
- Integration: Search button/input on `/docs` pages, opens search modal
- Keyboard shortcut: Optional `Cmd/Ctrl+Shift+K` for docs search (doesn't conflict with Cmd/Ctrl+K)

**Alternatives Considered**:
- Extend CommandPalette: Add "Documentation" group with search results. Rejected - mixes concerns, harder to discover.
- Inline search on docs pages: Search input always visible. Rejected - takes up space, modal is cleaner.

---

### CLARIFICATION-004: Markdown Parsing Library

**Question**: What markdown parsing library should be used for extracting headings, sections, and content structure?

**Research Findings**:
- Existing: `react-markdown` with `remark-gfm` is already used for rendering
- Need: Parse markdown to extract structure (headings, content, sections) for indexing
- Options: `remark`, `markdown-it`, `gray-matter` (frontmatter), `unified` (remark ecosystem)

**Decision**: **Use `remark` (unified ecosystem) for parsing**

**Rationale**:
1. **Consistency**: Same ecosystem as `react-markdown` (uses remark under the hood)
2. **Rich parsing**: `remark` can extract AST, headings, content structure
3. **Plugin ecosystem**: `remark-gfm` already in use, can add `remark-heading-id` for anchor links
4. **Type safety**: `@types/mdast` provides TypeScript types for AST
5. **Performance**: `remark` is fast and lightweight

**Implementation Approach**:
- Build script uses `remark` to parse markdown files
- Extract: Title (first h1), headings (h1-h3), content chunks, section structure
- Generate: Search index with title, path, headings, content snippets, anchor links

**Alternatives Considered**:
- `markdown-it`: Different ecosystem, would require separate parsing logic. Rejected for consistency.
- Simple regex parsing: Faster but less accurate, misses nested structures. Rejected for accuracy.
- `gray-matter`: Only for frontmatter, doesn't parse content. Rejected - need full parsing.

---

### CLARIFICATION-005: Search Ranking Algorithm

**Question**: How should search results be ranked? (relevance scoring, term frequency, section importance)

**Research Findings**:
- `fuse.js` provides built-in relevance scoring (0-1, lower is better match)
- `fuse.js` supports weighted keys (title more important than content)
- Can configure `threshold`, `minMatchCharLength`, `ignoreLocation`
- Existing CommandPalette uses `threshold: 0.3` with `includeScore: true`

**Decision**: **Use `fuse.js` weighted scoring with title/heading boost**

**Rationale**:
1. **Consistency**: Reuse existing `fuse.js` pattern from CommandPalette
2. **Built-in ranking**: `fuse.js` provides relevance scores automatically
3. **Weighted keys**: Boost title and headings (more important) vs body content
4. **Configurable**: Can tune `threshold` and weights based on testing
5. **Simple**: No custom ranking logic needed

**Implementation Approach**:
```typescript
const fuse = new Fuse(docsIndex, {
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
```

**Alternatives Considered**:
- Custom TF-IDF ranking: More control but complex, requires term frequency calculation. Rejected - `fuse.js` is sufficient.
- Simple string matching: Fastest but poor relevance. Rejected - fuzzy search is essential for UX.

---

### CLARIFICATION-006: Advanced Search Features

**Question**: Should search support advanced features (filters by section, date, tags) or keep it simple (text search only)?

**Research Findings**:
- YAGNI principle: Build what's needed now
- MVP focus: Basic full-text search is sufficient
- Documentation structure: Sections are in paths (`/docs/configuration`, `/docs/integrations`)
- No metadata: Documentation doesn't have dates or tags currently

**Decision**: **Simple text search for MVP, filters can be added later**

**Rationale**:
1. **YAGNI**: Advanced features not needed for initial release
2. **Documentation size**: Small enough that simple search is effective
3. **Path-based filtering**: Can add section filter later using path structure
4. **Progressive enhancement**: Start simple, add features based on user feedback

**Future Enhancements** (post-MVP):
- Filter by section (Configuration, Integrations, etc.)
- Filter by file type or category
- Search history/recent searches
- Search suggestions/autocomplete

**Alternatives Considered**:
- Full faceted search: Powerful but complex, requires metadata structure. Rejected - overkill for MVP.
- Section filters only: Could add but not essential. Deferred - can add if users request.

---

## Summary

### Key Decisions

1. **Client-side search** with `fuse.js` (reuse existing pattern)
2. **Build-time indexing** with runtime fallback (fast, simple)
3. **Dedicated search component** (separate from CommandPalette, reuse UI patterns)
4. **`remark` for parsing** (consistent with existing markdown rendering)
5. **Weighted `fuse.js` scoring** (title/headings boosted, simple configuration)
6. **Simple text search** for MVP (YAGNI, can enhance later)

### Technology Choices

- **Search library**: `fuse.js` (already in use, client-side fuzzy search)
- **Parsing**: `remark` + `remark-gfm` (consistent with `react-markdown`)
- **Indexing**: Build-time script generates JSON index
- **UI**: New `DocumentationSearch` component (reuses CommandPalette patterns)
- **Integration**: Search button/input on documentation pages

### Implementation Strategy

1. **Build script**: Generate search index during Next.js build
2. **Index format**: JSON array with title, path, headings, content snippets
3. **Client component**: Load index, use `fuse.js` for search, display results
4. **UI component**: Modal overlay similar to CommandPalette
5. **Navigation**: Results link to documentation pages with anchor links

### Performance Targets

- **Index size**: <200KB compressed
- **Search latency**: <200ms (client-side, no network)
- **Index load**: <100ms (lazy-loaded, code-split)
- **Result rendering**: <50ms (React rendering)

### Next Steps

1. Create build script for index generation
2. Design search index data structure
3. Implement `DocumentationSearch` component
4. Integrate search UI into documentation pages
5. Add keyboard shortcuts and accessibility features
