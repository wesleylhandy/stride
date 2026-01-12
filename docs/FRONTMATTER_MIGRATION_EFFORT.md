# Frontmatter Migration Effort Assessment

**Date**: 2026-01-23  
**Scope**: Apply frontmatter pattern (YAML frontmatter with Purpose/Target-Audience excluded from UI, Last-Updated footer) to all documentation files

## Current State

### ✅ Completed
- **Deployment docs** (3 files):
  - `docs/deployment/README.md`
  - `docs/deployment/docker.md`
  - `docs/deployment/infrastructure-configuration.md`
- **Web app deployment pages** (3 pages):
  - `apps/web/app/docs/deployment/page.tsx`
  - `apps/web/app/docs/deployment/[guide]/page.tsx`

### 📊 Inventory

#### Markdown Files in `docs/` Directory
**Total**: 34 files

**Already have frontmatter**: 3 files
- `docs/deployment/README.md` ✅
- `docs/deployment/docker.md` ✅
- `docs/deployment/infrastructure-configuration.md` ✅

**Have old-style metadata** (need conversion): ~4 files
- `docs/testing/user-management-local-testing.md` (has Purpose/Target Audience/Last Updated)
- `docs/VERSION_COMPATIBILITY.md` (has Last Updated/Purpose)
- `docs/IMPLEMENTATION_NOTES.md` (has Purpose)
- `docs/testing/user-management-quick-test.md` (may have metadata)

**Need frontmatter added**: ~27 files
- Integration docs: `ai-providers.md`, `git-oauth.md`, `monitoring-webhooks.md`, `sentry.md`, `smtp.md`, `index.md`
- Configuration docs: `reference.md`, `troubleshooting.md`, `examples.md`, `README.md`
- User docs: `README.md`, `ai-triage.md`
- Development docs: `README.md`, `troubleshooting.md`
- Other docs: Various guides and reference docs

#### Web App Documentation Pages
**Total**: 11 pages

**Already updated**: 3 pages
- `apps/web/app/docs/deployment/page.tsx` ✅
- `apps/web/app/docs/deployment/[guide]/page.tsx` ✅

**Need updating**: 8 pages
1. `apps/web/app/docs/integrations/page.tsx` (overview)
2. `apps/web/app/docs/integrations/smtp/page.tsx`
3. `apps/web/app/docs/integrations/sentry/page.tsx`
4. `apps/web/app/docs/integrations/ai-providers/page.tsx`
5. `apps/web/app/docs/integrations/git-oauth/page.tsx`
6. `apps/web/app/docs/integrations/monitoring-webhooks/page.tsx`
7. `apps/web/app/docs/configuration/page.tsx` (handles 4 sections)

#### Marketing Site Documentation Pages
**Total**: 2 pages

**Need updating**: 1 page
1. `apps/site/app/docs/configuration/page.tsx` (handles 4 sections)

**Note**: `apps/site/app/docs/install/page.tsx` is hardcoded (not markdown), so no changes needed.

## Effort Breakdown

### Phase 1: Update Web App Integration Pages (Medium Effort)
**Files to update**: 6 pages
- Update `getDocContent()` functions to use `parseDocFrontmatter()`
- Change return type from `Promise<string>` to `Promise<ParsedDoc>`
- Pass `lastUpdated` to `DocumentationPageContent`
- **Estimated time**: 30-45 minutes

**Markdown files to update**: 6 files
- `docs/integrations/index.md`
- `docs/integrations/smtp.md`
- `docs/integrations/sentry.md`
- `docs/integrations/ai-providers.md`
- `docs/integrations/git-oauth.md`
- `docs/integrations/monitoring-webhooks.md`
- **Estimated time**: 15-20 minutes (add frontmatter, remove any existing metadata)

### Phase 2: Update Configuration Pages (Low Effort)
**Files to update**: 2 pages (web + marketing site)
- `apps/web/app/docs/configuration/page.tsx`
- `apps/site/app/docs/configuration/page.tsx`
- Both use same pattern, just update `getDocContent()` function
- **Estimated time**: 15-20 minutes

**Markdown files to update**: 4 files
- `docs/configuration/reference.md`
- `docs/configuration/troubleshooting.md`
- `docs/configuration/examples.md`
- `docs/board-status-configuration-guide.md`
- **Estimated time**: 10-15 minutes

### Phase 3: Add Frontmatter to Remaining Docs (Low-Medium Effort)
**Files to update**: ~27 markdown files
- Most files just need frontmatter added (no existing metadata to remove)
- Some files need old-style metadata converted
- **Estimated time**: 1-2 hours (depending on how many have existing metadata)

**Note**: These files may not be rendered in web/marketing site yet, but adding frontmatter now ensures consistency for future use.

### Phase 4: Install gray-matter in Marketing Site (Low Effort)
**Action**: Install `gray-matter` package in marketing site
- `pnpm add gray-matter --filter @stride/site`
- Create shared utility (or reuse from web app)
- **Estimated time**: 5-10 minutes

## Total Effort Estimate

| Phase | Description | Time Estimate |
|--------|-------------|---------------|
| Phase 1 | Web app integration pages + markdown | 45-65 min |
| Phase 2 | Configuration pages + markdown | 25-35 min |
| Phase 3 | Remaining markdown files | 60-120 min |
| Phase 4 | Marketing site setup | 5-10 min |
| **Total** | | **2.25 - 3.8 hours** |

**Conservative estimate**: ~4 hours (including testing and verification)

## Implementation Strategy

### Option A: Incremental (Recommended)
1. **Phase 1**: Update integration docs (most visible, high value)
2. **Phase 2**: Update configuration docs (shared between web and marketing)
3. **Phase 3**: Add frontmatter to remaining docs (can be done gradually)
4. **Phase 4**: Marketing site setup (can be done with Phase 2)

**Benefits**: 
- Can deploy after each phase
- Test incrementally
- Lower risk

### Option B: All at Once
- Complete all phases in one go
- **Benefits**: Consistent state, no partial migration
- **Drawbacks**: Larger change, more testing needed

## Dependencies

### Already Available
- ✅ `gray-matter` package installed in `apps/web`
- ✅ `parseDocFrontmatter()` utility function created
- ✅ `DocumentationPageContent` component updated with `lastUpdated` prop
- ✅ Frontmatter parsing pattern established

### Needed
- Install `gray-matter` in `apps/site` (Phase 4)
- Create shared utility or duplicate frontmatter parsing (can reuse from web app)

## Risk Assessment

**Low Risk**:
- Frontmatter parsing is already tested in deployment docs
- Changes are additive (frontmatter is optional, won't break existing docs)
- Can be done incrementally

**Considerations**:
- Some markdown files may not be actively rendered (still good to add frontmatter for consistency)
- Need to verify all pages still render correctly after changes
- Should test that docs without frontmatter still work (backward compatibility)

## Testing Checklist

After each phase:
- [ ] All affected pages load without errors
- [ ] Last-Updated footer appears on pages with frontmatter
- [ ] Purpose/Target-Audience fields are NOT displayed in UI
- [ ] Markdown content renders correctly (frontmatter stripped)
- [ ] Navigation and breadcrumbs still work
- [ ] No console errors

## Recommendations

1. **Start with Phase 1** (integration docs) - highest visibility, immediate value
2. **Use incremental approach** - deploy after each phase
3. **Add frontmatter to all docs** - even if not currently rendered, ensures consistency
4. **Create shared utility** - consider moving `parseDocFrontmatter` to `@stride/ui` or `@stride/types` if both apps need it
5. **Documentation** - update any docs about documentation structure to mention frontmatter pattern

## Next Steps

1. Decide on approach (incremental vs all-at-once)
2. Start with Phase 1 (integration docs)
3. Test thoroughly after each phase
4. Deploy incrementally
