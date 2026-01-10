# Documentation Strategy Evaluation: Embedded vs GitHub Links

**Date**: 2025-01-XX  
**Decision Point**: Should marketing site embed all docs or link to GitHub?

## Executive Summary

**Recommendation**: **Hybrid Approach** - Embed core docs, link to GitHub for detailed technical docs.

## Current State

- **Marketing Site**: Links to GitHub repo (`docs/configuration/*.md`)
- **Web App**: Reads from centralized `docs/configuration/` at build/runtime
- **GitHub**: Public documentation in `docs/configuration/`

## Strategy Comparison

### Option 1: Current Approach (GitHub Links Only)

**How it works**: Marketing site provides overview + links to GitHub for full docs.

**Pros**:
- ✅ Zero duplication - single source of truth in GitHub
- ✅ Always up-to-date (no sync needed)
- ✅ Lower maintenance (edit once in GitHub)
- ✅ Version control is the source of truth
- ✅ Contributors can edit via GitHub PRs
- ✅ No build complexity
- ✅ Smaller marketing site bundle

**Cons**:
- ❌ External navigation (leaves marketing site)
- ❌ Less SEO value (content not on your domain)
- ❌ GitHub UI/theme may not match brand
- ❌ Slower user experience (navigate to GitHub)
- ❌ Can't customize presentation/UX
- ❌ No analytics on doc engagement
- ❌ Users might find docs without finding your product

### Option 2: Full Embedding (All Docs in Marketing Site)

**How it works**: Copy all markdown to marketing site, render with MDX.

**Pros**:
- ✅ Better SEO (content on your domain)
- ✅ Consistent branding/UX
- ✅ Faster navigation (no external redirect)
- ✅ Analytics tracking possible
- ✅ Better user experience (stays on site)
- ✅ Can add interactive elements (live demos, search)
- ✅ Offline viewing possible (if PWA)

**Cons**:
- ❌ **Duplication risk** (must sync manually or via build)
- ❌ Larger bundle size
- ❌ More complex build process
- ❌ Risk of docs getting out of sync
- ❌ Contributors need to edit in two places (or sync script)
- ❌ Marketing site rebuild needed for doc updates

### Option 3: Hybrid Approach (Recommended)

**How it works**: 
- Embed **core/essential** docs (quick start, overview, common patterns)
- Link to GitHub for **detailed** technical reference

**Implementation**:
```
Marketing Site:
  /docs/configuration
    ├── Overview (embedded, ~200 lines)
    ├── Quick Start (embedded, examples)
    └── Full Reference → GitHub link

  /docs/configuration/examples → GitHub link
  /docs/configuration/troubleshooting → GitHub link
```

**Pros**:
- ✅ SEO for essential content (quick start, overview)
- ✅ Better UX for common tasks (stays on site)
- ✅ Detailed docs remain centralized (no duplication)
- ✅ Best of both worlds
- ✅ Clear separation: marketing vs technical

**Cons**:
- ⚠️ Some duplication (but minimal, only essential content)
- ⚠️ Need sync strategy for embedded portions
- ⚠️ Two sources for configuration docs (but different purposes)

## Detailed Analysis

### SEO Impact

**Current (GitHub Links)**:
- ❌ Search results show GitHub, not your domain
- ❌ "How to configure Stride" queries → GitHub results
- ❌ Less brand recognition in search results
- ❌ GitHub's SEO authority vs your domain

**Embedded**:
- ✅ Your domain ranks for documentation queries
- ✅ Better brand association ("Stride configuration guide")
- ✅ Internal linking improves site authority
- ✅ Can optimize meta tags per page
- ✅ Rich snippets possible (breadcrumbs, structured data)

**Hybrid**:
- ✅ Core queries rank on your domain
- ✅ Detailed technical queries may still go to GitHub (acceptable trade-off)

### User Experience

**Current (GitHub Links)**:
- Context switch (your site → GitHub)
- Different UI/theme
- GitHub's navigation vs your navigation
- Users might explore GitHub instead of returning

**Embedded**:
- Seamless experience (stays on your site)
- Consistent navigation/branding
- Can add search, filters, interactive demos
- Faster (no redirect)

**Hybrid**:
- Core tasks seamless (embedded)
- Power users can access detailed docs (GitHub)
- Progressive disclosure pattern

### Maintenance Complexity

**Current (GitHub Links)**:
- ✅ Edit once in GitHub
- ✅ PR workflow for contributions
- ✅ Version control is source of truth
- ✅ No sync needed

**Embedded**:
- ❌ Must sync changes (manual or automated)
- ❌ Risk of divergence
- ❌ Two places to update
- ⚠️ Could automate with build script (reads from `docs/` at build time)

**Hybrid**:
- ⚠️ Minimal sync (only essential content)
- ✅ Detailed docs stay in GitHub only
- ✅ Can automate embedded portion sync

### Build & Deployment

**Current (GitHub Links)**:
- ✅ Simple (no doc processing)
- ✅ Fast builds
- ✅ Small bundle

**Embedded**:
- ⚠️ Must process markdown → MDX/HTML
- ⚠️ Larger bundle (all docs included)
- ⚠️ Slower builds (markdown processing)
- ✅ But: Static generation = fast runtime

**Hybrid**:
- ⚠️ Some processing (but limited)
- ✅ Most benefits of embedded
- ✅ Lower complexity than full embedding

## Recommendation: Hybrid Approach

### Rationale

1. **SEO for discovery**: Core docs on your domain improve discoverability
2. **UX for common tasks**: Most users need quick start, not full reference
3. **Maintainability**: Detailed docs stay centralized (low sync burden)
4. **Clear separation**: Marketing docs vs technical reference

### Implementation Strategy

#### Phase 1: Embed Essential Content

**Pages to embed** (read from `docs/configuration/` at build time):
- `/docs/configuration` - Overview + Quick Start (embedded)
- `/docs/configuration/reference` - Full reference (GitHub link)
- `/docs/configuration/examples` - Examples (GitHub link)  
- `/docs/configuration/troubleshooting` - Troubleshooting (GitHub link)

**Sync mechanism**:
```typescript
// Build-time script: apps/site/scripts/sync-docs.ts
// Reads from docs/configuration/reference.md
// Extracts "Overview" and "Quick Start" sections
// Generates apps/site/app/docs/configuration/page.tsx content
```

#### Phase 2: Enhanced Embedded Pages

Add to embedded pages:
- Search functionality
- Interactive code examples
- Copy-to-clipboard
- Breadcrumbs
- Related docs links

#### Phase 3: Analytics & Optimization

- Track doc page views
- Identify popular sections
- Optimize embedded content based on usage

### Content Selection for Embedding

**Embed** (essential for discovery/SEO):
- Overview/Introduction
- Quick Start guide
- Common patterns (basic workflows)
- Key concepts

**Link to GitHub** (detailed technical):
- Complete schema reference
- All examples
- Troubleshooting guide
- Advanced patterns
- API details

### Technical Implementation

```typescript
// apps/site/app/docs/configuration/page.tsx

import { readFile } from 'fs/promises';
import { join } from 'path';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

async function getEmbeddedContent() {
  // Read from centralized source at build time
  const docPath = join(process.cwd(), '..', '..', 'docs', 'configuration', 'reference.md');
  const fullDoc = await readFile(docPath, 'utf-8');
  
  // Extract only "Overview" and "Quick Start" sections
  const overview = extractSection(fullDoc, 'Overview');
  const quickStart = extractSection(fullDoc, 'Quick Start');
  
  return { overview, quickStart };
}

export default async function ConfigurationPage() {
  const { overview, quickStart } = await getEmbeddedContent();
  
  return (
    <div>
      <MarkdownRenderer content={overview} />
      <MarkdownRenderer content={quickStart} />
      
      <section>
        <h2>Full Documentation</h2>
        <p>For complete reference:</p>
        <ul>
          <li><Link href={githubUrl('reference.md')}>Configuration Reference</Link></li>
          <li><Link href={githubUrl('examples.md')}>Examples</Link></li>
          <li><Link href={githubUrl('troubleshooting.md')}>Troubleshooting</Link></li>
        </ul>
      </section>
    </div>
  );
}
```

**Build-time sync**:
- Markdown files read during Next.js build
- Static generation (SSG) ensures fast runtime
- No runtime file system access needed
- Bundle size remains reasonable (only essential content)

## Alternative: Build-Time Sync All Docs

If you want all docs embedded but with single source of truth:

**Strategy**: Read from `docs/configuration/` at build time, generate static pages.

**Implementation**:
```typescript
// next.config.ts
async function generateStaticParams() {
  const docsDir = join(process.cwd(), '..', '..', 'docs', 'configuration');
  const files = await readdir(docsDir);
  
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => ({ slug: f.replace('.md', '') }));
}
```

**Pros**:
- ✅ All docs embedded (better SEO)
- ✅ Single source of truth (read from `docs/` at build)
- ✅ No manual sync (automatic)

**Cons**:
- ⚠️ Larger bundle
- ⚠️ Slower builds
- ⚠️ More complex build process

## Decision Matrix

| Factor | GitHub Links | Full Embed | Hybrid | Build-Time Sync All |
|--------|--------------|------------|--------|---------------------|
| **SEO** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **UX** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Maintainability** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Build Complexity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Bundle Size** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Single Source of Truth** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Final Recommendation

**Implement Hybrid Approach** with build-time sync for embedded content:

1. **Short term**: Enhance current `/docs/configuration` page with embedded overview/quick start (extracted from centralized docs at build time)
2. **Medium term**: Add more embedded essential content based on analytics
3. **Long term**: Consider full build-time sync if SEO becomes critical

This balances:
- ✅ SEO benefits (essential content on your domain)
- ✅ UX benefits (seamless for common tasks)
- ✅ Maintainability (detailed docs stay centralized)
- ✅ Flexibility (can expand embedded content over time)

## Implementation Priority

1. **Phase 1** (Week 1): Build-time sync script for embedded overview/quick start
2. **Phase 2** (Week 2): Enhanced embedded page with better styling/interactivity
3. **Phase 3** (Week 3): Analytics integration, optimize based on data
4. **Phase 4** (Future): Consider expanding embedded content if metrics justify
