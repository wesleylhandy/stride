# Research: Projects Dashboard and Listing Page

**Feature**: Projects Dashboard and Listing Page  
**Created**: 2024-12-19

## Research Questions & Decisions

### 1. Issue Count Calculation

**Question**: How should we calculate and display issue count per project on the listing page?

**Decision**: Calculate issue count via database aggregation query when fetching projects.

**Rationale**:
- Efficient: Single query with aggregation is faster than N+1 queries
- Accurate: Real-time count from database
- Scalable: Works well even with many projects

**Implementation**:
- Add `_count` relation to Project repository query
- Use Prisma `_count` feature: `include: { issues: { select: { id: true } } }`
- Calculate count from `project.issues.length` or use `_count` if available

**Alternatives Considered**:
- Client-side counting: Less efficient, requires loading all issues
- Separate API endpoint: Unnecessary complexity for simple count
- Cached counts: Adds complexity, not needed for MVP

---

### 2. Last Activity Timestamp

**Question**: How should we determine "last activity" for a project?

**Decision**: Use `Project.updatedAt` field as last activity indicator.

**Rationale**:
- Simple: Already exists in schema, no additional queries
- Accurate enough: Project updates when issues change (via triggers or app logic)
- Performance: No additional database queries needed
- MVP appropriate: Sufficient for initial implementation

**Implementation**:
- Display `project.updatedAt` formatted as relative time (e.g., "2 hours ago")
- Use date-fns or similar library for formatting

**Alternatives Considered**:
- Max issue `updatedAt`: More accurate but requires aggregation query
- Separate activity tracking table: Over-engineered for MVP
- Manual activity tracking: Adds unnecessary complexity

**Future Enhancement**: Could enhance later with max issue `updatedAt` if needed for more accurate activity tracking.

---

### 3. Empty State Navigation

**Question**: Where should the empty state link navigate users to create a project?

**Decision**: Link to `/onboarding/project` or provide in-page project creation if simple.

**Rationale**:
- Existing onboarding flow already handles project creation
- Consistent user experience
- Reuses existing functionality

**Implementation**:
- Empty state component shows message: "No projects yet"
- Call-to-action button: "Create Your First Project"
- Links to `/onboarding/project` or opens project creation modal/flow

**Alternatives Considered**:
- Direct project creation form on page: Could be implemented later
- Link to project settings: Not appropriate for first project
- Separate project creation page: Unnecessary duplication

---

### 4. Project Card Component Design

**Question**: Should ProjectCard be in shared UI package or app-specific?

**Decision**: Start as app-specific component, move to shared package if reused.

**Rationale**:
- YAGNI: Only used in one place initially
- Flexibility: Can customize for app-specific needs
- Easy to refactor: Can move to shared package later if needed

**Implementation**:
- Create `apps/web/components/ProjectCard.tsx` initially
- Use existing UI components (Button, Card if available)
- Make it reusable within app

**Alternatives Considered**:
- Shared package from start: Premature abstraction
- Multiple specialized cards: Unnecessary complexity

---

### 5. Error State Handling

**Question**: How should we handle errors when project data fails to load?

**Decision**: Use Next.js error.tsx pattern with retry functionality.

**Rationale**:
- Standard Next.js pattern
- Consistent with existing codebase
- Provides good UX with error messages and retry

**Implementation**:
- Create `apps/web/app/projects/error.tsx`
- Display user-friendly error message
- Provide retry button that reloads the page
- Log errors server-side for debugging

**Alternatives Considered**:
- Inline error state: Less standard, more code in component
- Toast notifications: Less persistent, might be missed
- Silent failures: Poor UX

---

### 6. Performance Optimization

**Question**: Should we implement any performance optimizations for the listing page?

**Decision**: Start simple, optimize if needed based on measurements.

**Rationale**:
- KISS: Simple solution first
- Existing API already has pagination
- Optimize when metrics show need

**Implementation**:
- Use Server Component for initial render (no client-side fetch)
- Rely on existing pagination if needed
- Add loading.tsx for loading states

**Future Optimizations** (if needed):
- Implement virtual scrolling for large lists
- Add project data caching
- Lazy load issue counts

---

## Summary

All research questions resolved with practical, MVP-appropriate decisions that balance simplicity with functionality. The implementation follows existing patterns and can be enhanced incrementally based on user feedback and performance metrics.

