# Research: Deployment Documentation Routing

**Feature**: Deployment Documentation Routing  
**Created**: 2026-01-23  
**Status**: Complete

## Overview

This document resolves all "NEEDS CLARIFICATION" items from the implementation plan for deployment documentation routing. It covers route patterns, file reading approaches, navigation integration, and error handling strategies.

---

## 1. Route Pattern Analysis

### Decision: Follow `/docs/integrations/*` Pattern Exactly

**Analysis of Existing Pattern**:

**Integrations Overview Route** (`apps/web/app/docs/integrations/page.tsx`):
- Server Component that reads markdown from `docs/integrations/index.md`
- Uses dynamic import for `DocumentationPageContent` component
- Path resolution: `join(process.cwd(), '..', '..', 'docs', 'integrations', 'index.md')`
- Error handling: try/catch with fallback message

**Individual Integration Route** (`apps/web/app/docs/integrations/[service]/page.tsx`):
- Dynamic route with `[service]` parameter
- Reads markdown from `docs/integrations/[service].md`
- Same path resolution pattern
- Same error handling pattern

**Rationale**:
- Consistency with existing codebase
- Proven pattern that works
- Minimal code changes required
- Easy to maintain and understand

**Implementation**:
- Create `/docs/deployment/page.tsx` matching integrations overview pattern
- Create `/docs/deployment/[guide]/page.tsx` matching individual integration pattern
- Use exact same file reading approach
- Use exact same component usage

---

## 2. File Reading Pattern

### Decision: Read from Repository Root `docs/deployment/`

**Path Resolution**:
```typescript
// From apps/web/app/docs/deployment/[guide]/page.tsx
const repoRoot = join(process.cwd(), '..', '..');
const filePath = join(repoRoot, 'docs', 'deployment', `${guide}.md`);
```

**Rationale**:
- Matches existing integrations pattern exactly
- Single source of truth (markdown files in repo root)
- No content duplication needed
- Works in both development and production

**File Mapping**:
- URL: `/docs/deployment/docker` → File: `docs/deployment/docker.md`
- URL: `/docs/deployment/infrastructure-configuration` → File: `docs/deployment/infrastructure-configuration.md`
- URL: `/docs/deployment/smtp-configuration` → File: `docs/deployment/smtp-configuration.md`
- URL: `/docs/deployment` → File: `docs/deployment/README.md`

---

## 3. Navigation Structure

### Decision: Add to Main Docs Index Page

**Current Structure** (`apps/web/app/docs/page.tsx`):
```typescript
const documentationSections: DocumentationSection[] = [
  {
    title: 'Configuration',
    description: '...',
    href: '/docs/configuration',
    icon: '⚙️',
    subsections: [...]
  },
  {
    title: 'Integrations',
    description: '...',
    href: '/docs/integrations',
    icon: '🔗',
    subsections: [...]
  },
];
```

**New Structure**:
```typescript
const documentationSections: DocumentationSection[] = [
  // ... existing sections ...
  {
    title: 'Deployment',
    description: 'Complete guides for deploying Stride (Docker, infrastructure configuration, SMTP)',
    href: '/docs/deployment',
    icon: '🚀',
    subsections: [
      { label: 'Docker Deployment', href: '/docs/deployment/docker' },
      { label: 'Infrastructure Configuration', href: '/docs/deployment/infrastructure-configuration' },
      { label: 'SMTP Configuration', href: '/docs/deployment/smtp-configuration' },
    ],
  },
];
```

**Rationale**:
- Consistent with existing navigation structure
- Users can discover deployment docs from main index
- Matches visual design of other sections
- Clear hierarchy and organization

---

## 4. Breadcrumb Support

### Decision: Add Deployment Labels to Breadcrumb Generator

**Current Implementation** (`apps/web/src/lib/navigation/docs-breadcrumbs.ts`):
```typescript
const DOCS_SEGMENT_LABELS: Record<string, string> = {
  'configuration': 'Configuration',
  'integrations': 'Integrations',
  'monitoring-webhooks': 'Monitoring Webhooks',
};
```

**New Labels**:
```typescript
const DOCS_SEGMENT_LABELS: Record<string, string> = {
  'configuration': 'Configuration',
  'integrations': 'Integrations',
  'deployment': 'Deployment',
  'docker': 'Docker Deployment',
  'infrastructure-configuration': 'Infrastructure Configuration',
  'smtp-configuration': 'SMTP Configuration',
  'monitoring-webhooks': 'Monitoring Webhooks',
};
```

**Rationale**:
- Human-readable labels improve UX
- Consistent with existing breadcrumb pattern
- Automatic fallback to capitalized segment name if not found
- Supports navigation hierarchy

---

## 5. Error Handling

### Decision: Follow Existing Integrations Error Pattern

**Existing Pattern**:
```typescript
try {
  const content = await readFile(filePath, 'utf-8');
  return content;
} catch (error) {
  console.error(`Failed to read doc file from ${filePath}:`, error);
  return `# Documentation Not Found\n\nThe documentation could not be loaded.\n\nPlease check that the documentation file exists at the repository root.`;
}
```

**Rationale**:
- Graceful degradation (show error message instead of crashing)
- Server-side logging for debugging
- User-friendly error message
- Consistent with existing behavior

**Enhancement Consideration**:
- Could add more specific error messages based on error type
- Could add link to repository documentation
- Current approach is sufficient for MVP

---

## 6. Route Parameter Validation

### Decision: Validate Guide Names to Prevent Path Traversal

**Approach 1: Whitelist Known Guides** (Recommended for MVP):
```typescript
const VALID_GUIDES = ['docker', 'infrastructure-configuration', 'smtp-configuration'] as const;

export default async function DeploymentGuidePage({ params }: { params: { guide: string } }) {
  const { guide } = await params;
  
  if (!VALID_GUIDES.includes(guide as any)) {
    notFound();
  }
  
  // ... rest of implementation
}
```

**Approach 2: Path Validation** (More flexible, but requires careful implementation):
```typescript
const filePath = join(repoRoot, 'docs', 'deployment', `${guide}.md`);
const resolvedPath = resolve(filePath);
const docsDir = resolve(join(repoRoot, 'docs', 'deployment'));

if (!resolvedPath.startsWith(docsDir)) {
  notFound();
}
```

**Decision**: Use Approach 1 (whitelist) for MVP
- Simpler and safer
- Explicit list of allowed guides
- Easy to extend when new guides are added
- Prevents any possibility of path traversal

**Rationale**:
- Security best practice (defense in depth)
- Prevents directory traversal attacks
- Clear and maintainable
- Can switch to Approach 2 later if needed for flexibility

---

## 7. Component Reuse Strategy

### Decision: Reuse All Existing Components

**Components to Reuse**:
- `DocumentationPageContent` from `@stride/ui` - Markdown rendering
- `PageContainer` from `@stride/ui` - Layout wrapper
- Dynamic import pattern - Code splitting
- Existing layout (`apps/web/app/docs/layout.tsx`) - Authentication

**No New Components Needed**:
- All functionality exists in existing components
- Pattern is proven and working
- Maintains consistency across documentation

**Rationale**:
- DRY principle (Don't Repeat Yourself)
- Consistency across documentation sections
- Less code to maintain
- Proven components that work well

---

## Summary

All clarifications resolved:

1. ✅ **Route Pattern**: Follow `/docs/integrations/*` pattern exactly
2. ✅ **File Reading**: Read from `docs/deployment/` at repository root
3. ✅ **Navigation**: Add to main docs index page matching existing format
4. ✅ **Breadcrumbs**: Add deployment labels to breadcrumb generator
5. ✅ **Error Handling**: Use same pattern as integrations
6. ✅ **Route Validation**: Whitelist known guide names for security
7. ✅ **Component Reuse**: Reuse all existing components, no new ones needed

All decisions align with existing patterns and maintain consistency across the codebase.
