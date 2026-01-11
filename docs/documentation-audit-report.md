# Documentation Audit Report

**Date**: 2024-12-19  
**Scope**: Markdown documentation files outside the root `docs/` folder  
**Principle**: `docs/` folder is the single source of truth. Duplicates in `docs/` take precedence.

## Summary

| Category        | Count  | Keep  | Delete             | Hold  |
| --------------- | ------ | ----- | ------------------ | ----- |
| Root Level      | 8      | 2     | ✅ 2 (deleted)     | 4     |
| App-Level       | 2      | 0     | 0                  | 2     |
| Package READMEs | 5      | 5     | 0                  | 0     |
| **Total**       | **15** | **7** | **✅ 2 (deleted)** | **6** |

---

## Root Level Markdown Files

### ✅ KEEP

#### 1. `README.md`

- **Status**: KEEP
- **Reason**: Main project README - standard practice
- **Referenced**: Standard GitHub root README
- **Action**: None

#### 2. `AGENTS.md`

- **Status**: KEEP
- **Reason**: Cursor rules configuration file - referenced in workspace rules
- **Referenced**: Yes (in workspace configuration)
- **Action**: None

#### 3. `README-DATABASE.md`

- **Status**: KEEP
- **Reason**: Referenced by `docs/deployment/docker.md`
- **Referenced**: Yes - `docs/deployment/docker.md` line 612
- **Action**: Update reference in `docs/deployment/docker.md` if moving to `docs/`

### ❌ DELETE (Completed)

#### 4. `ANALYSIS_REPORT.md` ✅ DELETED

- **Status**: DELETE - **COMPLETED**
- **Reason**: One-time analysis report, not referenced by any components
- **Referenced**: No
- **Content**: Specification analysis from 2024-12-19
- **Action**: ✅ Deleted - historical analysis not needed for active development

#### 5. `UPDATED_ANALYSIS_REPORT.md` ✅ DELETED

- **Status**: DELETE - **COMPLETED**
- **Reason**: Updated version of analysis report, not referenced by any components
- **Referenced**: No
- **Content**: Updated specification analysis
- **Action**: ✅ Deleted - historical analysis not needed for active development

### ⏸️ HOLD (Review Later)

#### 6. `TESTING_GUIDE.md`

- **Status**: HOLD
- **Reason**: Referenced by `docs/development/README.md`, but different content from `docs/TESTING_SETUP.md`
- **Referenced**: Yes - `docs/development/README.md` line 514
- **Relationship**:
  - `TESTING_GUIDE.md` (root) - General testing and running guide, includes manual testing checklists
  - `docs/TESTING_SETUP.md` - Specific test setup instructions (Vitest, Playwright)
- **Recommendation**:
  - Option A: Move to `docs/testing/TESTING_GUIDE.md` and update reference
  - Option B: Merge relevant content into `docs/TESTING_SETUP.md` if overlap exists
  - Option C: Keep as-is if serves different purpose (manual vs automated testing)
- **Action**: Review content overlap and decide on consolidation strategy

#### 7. `TESTING_QUICKSTART.md`

- **Status**: HOLD
- **Reason**: Referenced in multiple places, serves as quick reference
- **Referenced**:
  - `docs/PLAYWRIGHT_MONOREPO_PLAN.md` line 426
  - `specs/001-stride-application/playwright-reorganization-tasks.md` lines 242, 458
  - Self-references `docs/TESTING_SETUP.md` for details
- **Relationship**: Quick reference guide that points to `docs/TESTING_SETUP.md` for details
- **Recommendation**:
  - Move to `docs/testing/QUICKSTART.md` and update all references
  - Or keep as root-level quickstart if common pattern
- **Action**: Update references if moving, or keep as root-level quickstart

#### 8. `FONT_SETUP.md`

- **Status**: HOLD
- **Reason**: Contains useful setup information but not referenced
- **Referenced**: No
- **Content**: Font configuration guide (Inter, JetBrains Mono)
- **Recommendation**:
  - Move to `docs/development/font-setup.md` if this is active documentation
  - Delete if fonts are already configured and this is historical
- **Action**: Review if this is active reference or historical setup docs

---

## App-Level Documentation

### ⏸️ HOLD (Design Decision Documentation)

#### 9. `apps/web/src/lib/navigation/BREADCRUMB_RECOMMENDATION.md`

- **Status**: HOLD
- **Reason**: Design decision documentation, not directly referenced but implementation exists
- **Referenced**: No direct imports, but implementation exists in `apps/web/src/lib/navigation/breadcrumbs.ts`
- **Content**: Decision rationale for breadcrumb route detection approach (Option 5: Hybrid)
- **Recommendation**:
  - Keep as design decision documentation (ADR - Architecture Decision Record)
  - Consider moving to `docs/architecture/decisions/` if establishing ADR practice
  - Or move to `docs/development/breadcrumb-implementation.md`
- **Action**: Decide on ADR practice and move accordingly, or keep as implementation reference

#### 10. `apps/web/src/lib/navigation/breadcrumb-options.md`

- **Status**: HOLD
- **Reason**: Design options analysis, useful for understanding implementation decisions
- **Referenced**: No direct imports, but related to `BREADCRUMB_RECOMMENDATION.md`
- **Content**: Detailed analysis of 5 different approaches to breadcrumb route detection
- **Recommendation**:
  - Keep alongside recommendation as design documentation
  - Move to same location as `BREADCRUMB_RECOMMENDATION.md`
- **Action**: Move with `BREADCRUMB_RECOMMENDATION.md` or delete if redundant

---

## Package READMEs

### ✅ KEEP (Standard Practice)

All package READMEs should be kept as they serve as package-specific documentation:

- `packages/types/README.md` - KEEP
- `packages/yaml-config/README.md` - KEEP
- `packages/ai-gateway/README.md` - KEEP
- `packages/database/README.md` - KEEP
- `packages/ui/README.md` - KEEP

**Reason**: Standard npm/monorepo practice to have README in each package

---

## Recommendations Summary

### Immediate Actions

1. ✅ **Delete** (2 files) - **COMPLETED**:
   - ✅ `ANALYSIS_REPORT.md` - Deleted
   - ✅ `UPDATED_ANALYSIS_REPORT.md` - Deleted

### Review and Consolidate (4 files):

2. **Review content overlap**:
   - `TESTING_GUIDE.md` vs `docs/TESTING_SETUP.md` - determine if merge needed
   - `TESTING_QUICKSTART.md` - move to `docs/testing/` or keep as root quickstart

3. **Move or organize**:
   - `FONT_SETUP.md` - move to `docs/development/` if active, or delete if historical
   - `apps/web/src/lib/navigation/*.md` - decide on ADR location or move to `docs/development/`

4. **Update references**:
   - Update `docs/development/README.md` if `TESTING_GUIDE.md` moves
   - Update `docs/deployment/docker.md` if `README-DATABASE.md` moves
   - Update all references if `TESTING_QUICKSTART.md` moves

### Keep As-Is (7 files):

- `README.md` (root)
- `AGENTS.md` (cursor rules)
- `README-DATABASE.md` (referenced)
- All package READMEs (5 files)

---

## Files Not in Scope

The following are intentionally excluded:

- **`specs/` folder**: Specification documents (intentional separate location)
- **Files inside `docs/` folder**: Already in correct location
- **Component-level documentation**: Inline code documentation

---

## Next Steps

1. ✅ **Phase 1**: Delete clearly obsolete files (`ANALYSIS_REPORT.md`, `UPDATED_ANALYSIS_REPORT.md`) - **COMPLETE**
2. **Phase 2**: Review and consolidate testing documentation
3. **Phase 3**: Organize design decision documentation (breadcrumb files)
4. **Phase 4**: Review font setup documentation status
5. **Phase 5**: Update all cross-references after moves
