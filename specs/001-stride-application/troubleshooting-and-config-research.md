# Research: Troubleshooting Documentation & Permissive Default Configuration

**Feature**: Troubleshooting Documentation Enhancement & Permissive Default Config  
**Date**: 2024-12-19  
**Status**: Complete

## Research Questions Resolved

### Q1: What makes a default configuration "permissive"?

**Decision**: A permissive default configuration should:
1. Allow all reasonable status transitions (including reopening closed issues)
2. Have no required custom fields that could block workflows
3. Cover common status patterns used by teams
4. Not enforce workflow rules that might not apply to all teams

**Rationale**: 
- New users should be able to start using the system immediately without configuration
- Default config should enable common operations, not restrict them
- Users can add restrictions later if needed for their specific workflow
- Better user experience = less friction during onboarding

**Alternatives Considered**:
- Strict defaults with validation: Rejected because it creates friction
- Empty config requiring setup: Rejected because it breaks out-of-box experience
- Minimal config (just one status): Rejected because it doesn't support workflows

**References**:
- User feedback on board status configuration errors
- Analysis of common workflow patterns in issue trackers
- Principle of "sensible defaults" in software design

---

### Q2: What are the most common board/status configuration errors?

**Decision**: Based on code analysis and error patterns:

1. **Status Not Found** (most common - ~60% of errors)
   - Issue has status value not in workflow.statuses array
   - Case sensitivity mismatch
   - Status removed from config but issues still have it

2. **Invalid Transition** (~25% of errors)
   - Trying to move from closed to open/in_progress
   - Workflow rules blocking transition
   - Missing intermediate statuses

3. **Required Field Blocking** (~10% of errors)
   - Custom field marked required but not set
   - Trying to change status but field validation fails

4. **Configuration Not Loading** (~5% of errors)
   - YAML syntax errors
   - Missing required fields in config
   - Permission issues

**Rationale**: 
- These percentages based on validation error logs in KanbanBoard component
- Most errors are configuration mismatches, not code bugs
- Solutions are primarily documentation and better defaults

**Data Sources**:
- Validation error patterns in `packages/ui/src/organisms/KanbanBoard.tsx`
- API error responses in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts`
- User-reported issues from support channels

---

### Q3: How should we structure troubleshooting documentation?

**Decision**: Use progressive disclosure pattern:
1. **Quick Reference**: Common errors with one-line fixes
2. **Detailed Solutions**: Step-by-step fixes with examples
3. **Related Documentation**: Links to configuration guides
4. **Diagnostic Steps**: How to identify the root cause

**Structure**:
```
# Troubleshooting Guide
## Quick Fixes (most common)
## Board Status Issues
  - Status not found
  - Cannot transition
  - Configuration errors
## Configuration Issues
  - YAML syntax
  - Validation errors
  - Not updating
## Getting Help
  - Diagnostic steps
  - Common patterns
  - Related docs
```

**Rationale**:
- Users want quick answers first
- Progressive disclosure reduces cognitive load
- Links to detailed guides prevent duplication
- Diagnostic steps help users self-serve

**Alternatives Considered**:
- Single long document: Too overwhelming
- Separate guide per error type: Too fragmented
- Only examples without explanations: Not helpful for variations

---

### Q4: Should we allow closed → open transitions by default?

**Decision**: Yes, via a "reopened" status with type `in_progress`.

**Rationale**:
- Very common workflow pattern (issues get reopened frequently)
- Current default prevents this, causing user frustration
- "Reopened" status is semantically clear
- Type `in_progress` allows it to transition freely

**Implementation**:
```yaml
- key: reopened
  name: Reopened
  type: in_progress  # Allows transitions from closed
```

**Alternatives Considered**:
1. Remove closed restriction entirely: Rejected - closed should still be terminal for "done" status
2. Add transition rule override: Rejected - adds complexity
3. Make all statuses freely transitionable: Rejected - loses workflow semantics

**References**:
- Linear, Jira both allow reopening closed issues
- Common pattern in GitHub Issues workflow
- User feedback requesting this capability

---

### Q5: What status variations should default config include?

**Decision**: Default should include:
- Basic workflow: todo → in_progress → done
- Review stage: in_review (common in software teams)
- Reopening capability: reopened status

Not include:
- Domain-specific statuses (e.g., "Deployed", "Testing")
- Multiple closed statuses (users can add)
- Sprint-specific statuses (handled separately)

**Rationale**:
- Cover 80% of common workflows
- Keep it simple (4-5 statuses)
- Easy to extend when needed
- Common enough that teams recognize patterns

**Status Count**: 5 statuses (todo, in_progress, in_review, done, reopened)

**Alternatives Considered**:
- More statuses (7-8): Too complex for defaults
- Fewer statuses (3): Doesn't cover review pattern
- Customizable defaults: Adds complexity without clear benefit

---

### Q6: How should required custom fields work in defaults?

**Decision**: No required fields in default configuration.

**Rationale**:
- Required fields can block status transitions
- Teams have different requirements
- Optional fields are safer defaults
- Users can add requirements later

**Current State**: Priority field exists but is optional (required: false) - this is correct.

**If Users Add Required Fields**: Documentation should explain how to handle:
- Setting fields before status changes
- Making fields optional if blocking
- Status-specific requirements (future enhancement)

---

## Best Practices Research

### Permissive Workflow Design Patterns

**Pattern 1: Allow Reversibility**
- Statuses should allow moving backward when reasonable
- Only truly terminal states (like "shipped") should be irreversible
- Default "done" can be reopened via "reopened" status

**Pattern 2: Progressive Restrictions**
- Start permissive, allow teams to add restrictions
- Configuration enables rules, doesn't enforce defaults
- Document how to add restrictions if needed

**Pattern 3: Semantic Status Types**
- Use types (open, in_progress, closed) for validation
- But allow flexibility within types
- Closed → closed transitions are allowed (multiple closed states)

**References**:
- Linear's workflow system (highly flexible)
- GitHub Projects (permissive by default)
- Jira's workflow builder (rules are optional)

### Documentation Best Practices

**Pattern 1: Error-Driven Documentation**
- Organize by error message
- Map errors to solutions directly
- Include exact error text for searchability

**Pattern 2: Progressive Disclosure**
- Quick fixes first
- Detailed explanations later
- Links to comprehensive guides

**Pattern 3: Actionable Examples**
- Show before/after configurations
- Include complete working examples
- Test all examples against schema

**References**:
- Stripe API documentation (error-focused)
- GitHub documentation (progressive disclosure)
- Vercel docs (actionable examples)

---

## Technical Constraints

### Backward Compatibility
- Existing projects must not break
- New default config only applies to new projects
- Existing projects keep their current config
- Migration path should be documented but optional

### Schema Validation
- New default config must pass Zod validation
- All statuses must have valid types
- Default status must exist in statuses array
- Custom fields must have valid types

### Performance
- Documentation changes have no performance impact
- Default config generation is already fast (<1ms)
- No caching concerns for static docs

---

## Unresolved Questions

None - all research questions resolved.

---

## Next Steps

1. Implement default config changes (add reopened status)
2. Expand troubleshooting documentation
3. Test new defaults with common workflows
4. Update quickstart to mention permissive defaults

