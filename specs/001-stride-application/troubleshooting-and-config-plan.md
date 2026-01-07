# Implementation Plan: Troubleshooting Documentation & Permissive Default Configuration

**Feature Branch**: `001-stride-application`  
**Created**: 2024-12-19  
**Status**: Planning  
**Feature Spec**: `specs/001-stride-application/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ (App Router)
- **Documentation**: Markdown in `apps/web/content/docs/`
- **Configuration**: YAML config system (`packages/yaml-config`)
- **Validation**: Zod schemas for runtime validation
- **UI**: React components with TypeScript

### Dependencies
- Existing documentation structure in `apps/web/content/docs/`
- Configuration generation in `packages/yaml-config/src/default-config.ts`
- Troubleshooting guide at `apps/web/content/docs/configuration-troubleshooting.md`
- Board status validation in `packages/ui/src/organisms/KanbanBoard.tsx`

### Integrations
- Configuration editor in `apps/web/app/projects/[projectId]/settings/config/page.tsx`
- Project creation API in `apps/web/app/api/projects/route.ts`
- Repository linking that syncs config in `apps/web/src/lib/integrations/config-sync.ts`

### Architecture Decisions
- Documentation follows existing structure in `content/docs/`
- Default config must be maximally permissive to avoid blocking new users
- Troubleshooting should be comprehensive with common board/status issues
- Configuration should allow all valid transitions by default

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied (single responsibility for doc sections)
- [x] DRY, YAGNI, KISS followed (document actual problems, not theoretical)
- [x] Type safety enforced (config generation uses typed schemas)
- [x] Security best practices (no security impact)
- [x] Accessibility requirements met (docs are readable)

### Code Quality Gates
- [x] No `any` types (config uses ProjectConfig type)
- [x] Proper error handling (validation errors are user-friendly)
- [x] Input validation (config validated with Zod)
- [ ] Test coverage planned (documentation changes, default config tests)

## Phase 0: Outline & Research

### Research Tasks
- [x] Review existing troubleshooting documentation
- [x] Analyze common board status configuration errors
- [x] Review default configuration generation
- [x] Identify transition rules that are too restrictive
- [x] Research best practices for permissive workflows

### Research Findings

#### Current Issues with Default Configuration
1. **Restrictive Transition Rules**: Current default only allows:
   - `open` → `in_progress` or `closed`
   - `in_progress` → `in_progress` or `closed`
   - `closed` → cannot transition back
   
   This means users can't reopen issues, which is common in real workflows.

2. **Missing Common Status Variations**: Default only has 4 statuses, but users might have issues with:
   - Different status names (e.g., "backlog", "open", "testing", "deployed")
   - Statuses from imported data
   - Statuses from Git repository configs

3. **Required Fields**: Default config has a priority field that's optional, but if users later make it required, it blocks transitions.

#### Common Troubleshooting Issues
From user feedback and error analysis:
1. **"Status not defined in workflow"** - Most common error
2. **"Cannot transition from closed"** - Users want to reopen issues
3. **"Required field missing"** - Blocking status changes
4. **Case sensitivity issues** - Status keys must match exactly
5. **Configuration not updating** - Caching or permission issues

### Research Output
- [x] Understanding of permissive workflow patterns
- [x] Common error scenarios identified
- [x] Default config improvement strategy defined

## Phase 1: Design & Contracts

### Data Model
No schema changes required. This is about:
- Documentation content updates
- Default configuration generation logic
- Validation rule documentation

### API Contracts
No API changes. This affects:
- Default config generation (internal function)
- Documentation pages (static content)

### Quickstart
- [x] Quickstart already exists
- [ ] Update quickstart to mention permissive defaults

### Agent Context
- [x] No new technologies introduced
- [ ] Update documentation patterns if needed

## Phase 2: Implementation Planning

### Documentation Enhancements

#### 1. Expand Troubleshooting Guide
**Location**: `apps/web/content/docs/configuration-troubleshooting.md`

**New Sections Needed**:
- Board-specific troubleshooting
- Status transition errors with solutions
- Configuration migration issues
- Import/onboarding problems

**Structure**:
```
## Board Status Issues
- Cannot move issues between columns
- Status not found errors
- Transition validation failures

## Configuration Issues
- Default config not working
- Status mismatch errors
- Required field blocking
```

#### 2. Create Board Status Configuration Guide
**Location**: `docs/board-status-configuration-guide.md` (already created)

**Enhancements**:
- Add to main documentation index
- Link from troubleshooting guide
- Add quick reference section

### Default Configuration Improvements

#### 1. Make Default Config More Permissive
**Location**: `packages/yaml-config/src/default-config.ts`

**Changes**:
- Add "reopened" status to allow closed → in_progress transitions
- Ensure all transition types are allowed where reasonable
- Remove required fields from default (make priority optional)
- Add more common status variations

**New Default Structure**:
```yaml
workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
    - key: in_review
      name: In Review
      type: in_progress
    - key: done
      name: Done
      type: closed
    - key: reopened  # NEW: Allows reopening closed issues
      name: Reopened
      type: in_progress
```

**Rationale**:
- Allows closed issues to be reopened (common need)
- Maintains backward compatibility (existing statuses kept)
- No required fields by default (prevents blocking)
- Covers common workflow patterns

### Component Structure
No new components. Updates to:
- Documentation pages (markdown content)
- Default config generator (function logic)

### State Management
N/A - No state changes

### Testing Strategy
- [ ] Unit tests for default config generation
- [ ] Integration tests for default config validation
- [ ] Manual testing of board with new default config
- [ ] Documentation link validation

## Phase 3: Implementation Tasks

### Documentation Tasks

#### Task D001: Expand Troubleshooting Guide
- [ ] Add "Board Status Issues" section to `apps/web/content/docs/configuration-troubleshooting.md`
- [ ] Add specific error messages and solutions for board operations
- [ ] Add section on "Configuration Migration" for existing projects
- [ ] Add "Quick Fixes" section with common solutions
- [ ] Link to board status configuration guide

#### Task D002: Integrate Board Status Guide
- [ ] Add board status guide to documentation navigation
- [ ] Link from troubleshooting guide
- [ ] Cross-reference between docs
- [ ] Add to quickstart mentions

#### Task D003: Add Common Issues Section
- [ ] Document "Status not found" error patterns
- [ ] Document "Cannot transition" error patterns
- [ ] Document "Required field" blocking issues
- [ ] Add diagnostic steps for each issue type

### Configuration Tasks

#### Task C001: Update Default Config Generator
- [ ] Add "reopened" status to default config in `packages/yaml-config/src/default-config.ts`
- [ ] Ensure priority field is optional (already is, verify)
- [ ] Add comments explaining permissive design
- [ ] Update function documentation

#### Task C002: Test Default Config Permissiveness
- [ ] Verify all transition types work with new defaults
- [ ] Test reopening closed issues
- [ ] Test status changes without required fields
- [ ] Verify backward compatibility with existing projects

#### Task C003: Update Config Validation Messages
- [ ] Ensure error messages explain permissive defaults
- [ ] Add helpful hints about adding statuses
- [ ] Update validation to suggest missing statuses

### Testing Tasks

#### Task T001: Test New Default Config
- [ ] Create new project with default config
- [ ] Verify all status transitions work
- [ ] Test reopening closed issues
- [ ] Verify no required fields block transitions

#### Task T002: Test Documentation Links
- [ ] Verify all documentation links work
- [ ] Test troubleshooting guide navigation
- [ ] Verify cross-references are correct

## Implementation Notes

### Permissive Configuration Principles
1. **Maximize Flexibility**: Default config should allow as many valid operations as possible
2. **Minimize Blocking**: No required fields, no restrictive transitions unless necessary
3. **Common Patterns**: Support common workflow patterns out of the box
4. **Backward Compatible**: Changes should not break existing projects

### Documentation Principles
1. **Actionable Solutions**: Each problem should have a clear fix
2. **Error Message Mapping**: Link errors to specific solutions
3. **Progressive Disclosure**: Start with quick fixes, expand to detailed explanations
4. **Real Examples**: Use actual error messages and configurations

### Migration Strategy
- New projects get updated default config automatically
- Existing projects keep their config (no breaking changes)
- Users can opt-in to new defaults by updating their config
- Documentation explains how to migrate

## Success Criteria

- [ ] New users can move issues between all default status columns without errors
- [ ] Users can reopen closed issues with default configuration
- [ ] Troubleshooting guide covers all common board/status errors
- [ ] Default config is documented as "permissive by design"
- [ ] All documentation links work correctly
- [ ] No breaking changes to existing projects

