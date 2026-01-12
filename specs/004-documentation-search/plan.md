# Implementation Plan: Documentation Search

**Feature Branch**: `004-documentation-search`  
**Created**: 2026-01-23  
**Status**: Planning Complete (Phase 0-1)  
**Feature Spec**: `specs/004-documentation-search/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components) - existing
- **Language**: TypeScript (strict mode) - existing
- **Database**: PostgreSQL with Prisma ORM - existing (not required for this feature)
- **Authentication**: HTTP-only cookies with JWT tokens - existing (search requires auth)
- **State Management**: TanStack Query for server state (if server-side), React state for local UI - existing
- **Styling**: Tailwind CSS with custom design tokens - existing
- **UI Components**: Reuse existing components from `packages/ui` (CommandPalette, Input, etc.) - existing

### Dependencies
- **Existing Libraries**:
  - `fuse.js` - Already used in CommandPalette for fuzzy search (can be reused)
  - `react-markdown` - Already used for documentation rendering
- **New Libraries**:
  - `remark` + `remark-gfm`: For parsing markdown to extract structure (headings, content) - consistent with existing `react-markdown`
  - `@types/mdast`: TypeScript types for markdown AST
  - `fuse.js`: Already in use (CommandPalette), reuse for documentation search

### Integrations
- **Documentation Source**: Markdown files in `docs/` directory at repository root
- **Documentation Routes**: Existing `/docs/*` routes in `apps/web/app/docs/`
- **CommandPalette**: Existing component in `packages/ui/src/organisms/CommandPalette.tsx` - evaluate integration

### Architecture Decisions
- **Search Implementation**: Client-side search with build-time indexing
  - Client-side: Fast (<200ms), no server load, works offline, reuse `fuse.js` pattern
  - Build-time indexing: Generate search index during Next.js build, embed as JSON
  - Runtime fallback: Parse files on first search if index missing (graceful degradation)
- **Indexing Strategy**: Build-time with runtime fallback
  - Build script: `apps/web/scripts/build-docs-index.ts` runs during `next build`
  - Output: JSON index file in `public/` or `.next/static/`
  - Index structure: Array of `{ title, path, content, headings, snippet }` objects
- **Search UI Integration**: Dedicated search component with CommandPalette-style UI
  - New component: `DocumentationSearch` in `packages/ui/src/organisms/`
  - UI pattern: Modal overlay similar to CommandPalette (reuse patterns, separate component)
  - Integration: Search button/input on documentation pages, opens search modal
  - Keyboard shortcut: Optional `Cmd/Ctrl+Shift+K` for docs search
- **Result Navigation**: Navigate to specific documentation section with anchor/hash for deep linking
- **Search Scope**: All markdown files in `docs/` directory, including nested subdirectories

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Client-side search with build-time indexing - See `research.md` section CLARIFICATION-001
- ✅ **RESOLVED**: Build-time indexing with runtime fallback - See `research.md` section CLARIFICATION-002
- ✅ **RESOLVED**: Dedicated search component (separate from CommandPalette) - See `research.md` section CLARIFICATION-003
- ✅ **RESOLVED**: Use `remark` for markdown parsing - See `research.md` section CLARIFICATION-004
- ✅ **RESOLVED**: Use `fuse.js` weighted scoring - See `research.md` section CLARIFICATION-005
- ✅ **RESOLVED**: Simple text search for MVP - See `research.md` section CLARIFICATION-006

All clarifications resolved. See `research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Search component handles only search functionality, separate from documentation rendering
  - Open/Closed: Reuse existing CommandPalette patterns, extend without modifying core
  - Liskov Substitution: Use existing search interfaces/patterns where applicable
  - Interface Segregation: Minimal, focused search API
  - Dependency Inversion: Depend on search interface abstractions, not concrete implementations
- [x] DRY, YAGNI, KISS followed
  - Reuse existing CommandPalette fuzzy search implementation (fuse.js)
  - MVP focus: Basic full-text search first, advanced features later (YAGNI)
  - Simple client-side search if documentation size allows (KISS)
- [x] Type safety enforced
  - TypeScript strict mode
  - Type-safe search result interfaces
  - No `any` types
- [x] Security best practices
  - Auth required for accessing documentation (existing)
  - Input validation for search queries (sanitize, length limits)
  - No path traversal vulnerabilities in file reading
- [x] Accessibility requirements met
  - WCAG 2.1 AA compliance for search interface
  - Keyboard navigation (arrow keys, Enter, Escape)
  - Screen reader support for search results
  - Focus management in search modal/overlay
  - Semantic HTML structure

### Code Quality Gates
- [x] No `any` types
  - TypeScript strict mode enforced
  - Type-safe search interfaces and result types
- [x] Proper error handling
  - Try/catch for file reading and indexing
  - Error boundaries for search component
  - Graceful degradation if search fails
- [x] Input validation
  - Sanitize search queries (prevent XSS)
  - Length limits on search input
  - Validate file paths when reading documentation
- [x] Test coverage planned
  - Unit tests for search indexing logic
  - Integration tests for search API (if server-side)
  - E2E tests for search user flows

## Phase 0: Outline & Research

### Research Tasks
- [ ] **CLARIFICATION-001**: Evaluate client-side vs server-side search implementation
  - Research: Compare performance, bundle size, complexity
  - Consider: Documentation size (~10MB max), update frequency, offline capability
- [ ] **CLARIFICATION-002**: Evaluate build-time vs runtime indexing
  - Research: Next.js build-time data generation, static vs dynamic indexing
  - Consider: Documentation update frequency, deployment workflow
- [ ] **CLARIFICATION-003**: Evaluate search UI integration options
  - Research: CommandPalette extension vs dedicated search component
  - Consider: UX consistency, discoverability, feature separation
- [ ] **CLARIFICATION-004**: Research markdown parsing libraries
  - Research: `remark`, `markdown-it`, `gray-matter` for extracting structure
  - Consider: Performance, bundle size, parsing accuracy
- [ ] **CLARIFICATION-005**: Research search ranking algorithms
  - Research: Relevance scoring, term frequency, section importance weighting
  - Consider: fuse.js scoring vs custom ranking logic
- [ ] **CLARIFICATION-006**: Evaluate advanced search features
  - Research: Filtering, faceted search, autocomplete
  - Consider: YAGNI - keep simple for MVP, add features later if needed

### Research Output
- [x] `research.md` generated with all clarifications resolved

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] Search index structure defined (client-side JSON format)
- [x] Search result type interfaces defined
- [x] Documentation metadata structure defined

### API Contracts
- [x] No API endpoint needed (client-side search)
- [x] Search index JSON schema documented
- [x] Client-side search interface contracts documented
- [x] Contracts saved to `/contracts/`

### Quickstart
- [x] `quickstart.md` generated
- [x] Search implementation approach documented
- [x] Integration steps documented

### Agent Context
- [x] Agent context updated with new search technologies (`remark` for parsing)

## Phase 2: Implementation Planning

### Component Structure
- [ ] Search component identified (CommandPalette extension or dedicated)
- [ ] Search result component designed
- [ ] Search index builder/loader component (if client-side)
- [ ] Component hierarchy defined
- [ ] Props/interfaces designed

### State Management
- [ ] State requirements identified (search query, results, loading, error)
- [ ] State management strategy chosen (local state vs TanStack Query)
- [ ] State flow documented

### Testing Strategy
- [ ] Unit test plan for search indexing logic
- [ ] Integration test plan for search API (if server-side)
- [ ] E2E test scenarios for search user flows
- [ ] Accessibility testing plan

## Notes

- Existing CommandPalette uses `fuse.js` for fuzzy search - reuse pattern for consistency
- Documentation is read from `docs/` directory at repository root
- Documentation routes are in `apps/web/app/docs/` with Server Components
- Search should work seamlessly with existing documentation navigation
- Build script runs during `next build` to generate search index
- Search index is served as static JSON file from `public/` directory

## Summary

### Decision: New Spec Created

**Answer to user question**: **Create a new spec** (`004-documentation-search`)

**Rationale**:
1. Documentation search is a distinct feature with its own requirements
2. Requires implementation (search indexing, UI components, build scripts)
3. Follows the pattern of separate feature specs (like `002-projects-dashboard`)
4. Separate from README documentation work (`003-readme-documentation`) which is about content, not functionality

### Implementation Approach

- **Client-side search** with `fuse.js` (reuse existing pattern)
- **Build-time indexing** (fast runtime, simple implementation)
- **Dedicated search component** (separate from CommandPalette, reuse UI patterns)
- **No API needed** (fully client-side)

### Generated Artifacts

- ✅ `spec.md` - Feature specification
- ✅ `plan.md` - Implementation plan (this file)
- ✅ `research.md` - Research findings and decisions
- ✅ `data-model.md` - Search index data structure
- ✅ `contracts/search-index-schema.json` - JSON schema for index
- ✅ `contracts/client-search-interface.ts` - TypeScript interfaces
- ✅ `quickstart.md` - Implementation guide

### Next Steps

1. Review and approve plan
2. Run `/speckit.tasks` to break plan into implementation tasks
3. Begin implementation following quickstart guide
