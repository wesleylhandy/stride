# Plan: Fix Duplicate Navigation in Marketing Site Install Page

## Problem

The marketing site's `/docs/install` page shows duplicate navigation:
1. **Layout-level navigation** (`DocsNavigation` component) - Top-level tabs: "Installation" and "Configuration"
2. **Page-level navigation** (`DocumentationPageContent` sections) - Duplicate tabs showing the same options

This happens because:
- The layout provides top-level navigation via `DocsNavigation`
- The install page passes `sections` to `DocumentationPageContent`, which renders its own navigation tabs
- The configuration page works correctly because it uses page-level navigation for **sub-sections** (reference, troubleshooting, etc.), not top-level pages

## Solution: Make Navigation Optional in DocumentationPageContent

### Approach: Backward-Compatible Optional Sections

Make the `sections` and `activeSection` props optional in `DocumentationPageContent`, and only render navigation tabs when sections are provided.

### Benefits

1. **No breaking changes**: Existing pages that use sections continue to work
2. **Flexible**: Pages can choose whether to show page-level navigation
3. **Consistent**: Marketing site uses layout-level navigation, web app uses page-level navigation
4. **Reusable**: Same component works for both use cases

## Implementation Plan

### Step 1: Update DocumentationPageContent Component

**File**: `packages/ui/src/organisms/DocumentationPageContent.tsx`

**Changes**:
1. Make `sections` prop optional: `sections?: DocumentationSection[]`
2. Make `activeSection` prop optional: `activeSection?: string`
3. Conditionally render navigation tabs: Only show if `sections` is provided and has items
4. Update JSDoc to explain when to use sections vs when to omit

**Code Changes**:
```typescript
export interface DocumentationPageContentProps {
  // ... existing props ...
  /**
   * Navigation sections/tabs (optional)
   * Omit for pages that use layout-level navigation (e.g., marketing site top-level pages)
   * Provide for pages with sub-section navigation (e.g., configuration sub-sections)
   */
  sections?: DocumentationSection[];
  /**
   * Currently active section key (optional, required if sections provided)
   */
  activeSection?: string;
  // ... rest of props ...
}
```

```typescript
{/* Navigation Tabs - Only render if sections provided */}
{sections && sections.length > 0 && (
  <div className="mb-8 border-b border-border dark:border-border-dark">
    <nav className="-mb-px flex space-x-8">
      {sections.map((sec) => (
        // ... existing navigation code ...
      ))}
    </nav>
  </div>
)}
```

### Step 2: Update Marketing Site Install Page

**File**: `apps/site/app/docs/install/page.tsx`

**Changes**:
1. Remove `sections` prop from `DocumentationPageContent`
2. Remove `activeSection` prop
3. Keep `lastUpdated` prop for footer

**Result**: Page uses layout-level navigation only, no duplicate tabs

### Step 3: Verify Other Pages Still Work

**Pages to verify**:
- ✅ Marketing site configuration page (uses sections for sub-sections - should still work)
- ✅ Web app pages (all use sections - should still work)
- ✅ Marketing site install page (no sections - should work without duplicate nav)

## Testing Checklist

- [ ] Marketing site `/docs/install` shows only layout-level navigation (no duplicate)
- [ ] Marketing site `/docs/configuration` shows both layout-level and page-level navigation (sub-sections)
- [ ] Web app documentation pages continue to show page-level navigation
- [ ] Last updated footer appears on install page
- [ ] No TypeScript errors
- [ ] No console errors

## Alternative Approaches Considered

### Option A: Separate Component for Marketing Site
**Rejected**: Creates duplication, violates DRY principle

### Option B: Conditional Rendering Based on App Context
**Rejected**: Adds complexity, couples component to app structure

### Option C: Make Sections Optional (Chosen)
**Accepted**: Clean, backward-compatible, flexible

## Migration Notes

- **No migration needed**: All existing pages continue to work
- **New pages**: Can choose whether to provide sections based on navigation needs
- **Marketing site pattern**: Top-level pages omit sections, sub-section pages provide sections
