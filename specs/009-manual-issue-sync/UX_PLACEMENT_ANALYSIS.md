# UX Placement Analysis: Manual Sync Button

**Feature**: Manual Issue Sync for Inactive Webhooks  
**Created**: 2026-01-27  
**Purpose**: Product Owner and UX evaluation of sync button placement

## Executive Summary

**Current Placement**: Project Settings → Integrations → Repository Connection Settings (bottom of connection card)

**Assessment**: ⚠️ **Suboptimal** - The current placement treats sync as a configuration task when it's actually a frequent action. The button is buried 4 levels deep and requires users to navigate away from their work context.

**Recommendation**: **Multi-location strategy** - Place sync button in context where users actually work with issues (Board/Issues pages) with a fallback in settings for configuration context.

---

## Current State Analysis

### Current Location
```
Project → Settings → Integrations Tab → Repository Connection Card → Bottom Section
```

**Visual Hierarchy**: The sync button appears at the bottom of a settings card, positioned after configuration text about "updating your connection."

**Contextual Issues**:
1. **Discovery Problem**: Users must navigate 4 levels deep to find sync functionality
2. **Context Mismatch**: Sync is an action, but it's placed in a configuration context
3. **Visual Weight**: The button competes with "Update Connection" form for attention
4. **Confusing Adjacency**: Placed next to text about "updating connection" creates confusion about purpose

### User Journey (Current)
```
User notices issues are outdated
  ↓
User thinks: "I need to sync issues"
  ↓
User navigates: Board → Settings → Integrations
  ↓
User scrolls to bottom of connection card
  ↓
User finds sync button (after reading connection update text)
  ↓
User clicks sync
```

**Friction Points**:
- ❌ 4 navigation steps required
- ❌ Context switch: Leave work area to access action
- ❌ Mental model mismatch: Action hidden in settings
- ❌ Low discoverability for regular use case

---

## UX Principles Analysis

### 1. **Action vs. Configuration** (Critical)

**Principle**: Actions that users perform regularly should be easily accessible. Configuration should be separate from frequently-used actions.

**Current State**: Sync button is mixed with configuration, making it feel like a setup task rather than a regular operation.

**Impact**: Users treat sync as a "one-time setup" when it's actually a recurring need.

### 2. **Proximity to Context** (Critical)

**Principle**: Actions should be located where users need them, not where they're configured.

**User Context When Needing Sync**:
- User is viewing the Board (Kanban) - notices missing issues
- User is viewing Issues List - sees stale data
- User is working on a project - needs fresh issue data

**Current State**: Sync requires leaving work context (Board/Issues) to access settings.

**Impact**: Context switching breaks workflow and reduces frequency of use.

### 3. **Discoverability** (High)

**Principle**: Frequently-used features should be discoverable without documentation.

**Current State**: Sync button is 4 levels deep in navigation, not visible from primary work areas.

**Impact**: Users may not know manual sync exists, or forget it's available.

### 4. **Visual Hierarchy** (Medium)

**Principle**: Important actions should have appropriate visual weight.

**Current State**: Button is placed at bottom of a settings card, after explanatory text about connection updates.

**Impact**: Button doesn't communicate importance; blends into settings UI.

### 5. **Frequency vs. Placement** (High)

**Principle**: More frequent actions should require fewer clicks.

**Estimated Frequency**:
- **High frequency**: When webhooks are inactive, users may sync multiple times per day/week
- **Medium frequency**: Even with active webhooks, users may manually trigger sync for immediate updates
- **Low frequency**: Configuration (connecting repository) happens once or rarely

**Current State**: High-frequency action requires same effort as low-frequency configuration.

**Impact**: Users avoid using sync due to friction, or only discover it after frustration.

---

## Placement Options Analysis

### Option 1: **Primary Work Areas** (Board/Issues Pages) ⭐ **RECOMMENDED**

**Placement**: Add sync button to Board and Issues list pages

**Specific Locations**:
1. **Board Page** (`/projects/[id]/board`):
   - Top toolbar, next to filters/views
   - Visual indicator when repository is connected
   - Show "Last synced: X minutes ago" or sync status badge

2. **Issues List Page** (`/projects/[id]/issues`):
   - Top toolbar, next to create issue button
   - Similar sync status indicator

**Advantages**:
- ✅ **Contextual**: User is already where they need the result
- ✅ **Discoverable**: Visible in primary work areas
- ✅ **Efficient**: 0-1 clicks to access (depending on design)
- ✅ **Immediate feedback**: Sync results visible immediately
- ✅ **Natural workflow**: User notices stale data → clicks sync → sees updated data

**Disadvantages**:
- ⚠️ Button takes up toolbar space
- ⚠️ Only visible when repository is connected

**Implementation**:
- Show sync button in project header/toolbar when repository connection exists
- Add "Last synced" timestamp display
- Use subtle visual indicator for sync status (icon badge when webhook is inactive)

**UX Pattern**: Similar to "Refresh" buttons in data apps (Jira, Linear, Asana)

---

### Option 2: **Project Header** ⭐ **RECOMMENDED**

**Placement**: Project header (visible on all project pages)

**Specific Location**: 
- Project header toolbar, next to project name/settings link
- Or in a "Repository" dropdown/menu if multiple connections exist

**Advantages**:
- ✅ **Always visible**: Accessible from any project page
- ✅ **Contextual**: Present where user is working
- ✅ **Efficient**: 1 click from any page
- ✅ **Consistent**: Same location across all project views

**Disadvantages**:
- ⚠️ Header space is limited (needs careful design)
- ⚠️ May compete with other header actions

**Implementation**:
- Add sync button to `ProjectHeader` component
- Show only when repository connection exists
- Include sync status indicator (icon with last sync time tooltip)

**UX Pattern**: Similar to GitLab/Jira project-level actions

---

### Option 3: **Settings with Better Visibility** ⚠️ **ACCEPTABLE**

**Placement**: Keep in settings but improve placement

**Specific Changes**:
1. Move sync button to top of Repository Connection card (not bottom)
2. Separate visually from "Update Connection" form
3. Add prominent "Sync Status" section
4. Add breadcrumb/quick link from Board/Issues pages to sync

**Advantages**:
- ✅ Maintains clear separation: configuration vs. action
- ✅ Logical grouping with repository connection info
- ✅ Easier to find than current placement

**Disadvantages**:
- ❌ Still requires navigation to settings
- ❌ Context switching remains an issue
- ❌ Lower discoverability than work-area placement

**Implementation**:
- Restructure `RepositoryConnectionSettings` component
- Add sync status card at top (prominent)
- Move connection update form below

---

### Option 4: **Multi-Location Strategy** ⭐⭐ **BEST**

**Placement**: Multiple strategic locations with context-appropriate UI

**Locations**:
1. **Project Header** (all pages): Quick sync button with status indicator
2. **Board/Issues Toolbar**: Prominent sync button when needed
3. **Settings**: Full sync controls and configuration

**Advantages**:
- ✅ **Maximum discoverability**: Users find it where they expect
- ✅ **Contextual adaptation**: Different UI weight based on location
- ✅ **Flexibility**: Power users can access from settings, regular users from work areas
- ✅ **Progressive disclosure**: Simple button in work areas, full controls in settings

**Disadvantages**:
- ⚠️ Requires implementation in multiple locations
- ⚠️ Need to keep UI consistent across locations

**Implementation Strategy**:
1. **Project Header**: Simple sync button with icon + status badge
2. **Board/Issues**: Sync button in toolbar with "Last synced" info
3. **Settings**: Full sync controls with options (sync type, include closed, etc.)

**UX Pattern**: Similar to GitHub's "Sync" button in repository views

---

## Revised Recommendation: Single Well-Placed Button with Sync Status Card

### Primary Recommendation: Settings Page with Prominent Sync Status Card ⭐

**Placement**: Project Settings → Integrations → **Sync Status Card (top of page)**

**Rationale**:
- ✅ **Logical grouping**: Sync belongs with repository connection info
- ✅ **Prominent visibility**: Sync Status Card makes it impossible to miss
- ✅ **Clear separation**: Sync action separate from connection configuration
- ✅ **Contextual information**: Card shows sync status, last sync time, webhook status
- ✅ **Full controls**: Room for sync type selector and options without cluttering work areas

**Structure**:
```
┌─ Sync Status Card (Prominent, Top) ─────────────┐
│ 🔄 Repository Sync                                │
│                                                   │
│ Last synced: 5 minutes ago                        │
│ Webhook: Active ✓ (or Inactive ⚠️)               │
│                                                   │
│ [Sync Issues] [Sync Type ▼] [Include Closed ☐]   │
│                                                   │
│ Quick sync: [Full] [Issues Only] [Security Only] │
└───────────────────────────────────────────────────┘

┌─ Connection Info ────────────────────────────────┐
│ GitHub: owner/repo                                │
│ Connected: Jan 15, 2026                          │
│ [Update Connection]                               │
└───────────────────────────────────────────────────┘

[Update Connection Form - Collapsed by default]
```

**Advantages**:
- Single, well-defined location
- Prominent Sync Status Card ensures discoverability
- All sync information in one place
- Doesn't clutter work areas (Board/Issues)
- Clear visual hierarchy

**Implementation**:
- Create new `SyncStatusCard` component
- Place at top of `RepositoryConnectionSettings`
- Move current sync button into card
- Add sync status indicators (last sync time, webhook status)
- Include all sync options in card

---

### Alternative: Project Header (If Work-Area Placement Preferred)

If you prefer the button in the work area rather than settings:

**Placement**: Project Header (right side, next to project name)

**Structure**:
```
[Project Name] [Project Key]          [Sync ⚡] [Settings]
                                    Last: 5m ago
```

**Advantages**:
- Always visible when working in project
- No navigation required
- Immediate access

**Disadvantages**:
- Header space is limited (may feel cramped)
- Less room for sync options/status
- Mixes action with navigation

**Recommendation**: Use this only if you want sync to be a primary action that users trigger frequently from work areas. Otherwise, Settings with Sync Status Card is better.

---

## Specific Implementation Suggestions

### Project Header Placement

```typescript
// In ProjectHeader component
{repositoryConnection && (
  <div className="flex items-center gap-2">
    <SyncButton
      projectId={projectId}
      repositoryId={repositoryConnection.id}
      variant="ghost"
      size="sm"
      showStatus={true}
    />
    {repositoryConnection.lastSyncAt && (
      <span className="text-xs text-foreground-secondary">
        Synced {formatRelativeTime(repositoryConnection.lastSyncAt)}
      </span>
    )}
  </div>
)}
```

### Board/Issues Toolbar Placement

```typescript
// In Board/Issues page toolbar
<div className="flex items-center gap-3">
  <Button onClick={handleCreateIssue}>New Issue</Button>
  {repositoryConnection && (
    <>
      <ManualSyncButton
        projectId={projectId}
        repositoryId={repositoryConnection.id}
        variant="outline"
        showSyncTypeSelector={false}
      />
      <SyncStatusIndicator
        lastSyncAt={repositoryConnection.lastSyncAt}
        isActive={repositoryConnection.isActive}
      />
    </>
  )}
</div>
```

### Settings Page Restructure (Recommended Implementation)

**Current Structure** (Problem):
```
[Connection Card]
  - Connection Info
  - [Sync Button] ← Bottom, after "update connection" text
[Update Connection Form]
```

**Proposed Structure** (Single Well-Placed Button):
```
┌─ Sync Status Card (NEW - Prominent) ────────────┐
│ 🔄 Repository Sync                                │
│                                                   │
│ Status:                                          │
│ • Last synced: 5 minutes ago                      │
│ • Webhook: Active ✓                              │
│ • Repository: github.com/owner/repo               │
│                                                   │
│ [Sync Issues] [Full ▼] [Include Closed ☐]        │
│                                                   │
│ Quick Actions:                                    │
│ [Full Sync] [Issues Only] [Security Only]        │
└───────────────────────────────────────────────────┘

┌─ Connection Information ─────────────────────────┐
│ GitHub: owner/repo                                │
│ Connected: Jan 15, 2026                          │
│ [Update Connection]                               │
└───────────────────────────────────────────────────┘

[Update Connection Form - Collapsed by default]
```

**Key Changes**:
1. **Sync Status Card at top** - Most prominent element
2. **Single sync button** - Primary action in card
3. **Status information** - Last sync, webhook status visible
4. **Quick actions** - Secondary buttons for common sync types
5. **Connection info separate** - Configuration separate from action

---

## Metrics to Track

After implementing improved placement:

1. **Usage Frequency**: Track how often sync is used from each location
2. **Discovery Time**: Measure time from "stale issues noticed" to "sync triggered"
3. **User Satisfaction**: Survey users on ease of finding sync functionality
4. **Context Analysis**: Track which pages users trigger sync from (Board vs. Issues vs. Settings)

---

## Conclusion

**Current placement in Settings/Integrations is suboptimal** because:
- Sync button is buried at bottom of connection card
- Positioned after "update connection" text (confusing)
- Low visual hierarchy
- Hard to discover

**Revised Recommendation**: **Single well-placed button with Sync Status Card**

**Primary Choice**: **Settings Page with Prominent Sync Status Card**
- Single, well-defined location
- Prominent card ensures discoverability
- All sync information and controls in one place
- Clear separation from connection configuration
- Doesn't clutter work areas

**Alternative**: **Project Header** (if work-area placement is preferred)
- Always visible when working in project
- Requires minimal header space
- Less room for sync options/status

**Implementation Priority**:
1. Create `SyncStatusCard` component with sync button and status
2. Place at top of Settings → Integrations page
3. Move all sync controls into card
4. Separate connection info into its own card below

This approach provides a single, well-placed button that's easy to find and use, while keeping the UI clean and organized.

---

## References

- **Current Implementation**: `apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx`
- **Spec**: `specs/009-manual-issue-sync/spec.md`
- **Related Components**: 
  - `ProjectHeader` (for header placement)
  - `KanbanBoardClient` (for board placement)
  - `IssuesList` (for issues page placement)
