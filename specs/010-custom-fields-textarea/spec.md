# Feature Specification: Custom Fields Textarea Support

**Feature Branch**: `010-custom-fields-textarea`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "For project yaml config, for custom fields, we should allow support for textarea, and textarea with markdown. We need to update documentation and form generation to allow this"

## Clarifications

### Session 2026-01-27

- Q: Should we support both plain textarea and textarea-markdown, or only textarea with markdown? → A: Only textarea with markdown support (simplified to single type)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Textarea Custom Field with Markdown Support (Priority: P1)

A project administrator wants to add a custom field that supports markdown formatting for longer text content (e.g., detailed notes, acceptance criteria, technical specifications, or formatted documentation) in project issue forms. They configure a textarea field in the project YAML configuration, which supports markdown editing and rendering.

**Why this priority**: This is the core functionality - enabling textarea fields with markdown support provides rich text formatting capabilities for custom fields, delivering significant value for documentation and detailed descriptions.

**Independent Test**: Can be fully tested by adding a textarea custom field to a project configuration YAML file, verifying it appears in issue forms with markdown editing capabilities, and confirming markdown content is rendered correctly when viewing issues.

**Acceptance Scenarios**:

1. **Given** a project configuration YAML file, **When** an administrator adds a custom field with `type: textarea`, **Then** the field appears in issue forms with markdown editing support (textarea with markdown formatting hints)
2. **Given** an issue form with a textarea custom field, **When** a user enters markdown-formatted text (e.g., **bold**, *italic*, `code`), **Then** the markdown is saved as raw markdown text
3. **Given** an issue with markdown content in a textarea custom field, **When** viewing the issue, **Then** the markdown content is rendered as formatted HTML (bold, italic, code blocks, etc.)
4. **Given** a textarea field with existing markdown content, **When** editing the issue, **Then** the raw markdown text is displayed in the editor for editing
5. **Given** a project with existing textarea custom fields, **When** the configuration is loaded, **Then** the textarea fields are validated and rendered correctly in forms

---

### Edge Cases

- What happens when a textarea field is marked as required but left empty?
- How does the system handle very long text content (e.g., 10,000+ characters) in textarea fields?
- How does the system handle invalid markdown syntax in textarea fields?
- What happens when migrating from existing text fields to textarea fields - are existing values preserved?
- How does the system handle special characters and line breaks in textarea content?
- What happens if a user pastes HTML content into a textarea field?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support `textarea` as a valid custom field type in project YAML configuration (with markdown support)
- **FR-002**: System MUST validate textarea field type in the YAML configuration schema
- **FR-003**: System MUST render textarea custom fields with markdown editing capabilities (textarea with markdown formatting support) in issue creation and editing forms
- **FR-004**: System MUST store textarea field values as raw markdown text strings in the database
- **FR-005**: System MUST render markdown content from textarea fields as formatted HTML when displaying issues
- **FR-006**: System MUST display raw markdown text in textarea fields when editing issues
- **FR-007**: System MUST enforce required field validation for textarea fields (block status transitions if required and empty)
- **FR-008**: System MUST update form validation schemas to accept string values for textarea fields
- **FR-009**: System MUST update documentation to describe textarea field type with examples

### Key Entities *(include if feature involves data)*

- **CustomFieldConfig**: Configuration entity that defines custom field properties (key, name, type, required). Extended to support `textarea` type (with markdown support) in addition to existing types (text, number, dropdown, date, boolean).
- **Issue.customFields**: JSONB field that stores custom field values. Textarea fields store raw markdown strings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can successfully configure textarea custom fields in project YAML configuration files without validation errors
- **SC-002**: Users can enter and save multi-line markdown-formatted text content (minimum 500 characters) in textarea custom fields without data loss
- **SC-003**: Users can enter markdown-formatted text in textarea fields and see it rendered correctly when viewing issues (supports bold, italic, code, lists, links)
- **SC-004**: Form validation correctly enforces required field rules for textarea fields (blocks status transitions when required fields are empty)
- **SC-005**: Documentation clearly describes textarea field type with working YAML examples that users can copy and use
- **SC-006**: Existing custom field functionality (text, number, dropdown, date, boolean) continues to work without regression after adding textarea support

## Assumptions

- Textarea fields will use the existing MarkdownEditor component from the UI package for consistency with issue description editing
- Markdown rendering will use the existing MarkdownRenderer component for consistency with issue description display
- No changes are needed to the database schema (customFields JSONB field already supports string values)
- Textarea fields follow the same validation rules as existing text fields (required flag, key uniqueness, etc.)
- Line breaks and whitespace in textarea content are preserved when saving and displaying
- Markdown content in textarea fields is sanitized during rendering for security (using existing MarkdownRenderer sanitization)

## Out of Scope

- Plain textarea fields without markdown support
- Rich text WYSIWYG editors (beyond markdown textarea)
- Syntax highlighting in textarea fields
- Character count limits or validation beyond required field checks
- Auto-save functionality for textarea fields
- Preview mode for markdown while editing (edit-only, preview on view)
- Custom markdown extensions beyond what MarkdownRenderer supports
- Migration tools for converting existing text fields to textarea fields

## Dependencies

- Existing custom fields infrastructure (YAML config schema, form generation, validation)
- MarkdownEditor component (`packages/ui/src/molecules/MarkdownEditor.tsx`)
- MarkdownRenderer component (`packages/ui/src/molecules/MarkdownRenderer.tsx`)
- IssueForm component (`packages/ui/src/organisms/IssueForm.tsx`)
- YAML configuration schema (`packages/yaml-config/src/schema.ts`)
- Configuration documentation (`docs/configuration/reference.md`)
