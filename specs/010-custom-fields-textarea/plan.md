# Implementation Plan: Custom Fields Textarea Support

**Branch**: `010-custom-fields-textarea` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-custom-fields-textarea/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add support for `textarea` custom field type with markdown editing and rendering capabilities. This extends the existing custom fields system to support multi-line text input with markdown formatting, enabling richer content in issue custom fields. The implementation reuses existing MarkdownEditor and MarkdownRenderer components for consistency with issue description editing.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 16+  
**Primary Dependencies**: Zod (validation), Prisma (database), React Hook Form (forms), react-markdown (markdown rendering)  
**Storage**: PostgreSQL (via Prisma), JSONB field for custom field values  
**Testing**: Jest, React Testing Library, Playwright (E2E)  
**Target Platform**: Web application (Next.js App Router)  
**Project Type**: Monorepo (Turborepo with pnpm workspaces)  
**Performance Goals**: Form rendering <100ms, markdown rendering <50ms for typical content  
**Constraints**: Must maintain backward compatibility with existing custom field types, no database schema changes  
**Scale/Scope**: All projects can use textarea fields, no limits on number of textarea fields per project

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### SOLID Principles
- ✅ **Single Responsibility**: Each component has clear purpose (schema validation, form rendering, markdown display)
- ✅ **Open/Closed**: Extending CustomFieldTypeSchema enum without modifying existing field type logic
- ✅ **Liskov Substitution**: Textarea fields follow same interface as other custom field types
- ✅ **Interface Segregation**: CustomFieldConfig interface remains focused
- ✅ **Dependency Inversion**: Components depend on CustomFieldConfig abstraction, not concrete implementations

### Development Principles
- ✅ **DRY**: Reusing existing MarkdownEditor and MarkdownRenderer components
- ✅ **YAGNI**: Only implementing textarea with markdown (plain textarea out of scope)
- ✅ **KISS**: Simple enum extension and form rendering case addition
- ✅ **Composition**: Using existing UI components rather than creating new ones

### Code Quality Standards
- ✅ **TypeScript**: Strict mode, no `any` types, proper type inference from Zod schemas
- ✅ **Error Handling**: Validation errors handled in form schema, markdown rendering errors handled gracefully
- ✅ **Security**: Markdown sanitization via existing MarkdownRenderer component

### Testing
- ✅ **Test behavior**: Tests verify form rendering, markdown display, validation
- ✅ **Coverage**: Unit tests for schema validation, integration tests for form behavior

### Accessibility
- ✅ **WCAG 2.1 AA**: MarkdownEditor component already accessible, form labels and error messages properly associated

**GATE STATUS**: ✅ **PASS** - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/010-custom-fields-textarea/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── yaml-config/
│   └── src/
│       └── schema.ts                    # Update CustomFieldTypeSchema enum
├── types/
│   └── src/
│       └── project.ts                   # Update CustomFieldConfig type
└── ui/
    └── src/
        ├── molecules/
        │   ├── MarkdownEditor.tsx       # Already exists (reuse)
        │   └── MarkdownRenderer.tsx      # Already exists (reuse)
        └── organisms/
            └── IssueForm.tsx            # Add textarea case to renderCustomFieldInput

apps/web/
└── (no changes needed - uses packages)

docs/
└── configuration/
    └── reference.md                     # Update custom fields documentation
```

**Structure Decision**: Monorepo structure with shared packages. Changes are isolated to:
1. Schema validation package (`packages/yaml-config`)
2. Type definitions package (`packages/types`)
3. UI components package (`packages/ui`)
4. Documentation (`docs/configuration`)

## Complexity Tracking

> **No violations detected - all constitution principles satisfied**

## Phase 0: Research ✅ COMPLETE

### Research Tasks

1. **Review existing custom field implementation** ✅
   - Understand how current field types are validated and rendered
   - Identify extension points for new field type
   - Review MarkdownEditor and MarkdownRenderer component APIs

2. **Markdown rendering security considerations** ✅
   - Verify MarkdownRenderer sanitization approach
   - Confirm XSS protection measures
   - Review any existing markdown rendering in custom fields context

3. **Form validation patterns** ✅
   - Review how custom field validation is integrated with React Hook Form
   - Understand required field validation flow
   - Identify any edge cases in validation schema generation

**Research Output**: See `research.md` ✅ Generated

## Phase 1: Design & Contracts ✅ COMPLETE

### Data Model ✅

**Entities**:
- `CustomFieldConfig`: Extended to include `textarea` in type enum
- `Issue.customFields`: JSONB field (no schema changes needed)

**Changes**:
- Add `'textarea'` to `CustomFieldTypeSchema` enum in `packages/yaml-config/src/schema.ts`
- Update `CustomFieldConfig` TypeScript type to include `textarea` option
- No database schema changes (customFields is JSONB)

**Validation Rules**:
- Textarea fields follow same validation as text fields (string type, optional/required)
- Required field validation enforced at form level and status transition level

**Output**: See `data-model.md` ✅ Generated

### API Contracts ✅

**No new API endpoints required**. Existing endpoints handle custom fields generically:
- `POST /api/projects/[projectId]/issues` - Creates issue with customFields
- `PATCH /api/projects/[projectId]/issues/[issueId]` - Updates issue including customFields
- `GET /api/projects/[projectId]/issues/[issueId]` - Returns issue with customFields

**Data Format**:
- YAML config: `type: textarea` in custom_fields array
- API request/response: `customFields: { "fieldKey": "markdown content here" }` (string value)
- Database: Stored as JSONB string value

**Output**: See `contracts/api.yaml` ✅ Generated

### Quickstart ✅

**Output**: See `quickstart.md` ✅ Generated
- YAML configuration example
- Form usage example
- Markdown rendering example

## Phase 2: Implementation Phases

### Phase 1: Schema & Type Updates
1. Update `CustomFieldTypeSchema` enum to include `'textarea'`
2. Update TypeScript types in `packages/types`
3. Add validation tests for textarea type

### Phase 2: Form Rendering
1. Add `textarea` case to `renderCustomFieldInput` in `IssueForm.tsx`
2. Use `MarkdownEditor` component for textarea fields
3. Update form schema generation to handle textarea as string type
4. Add form rendering tests

### Phase 3: Display Rendering
1. Update `IssueDetail` component to render textarea fields with `MarkdownRenderer`
2. Ensure proper markdown rendering in issue view
3. Add display rendering tests

### Phase 4: Documentation
1. Update `docs/configuration/reference.md` with textarea field type documentation
2. Add YAML examples showing textarea usage
3. Document markdown support and rendering behavior

### Phase 5: Integration & Testing
1. End-to-end tests for textarea field creation and editing
2. Test markdown rendering in issue view
3. Test required field validation
4. Regression tests for existing field types

## Dependencies

### Internal Dependencies
- `packages/yaml-config`: Schema validation
- `packages/types`: TypeScript type definitions
- `packages/ui`: MarkdownEditor, MarkdownRenderer, IssueForm components
- `docs/configuration/reference.md`: Configuration documentation

### External Dependencies
- Zod: Schema validation (already in use)
- react-markdown: Markdown rendering (already in use via MarkdownRenderer)
- React Hook Form: Form management (already in use)

## Risk Assessment

### Low Risk
- ✅ Simple enum extension
- ✅ Reusing existing components
- ✅ No database schema changes
- ✅ Backward compatible

### Mitigation
- Comprehensive tests for existing field types to prevent regression
- TypeScript strict mode ensures type safety
- Existing markdown rendering already tested and secure

## Success Metrics

- All functional requirements (FR-001 through FR-009) implemented
- All success criteria (SC-001 through SC-006) met
- Zero regression in existing custom field functionality
- Documentation complete with working examples
