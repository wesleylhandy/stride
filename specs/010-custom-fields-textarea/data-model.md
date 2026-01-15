# Data Model: Custom Fields Textarea Support

**Feature**: 010-custom-fields-textarea  
**Date**: 2026-01-27

## Overview

This feature extends the existing custom fields system to support a `textarea` field type with markdown editing and rendering. No database schema changes are required as custom field values are stored in the existing JSONB `customFields` column.

## Entities

### CustomFieldConfig

**Location**: `packages/yaml-config/src/schema.ts`, `packages/types/src/project.ts`

**Description**: Configuration entity that defines custom field properties for a project.

**Current Structure**:
```typescript
interface CustomFieldConfig {
  key: string;           // Unique identifier (e.g., "notes", "description")
  name: string;          // Human-readable name (e.g., "Notes", "Description")
  type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  options?: string[];    // Required for dropdown type
  required: boolean;     // Whether field must be set
}
```

**Extended Structure**:
```typescript
interface CustomFieldConfig {
  key: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean' | 'textarea';  // Added 'textarea'
  options?: string[];    // Not used for textarea
  required: boolean;
}
```

**Validation Rules**:
- `key`: Must be unique within project, min 1 character
- `name`: Min 1 character
- `type`: Must be one of the enum values (including 'textarea')
- `options`: Optional, only used for 'dropdown' type
- `required`: Boolean, defaults to false

**Changes Required**:
- Update `CustomFieldTypeSchema` enum in `packages/yaml-config/src/schema.ts`:
  ```typescript
  const CustomFieldTypeSchema = z.enum(['text', 'number', 'dropdown', 'date', 'boolean', 'textarea']);
  ```
- TypeScript types automatically inferred from Zod schema (no manual type update needed)

### Issue.customFields

**Location**: `packages/database/prisma/schema.prisma`

**Description**: JSONB field that stores custom field values for an issue.

**Current Structure**:
```prisma
model Issue {
  // ... other fields
  customFields Json @default("{}")
  // ... other fields
}
```

**Data Format**:
```json
{
  "priority": "High",
  "estimate": 5,
  "notes": "# Meeting Notes\n\n- Discussed requirements\n- Agreed on timeline",
  "textarea_field": "## Description\n\nThis is **markdown** content with *formatting*."
}
```

**Storage for Textarea Fields**:
- Textarea field values stored as plain strings containing raw markdown
- Example: `"textarea_field": "## Title\n\n**Bold** text here"`
- No special encoding or processing - stored exactly as user enters

**Changes Required**:
- **None** - JSONB field already supports string values
- No database migration needed

## Relationships

### CustomFieldConfig → Issue.customFields

**Relationship**: One-to-many (one config defines structure, many issues store values)

**Mapping**:
- Config `key` maps to JSONB property name in `Issue.customFields`
- Config `type` determines how value is validated and rendered
- Config `required` determines validation rules

**Example**:
```yaml
# YAML Config
custom_fields:
  - key: meeting_notes
    name: Meeting Notes
    type: textarea
    required: false
```

```json
// Issue.customFields (database)
{
  "meeting_notes": "## Meeting Summary\n\n- Discussed feature\n- Next steps"
}
```

## State Transitions

### Custom Field Value Lifecycle

1. **Configuration**: Admin defines textarea field in YAML config
2. **Form Display**: Field appears in issue creation/edit forms with MarkdownEditor
3. **User Input**: User enters markdown text
4. **Validation**: String validation (required if field.required is true)
5. **Storage**: Raw markdown string saved to `Issue.customFields[key]`
6. **Display**: Markdown rendered as HTML in issue view using MarkdownRenderer

### No State Machine

Custom field values are simple data (strings), not stateful entities. No state transitions to model.

## Validation Rules

### Schema Validation (YAML Config)

- `type: 'textarea'` must be valid enum value
- `key` must be unique within project's custom_fields array
- `name` must be non-empty string
- `options` not used for textarea (ignored if present)
- `required` boolean, defaults to false

### Form Validation (Runtime)

- Value must be string type
- If `required: true`, value cannot be empty string
- No markdown syntax validation (users can enter any text)
- No character limits (per spec - out of scope)

### Database Constraints

- None - JSONB field accepts any valid JSON
- Application-level validation ensures correct structure

## Data Volume Assumptions

- Typical textarea content: 100-2000 characters
- Maximum reasonable content: 10,000+ characters (no hard limit)
- No performance concerns for JSONB storage at expected volumes
- Markdown rendering performance: <50ms for typical content (per plan goals)

## Migration Considerations

### Existing Data

- No migration needed - new field type, no existing data to convert
- Existing custom field values unaffected
- Backward compatible - projects without textarea fields work as before

### Future Considerations

- If plain textarea (without markdown) is added later, would need migration strategy
- Current design stores markdown as string, could be extended if needed

## Indexing

- No new indexes needed
- Existing GIN index on `customFields` JSONB column supports queries
- Custom field lookups use JSONB operators (e.g., `customFields->>'field_key'`)

## Security Considerations

- Markdown content sanitized by MarkdownRenderer component (XSS protection)
- No SQL injection risk (Prisma parameterized queries)
- Input validation at form level (Zod schemas)
- No special permissions needed (follows existing custom field access patterns)
