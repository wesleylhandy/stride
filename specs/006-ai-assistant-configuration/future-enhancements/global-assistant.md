# Global AI Assistant Enhancement Proposal

**Status**: Proposed / Future Enhancement  
**Created**: 2026-01-23  
**Priority**: Medium  
**Estimated Effort**: 30-44 hours (~1 week)

## Overview

Proposal to make the AI Configuration Assistant globally accessible from any page via a floating action button that opens in a modal or sidebar, rather than being limited to specific settings pages.

## Current State

- **Location**: Assistant is currently embedded on specific pages:
  - Project Settings → Configuration tab (`/projects/[projectId]/settings?tab=config`)
  - Infrastructure Settings (`/settings/infrastructure`)
- **Context**: Determined by current route
  - Project context: Automatically detected from `/projects/[projectId]/...` routes
  - Infrastructure context: When on `/settings/infrastructure`
- **Discovery**: Users must navigate to settings pages to access assistant

## Proposed Change

### Core Idea
- Add floating action button (FAB) visible on all authenticated pages
- Clicking opens assistant in modal (desktop) or full-screen overlay (mobile)
- Context automatically detected from current route
- Assistant persists across page navigation (optional Phase 2 enhancement)

### User Experience Benefits
- **Improved Discoverability**: Always visible, not hidden in settings
- **Better Convenience**: Available from any page without navigation
- **Consistent Access Pattern**: Single entry point across application
- **Reduced Friction**: No need to navigate away from current work

## Critical Analysis

### 1. Architecture Impact

#### Context Detection
- **Challenge**: Need to determine context from any route
  - Project routes: Extract `projectId` from URL pattern `/projects/[projectId]/...`
  - Infrastructure routes: Detect `/settings/infrastructure`
  - Ambiguous routes (e.g., `/projects` listing): Default to infrastructure (admin) or prompt user
- **Solution**: Create context detection utility that parses current pathname
- **Complexity**: Medium

#### API Routing
- Current: Separate routes per context
  - `/api/projects/[projectId]/assistant/*` (project context)
  - `/api/settings/infrastructure/assistant/*` (infrastructure context)
- Change Required: Dynamic endpoint selection based on detected context
- **Impact**: Low (existing routes can be used, just need dynamic selection)

#### State Management
- **Challenge**: Conversation persistence across route changes
- **Solution Options**:
  1. Persist in React Context/global state (recommended)
  2. Store in localStorage temporarily
  3. Always reload on open (simplest, but loses context)
- **Recommendation**: React Context for conversation state, reload messages from API on context change

### 2. UX Considerations

#### Modal vs Sidebar
**Recommended: Modal**
- Better mobile support (can be full-screen)
- Less distraction (overlay blocks background)
- Easier implementation
- Familiar pattern (similar to command palette)

**Sidebar Alternative**
- Pros: Always visible, multi-tasking friendly
- Cons: Takes permanent screen space, mobile challenges, conflicts with existing sidebar

#### Context Awareness
- **Auto-Detection** (Recommended for Phase 1):
  - Parse URL to determine context
  - Show context indicator in assistant header
  - Clear messaging about which context is active
- **Manual Override** (Phase 2 Enhancement):
  - Add context switcher dropdown
  - Allow user to manually select project context
  - Useful for ambiguous routes (e.g., projects list)

#### Mobile Experience
- Modal should be full-screen on mobile (< 768px)
- Bottom sheet pattern could work well
- FAB positioned bottom-right for thumb accessibility

### 3. Performance Impact

#### Bundle Size
- **Current**: Code-split per route (~100-200KB when loaded)
- **Global**: Always included in main bundle (+200-300KB initial load)
- **Mitigation**: Lazy-load assistant component on first button click
- **Impact**: Low-Medium (one-time cost, then cached)

#### Memory
- Modal stays mounted when open (conversation state retained)
- Impact: Low-Medium (React component overhead)
- **Recommendation**: Unmount when closed to free memory

#### API Usage
- No change to API call patterns
- May increase usage (easier access = more usage)
- Rate limiting already in place
- **Impact**: Low (already handled)

### 4. Security & Permissions

#### Access Control
- **Current**: Permissions checked on settings pages
- **Change Required**: Check permissions on assistant open
  - Project context: Check `canUseProjectAssistant(userRole, projectConfig)`
  - Infrastructure context: Check `canUseInfrastructureAssistant(userRole)`
- **Implementation**: Disable/hide button if no access, show clear error if access denied
- **Risk**: Low (existing permission checks can be reused)

#### Route-Based Access
- Must still respect route-based access (can't access project assistant without project access)
- Context detection should validate project access before using project context
- **Recommendation**: Permission check on context detection, not just on API call

### 5. Development Effort

#### Estimated Tasks & Time

1. **Global Button Component** (4-6 hours)
   - Floating action button in DashboardLayout
   - Permission-aware visibility
   - Accessibility (keyboard, screen reader)

2. **Context Detection Utility** (4-6 hours)
   - Parse pathname to extract context
   - Handle edge cases (projects list, home, etc.)
   - Project access validation

3. **Modal/Sidebar Wrapper** (6-8 hours)
   - Reusable modal component
   - Wrap existing ConfigurationAssistantClient
   - Mobile responsiveness
   - Animation/transitions

4. **Global State Management** (4-6 hours)
   - React Context for assistant state
   - Conversation persistence logic
   - Context change handling

5. **Permission Integration** (2-4 hours)
   - Button visibility logic
   - Permission checks on open
   - Error states

6. **Mobile Responsiveness** (4-6 hours)
   - Mobile modal styling
   - Touch interactions
   - Bottom sheet pattern (optional)

7. **Testing & Edge Cases** (6-8 hours)
   - Test across all route types
   - Context switching scenarios
   - Permission edge cases
   - Mobile device testing

**Total: 30-44 hours (~1 week)**

#### Complexity Areas
- Context detection edge cases (project list, home page, etc.)
- State management across route changes
- Mobile UX decisions
- Permission handling across contexts

### 6. Implementation Phases

#### Phase 1: MVP (Global Button + Modal)
1. ✅ Add floating action button in DashboardLayout
2. ✅ Implement context auto-detection from URL
3. ✅ Create modal wrapper component
4. ✅ Lazy-load assistant on first open
5. ✅ Show context indicator in assistant header
6. ✅ Permission checks and error handling

#### Phase 2: Enhancements
1. Context switcher for manual override
2. Conversation persistence across page navigation
3. Keyboard shortcut (`Cmd/Ctrl + K`)
4. Recently used projects quick-switch
5. Bottom sheet pattern for mobile

### 7. Maintenance Considerations

#### Ongoing Complexity
- Context detection logic needs updates for new routes
- State management becomes more complex
- Testing matrix grows (more contexts × routes)

#### Benefits
- Easier to add features (not route-specific)
- Centralized assistant logic
- Better analytics (usage across pages)

## Recommendations

### Primary Recommendation
**✅ Proceed with Global Assistant as Modal (Phase 1)**

**Rationale**:
- High user value (accessibility, convenience)
- Moderate implementation complexity
- Manageable technical risks
- Clear path forward

### Implementation Priority
1. **High Priority**:
   - Context auto-detection
   - Permissions integration
   - Lazy loading
   - Modal component

2. **Medium Priority**:
   - Context switcher
   - Conversation persistence
   - Keyboard shortcuts

3. **Low Priority**:
   - Project quick-switch
   - Bottom sheet mobile pattern

### Key Technical Decisions

1. **Modal over Sidebar**: Better mobile support, less screen clutter
2. **Auto-detect context**: Simplifies UX, reduces user decision fatigue
3. **Lazy loading**: Maintains performance, reduces initial bundle size
4. **React Context for state**: Clean state management, React-native pattern

## Open Questions

1. **Conversation Persistence**: Should conversations persist when switching pages?
   - Recommendation: Yes, but reload on context change

2. **Keyboard Shortcut**: Should we use `Cmd/Ctrl + K` (conflicts with command palette)?
   - Recommendation: Use different shortcut or integrate with command palette

3. **Button Position**: Fixed bottom-right or configurable?
   - Recommendation: Fixed bottom-right for consistency

4. **Empty States**: How to handle when no context available?
   - Recommendation: Show context selector or disable button

## Related Features

- **Command Palette**: Consider integration point
- **Project Selector**: May benefit from shared context detection logic
- **Navigation System**: Context detection could be reusable utility

## References

- Current implementation: `apps/web/src/components/features/projects/ConfigurationAssistantClient.tsx`
- Context detection: URL parsing in `packages/ui/src/organisms/Sidebar.tsx` (lines 76-79)
- Permissions: `apps/web/src/lib/assistant/access-control.ts`
- Layout structure: `apps/web/src/components/templates/DashboardLayout.tsx`

## Notes

- This enhancement does not change the core assistant functionality
- All existing features (validation, documentation, etc.) remain unchanged
- Backward compatible - existing embedded assistants still work
- Can be implemented incrementally (Phase 1 first, then Phase 2)
