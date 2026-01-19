# CHANGELOG Plan Enhancement: Spec Tracking & Prioritization

**Created**: 2026-01-27  
**Purpose**: Propose surgical enhancements to `plan.md` for tracking spec completion, prioritization, and git history reconstruction  
**Status**: Proposal - Awaiting Review

## Overview

The current `plan.md` needs enhancements to:
1. **Track spec completion status** - Identify which specs are done vs incomplete
2. **Prioritize features** - Enable contributors to see what to tackle first
3. **Reconstruct changelog from git history** - Backfill entries for already-completed specs
4. **Versioning strategy** - Establish versioning approach with git tags

This document proposes surgical updates to `plan.md` using spec-kit methodologies.

## Current State Analysis

### Specs Inventory
- **Total Specs**: 14 (001-014)
- **Status**: All marked "Draft" in spec.md files
- **Completion Indicator**: Tasks.md completion percentage + git history analysis

### Git History Analysis
- **Current Version**: 0.1.0 (package.json)
- **Git Tags**: None exist yet
- **Recent Merges**: Multiple PRs merged (e.g., #9, #8, #7, #6, #5)
- **Pattern**: Commits reference spec numbers (e.g., "006 ai assistant configuration")

### Spec-Kit Integration Points
- Tasks.md files track completion via checkboxes `[x]` / `[ ]`
- Checklists track requirements quality
- Status should be derived from: tasks.md completion + git history + spec.md status

## Proposed Enhancements

### 1. Add "Spec Completion Tracking" Section to plan.md

**Location**: After "Technical Context" section, before "Phase 0"

**Content**:
```markdown
## Spec Completion Tracking

### Methodology

Track spec completion status using multi-source analysis:

1. **Tasks.md Completion**: Count completed tasks vs total tasks
2. **Git History Analysis**: Parse commits for spec numbers and merge indicators
3. **Spec Status Field**: Read spec.md "Status" field (Draft/In Progress/Complete)
4. **Checklist Completion**: Verify requirements checklists are complete

### Spec Status Definition

- **Complete**: All tasks done OR merged PR exists with spec number
- **In Progress**: Tasks started (some completed) OR active PR exists
- **Draft**: No tasks completed, no git activity
- **Blocked**: Dependencies unmet or waiting on other specs

### Initial Spec Audit

Run `/speckit.tasks --audit-all-specs` to generate initial status report.

**Output Format**:
```markdown
## Spec Completion Status (Last Updated: YYYY-MM-DD)

| Spec | Name | Status | Tasks | Completion | Priority | Notes |
|------|------|--------|-------|------------|----------|-------|
| 001 | Stride Core Application | Complete | 427/427 | 100% | P1 | Fully implemented |
| 003 | README Documentation | Complete | 131/131 | 100% | P1 | Merged in PR #5 |
| 006 | AI Assistant Config | Complete | 85/85 | 100% | P1 | Merged in PR #7 |
| 007 | Changelog | In Progress | 0/27 | 0% | P1 | This spec |
| 013 | CSRF Enhancements | Draft | 0/45 | 0% | P1 | Security critical |
```

### Tracking File Structure

Create `specs/SPEC_STATUS.md` (managed by spec-kit commands):
- Auto-generated from tasks.md analysis
- Updated when `/speckit.tasks` runs
- Used by changelog reconstruction

```

### 2. Add "Feature Prioritization Framework" Section

**Location**: After "Spec Completion Tracking" section

**Content**:
```markdown
## Feature Prioritization Framework

### Priority Tiers

**P1 - Critical Path**
- Foundation features (001, 003, 007)
- Security features (013)
- User-facing core features (001-002)

**P2 - High Value**
- Enhancements to P1 features (006, 011, 012)
- Developer experience (004, 005)
- Quality of life features (014)

**P3 - Nice to Have**
- Advanced features
- Edge case improvements
- Future enhancements

### Contributor Guidance

When choosing what to work on:

1. **Start with P1 Draft specs** - Foundation must be solid
2. **Check dependencies** - Ensure blocking specs are complete
3. **Review task completion** - Prefer specs with some progress
4. **Security first** - P1 security specs (013) are highest priority

### Dependency Graph

```
001 (Core) → All other specs
003 (Docs) → 007 (Changelog)
013 (CSRF) → Blocks new endpoints
```

Visualization: Generate with `/speckit.analyze --dependencies`

```

### 3. Add "Versioning & Release Strategy" Section

**Location**: After "Version Management" subsection in "Phase 1"

**Content**:
```markdown
### Versioning & Release Strategy

#### Initial Versioning Plan

**Version 0.1.0** (Current State - 2026-01-27)
- Represents current development state
- All completed specs up to this date
- Baseline for future releases

**Versioning Approach**:
- **MAJOR** (1.0.0): Production-ready release with all P1 specs complete
- **MINOR** (0.2.0): Significant feature additions or multiple spec completions
- **PATCH** (0.1.1): Bug fixes, documentation, or single spec improvements

#### Git Tag Strategy

**Tag Format**: `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v0.1.0`)

**Tag Creation Rules**:
1. Create tag when CHANGELOG version section is created
2. Tag name matches CHANGELOG version (with `v` prefix)
3. Tag message: `Release v{version}: {summary}`
4. Tags enable version comparison links in CHANGELOG

**Initial Tag Creation**:
```bash
# After creating CHANGELOG.md with [0.1.0] entry
git tag -a v0.1.0 -m "Release v0.1.0: Initial changelog baseline"
git push origin v0.1.0
```

#### Release Frequency

- **Ad-hoc**: Create versions when notable features complete
- **Milestone-based**: Version at major feature milestones
- **Time-based** (future): Regular releases (e.g., monthly) once stable

```

### 4. Add "Git History Reconstruction" Section

**Location**: New subsection under "Phase 2: Implementation Planning"

**Content**:
```markdown
### Git History Reconstruction

#### Methodology

Reconstruct changelog entries for already-completed specs using git history analysis.

**Reconstruction Steps**:

1. **Identify Completed Specs**:
   ```bash
   # Parse git log for spec numbers
   git log --all --grep="spec\|#00[0-9]" --oneline > /tmp/spec-commits.txt
   
   # Analyze tasks.md files for completion
   find specs/ -name "tasks.md" -exec grep -l "^\- \[x\]" {} \;
   ```

2. **Map Commits to Specs**:
   - Look for patterns: "spec 001", "006 ai", "#007", etc.
   - Identify merge commits (PR numbers)
   - Group related commits by spec number

3. **Extract Change Information**:
   - Parse commit messages for change types (Added/Changed/Fixed)
   - Identify breaking changes from commit messages
   - Extract issue/PR numbers for links

4. **Generate Changelog Entries**:
   - Create entries for each completed spec
   - Group by change type (Added, Changed, Fixed)
   - Include PR/issue links where available

#### Reconstruction Script

Create `scripts/changelog-reconstruct.sh`:
- Analyzes git history
- Maps commits to specs
- Generates draft CHANGELOG entries
- Outputs to `CHANGELOG_RECONSTRUCTED.md` for review

**Usage**:
```bash
./scripts/changelog-reconstruct.sh > CHANGELOG_RECONSTRUCTED.md
# Review and merge into CHANGELOG.md
```

#### Spec-to-Changelog Mapping

**Spec 001 - Stride Core Application**:
- Added: Issue management, Kanban board, sprint management, AI triage
- Added: Configuration as code (stride.config.yaml)
- Added: Git integration (GitHub/GitLab webhooks)
- Added: Monitoring webhook integration
- Added: Root cause diagnostics
- Added: Keyboard-driven command palette UX
- Added: Mermaid diagram rendering
- Added: Contextual link previews

**Spec 003 - README Documentation**:
- Added: Comprehensive README.md
- Added: CONTRIBUTING.md with spec-kit workflow
- Added: CODE_OF_CONDUCT.md
- Changed: Documentation structure and navigation

**Spec 006 - AI Assistant Configuration**:
- Added: AI provider management UI
- Added: Model selection and configuration
- Added: Per-project AI provider settings
- Changed: AI triage to use configured providers

**Additional Specs** (to be completed during reconstruction):
- Map remaining completed specs
- Extract from git history
- Organize by change type

```

### 5. Update "Phase 2: Implementation Planning" Section

**Location**: Enhance existing Phase 2 section

**Add new subsection**:
```markdown
### Spec Status & Prioritization Tasks

- [ ] Create `specs/SPEC_STATUS.md` tracking file
- [ ] Run initial spec audit to identify completed specs
- [ ] Generate prioritization matrix (P1/P2/P3)
- [ ] Document dependency graph between specs
- [ ] Update plan.md with spec tracking methodology
```

**Enhance "CHANGELOG Creation Tasks"**:
```markdown
### CHANGELOG Creation Tasks

- [ ] Reconstruct historical entries from git history (T050)
- [ ] Create CHANGELOG.md file in repository root
- [ ] Add header with format description and links to standards
- [ ] Add "Unreleased" section for tracking upcoming changes
- [ ] Add initial version entry [0.1.0] with current date
- [ ] Document completed specs (001, 003, 006, etc.) from reconstruction
- [ ] Organize historical entries by change type (Added, Changed, Fixed)
- [ ] Add version comparison links (when git tags exist)
- [ ] Create initial git tag `v0.1.0` for baseline
```

## Implementation Steps (Using Spec-Kit)

### Step 1: Update plan.md with New Sections

**Command**: Manual edit (surgical precision)

**Actions**:
1. Add "Spec Completion Tracking" section after "Technical Context"
2. Add "Feature Prioritization Framework" section
3. Enhance "Version Management" with "Versioning & Release Strategy"
4. Add "Git History Reconstruction" subsection to Phase 2
5. Update Phase 2 tasks with new tracking tasks

**Files to Modify**:
- `specs/007-changelog/plan.md`

### Step 2: Create Spec Status Tracking File

**Command**: `/speckit.checklist --spec-status-tracking`

**Actions**:
1. Create `specs/SPEC_STATUS.md` structure
2. Run initial audit of all specs
3. Populate with current completion status
4. Document prioritization framework

**Output**: `specs/SPEC_STATUS.md`

### Step 3: Create Git History Reconstruction Script

**Command**: Manual creation (outside spec-kit)

**Actions**:
1. Create `scripts/changelog-reconstruct.sh`
2. Parse git log for spec references
3. Map commits to specs
4. Generate draft changelog entries

**Output**: `scripts/changelog-reconstruct.sh`, `CHANGELOG_RECONSTRUCTED.md`

### Step 4: Update tasks.md with New Tasks

**Command**: `/speckit.tasks` (re-run after plan.md updates)

**Actions**:
1. Tasks.md will auto-update with new plan.md sections
2. Add reconstruction tasks (T050-T060)
3. Add spec tracking tasks
4. Add prioritization tasks

**Output**: Updated `specs/007-changelog/tasks.md`

### Step 5: Run Reconstruction & Create CHANGELOG.md

**Command**: Manual execution

**Actions**:
1. Run `scripts/changelog-reconstruct.sh`
2. Review `CHANGELOG_RECONSTRUCTED.md`
3. Merge into `CHANGELOG.md` following Keep a Changelog format
4. Create initial git tag `v0.1.0`

**Output**: `CHANGELOG.md`, git tag `v0.1.0`

## File Changes Summary

### Modified Files
1. `specs/007-changelog/plan.md` - Add 4 new sections/enhancements
2. `specs/007-changelog/tasks.md` - Add reconstruction tasks (auto-update)

### New Files
1. `specs/SPEC_STATUS.md` - Spec completion tracking
2. `scripts/changelog-reconstruct.sh` - Git history analysis script
3. `CHANGELOG_RECONSTRUCTED.md` - Temporary reconstruction output
4. `CHANGELOG.md` - Final changelog file (repository root)

### Updated Files (After Execution)
1. `package.json` - Version may update (stay at 0.1.0 for now)
2. `CONTRIBUTING.md` - Already references changelog

## Success Criteria

- [ ] plan.md contains spec tracking methodology
- [ ] plan.md contains prioritization framework
- [ ] plan.md contains versioning strategy
- [ ] plan.md contains git reconstruction methodology
- [ ] SPEC_STATUS.md exists and is populated
- [ ] Reconstruction script exists and works
- [ ] CHANGELOG.md created with historical entries
- [ ] Git tag v0.1.0 created
- [ ] Contributors can see what to work on next

## Next Steps

1. **Review this proposal** - Validate approach
2. **Execute Step 1** - Update plan.md surgically
3. **Execute Step 2** - Create SPEC_STATUS.md
4. **Execute Step 3** - Create reconstruction script
5. **Execute Step 4** - Update tasks.md
6. **Execute Step 5** - Run reconstruction and create CHANGELOG.md

## Notes

- All changes are surgical and focused on plan.md enhancements
- No existing plan.md content is removed, only additions
- Spec-kit commands are used where appropriate
- Manual steps are clearly identified
- Reconstruction is semi-automated (requires review)
