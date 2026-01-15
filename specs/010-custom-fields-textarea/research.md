# Research: Custom Fields Textarea Support

**Feature**: 010-custom-fields-textarea  
**Date**: 2026-01-27

## Research Questions

### 1. Existing Custom Field Implementation Review

**Question**: How are current custom field types validated and rendered?

**Findings**:
- Custom field types are defined in `packages/yaml-config/src/schema.ts` using Zod enum: `['text', 'number', 'dropdown', 'date', 'boolean']`
- Form rendering happens in `packages/ui/src/organisms/IssueForm.tsx` via `renderCustomFieldInput()` function
- Each field type has a switch case that returns appropriate React component
- Form validation schema is generated dynamically in `createFormSchema()` based on project config
- Custom field values are stored in `Issue.customFields` JSONB field (no schema changes needed)

**Decision**: Extend the existing pattern by:
1. Adding `'textarea'` to the `CustomFieldTypeSchema` enum
2. Adding a `case 'textarea':` in `renderCustomFieldInput()` switch statement
3. Using existing `MarkdownEditor` component for consistency

**Rationale**: Follows established patterns, minimal code changes, maintains consistency with existing field types.

**Alternatives Considered**:
- Creating new component: Rejected - MarkdownEditor already exists and is used for issue descriptions
- Separate plain textarea type: Rejected - spec clarified to only support markdown textarea

### 2. Markdown Rendering Security

**Question**: How is markdown sanitized and rendered securely?

**Findings**:
- `MarkdownRenderer` component (`packages/ui/src/molecules/MarkdownRenderer.tsx`) uses `react-markdown` library
- Component includes HTML sanitization for security
- Already used for issue descriptions throughout the application
- No XSS vulnerabilities reported in existing usage

**Decision**: Reuse `MarkdownRenderer` component for displaying textarea field values in issue view.

**Rationale**: 
- Proven security model already in production
- Consistent user experience with issue descriptions
- No additional security review needed

**Alternatives Considered**:
- Custom markdown renderer: Rejected - unnecessary duplication, security risk
- Plain text rendering: Rejected - doesn't meet spec requirements for markdown support

### 3. Form Validation Patterns

**Question**: How is custom field validation integrated with React Hook Form?

**Findings**:
- `createFormSchema()` function in `IssueForm.tsx` dynamically builds Zod schema based on project config
- Each custom field type maps to appropriate Zod validator:
  - `text` → `z.string()`
  - `number` → `z.number()`
  - `boolean` → `z.boolean()`
  - `date` → `z.string().or(z.date())`
  - `dropdown` → `z.enum(field.options)`
- Required fields use `.optional()` or required schema based on `field.required` flag
- Validation errors are displayed inline with form fields

**Decision**: Add textarea to validation schema as `z.string()` (same as text field).

**Rationale**: 
- Textarea stores markdown as string, same validation rules as text field
- Required field validation already handled by existing logic
- No special validation needed for markdown syntax (users can enter any text)

**Alternatives Considered**:
- Markdown syntax validation: Rejected - too restrictive, users should be able to enter any text
- Character limits: Rejected - out of scope per spec

### 4. Display Rendering Location

**Question**: Where are custom field values displayed in issue view?

**Findings**:
- `IssueDetail` component (`packages/ui/src/organisms/IssueDetail.tsx`) displays custom fields
- Custom fields are rendered in a section showing field name and value
- Current implementation shows values as plain text or formatted based on type
- Issue descriptions use `MarkdownRenderer` for markdown content

**Decision**: Update `IssueDetail` to detect textarea fields and render with `MarkdownRenderer`.

**Rationale**:
- Consistent with how issue descriptions are displayed
- Proper markdown formatting for rich content
- Minimal changes to existing display logic

**Alternatives Considered**:
- Always render as markdown: Rejected - other field types should remain as-is
- New display component: Rejected - unnecessary, MarkdownRenderer sufficient

## Technical Decisions Summary

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| Extend enum pattern | Follows existing architecture | Create new system |
| Reuse MarkdownEditor | Consistency, proven component | Build new editor |
| Reuse MarkdownRenderer | Security, consistency | Custom renderer |
| String validation | Same as text field | Markdown syntax validation |
| Conditional rendering | Type-specific display logic | Always render markdown |

## Implementation Approach

1. **Schema Extension**: Add `'textarea'` to `CustomFieldTypeSchema` enum (1 line change)
2. **Type Updates**: TypeScript types automatically inferred from Zod schema
3. **Form Rendering**: Add switch case using `MarkdownEditor` component (~10 lines)
4. **Display Rendering**: Add conditional rendering in `IssueDetail` using `MarkdownRenderer` (~5 lines)
5. **Documentation**: Update reference docs with textarea examples (~20 lines)

**Total Estimated Changes**: ~40 lines of code across 4 files, plus documentation updates.

## Open Questions

None - all research questions resolved. Implementation is straightforward extension of existing patterns.
