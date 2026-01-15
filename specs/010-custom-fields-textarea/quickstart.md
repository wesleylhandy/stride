# Quickstart: Custom Fields Textarea Support

**Feature**: 010-custom-fields-textarea  
**Date**: 2026-01-27

## Overview

This guide shows how to use the new `textarea` custom field type with markdown support in your project configuration.

## YAML Configuration

Add a textarea field to your project's `stride.config.yaml`:

```yaml
project_key: MYPROJ
project_name: My Project

workflow:
  # ... workflow configuration

custom_fields:
  - key: meeting_notes
    name: Meeting Notes
    type: textarea
    required: false
  
  - key: acceptance_criteria
    name: Acceptance Criteria
    type: textarea
    required: true
  
  - key: technical_details
    name: Technical Details
    type: textarea
    required: false

  # ... other custom fields
```

### Field Properties

- **`key`** (required): Unique identifier for the field (used in API and database)
- **`name`** (required): Human-readable label displayed in forms
- **`type`** (required): Set to `textarea` for markdown-enabled textarea
- **`required`** (optional): Whether the field must be filled before status transitions (default: `false`)

**Note**: The `options` property is not used for textarea fields and will be ignored if present.

## Form Usage

When creating or editing an issue, textarea fields appear with markdown editing support:

### Creating an Issue

1. Navigate to project issues page
2. Click "Create Issue"
3. Fill in standard fields (title, description, etc.)
4. In the textarea custom field:
   - Enter markdown-formatted text
   - Use **bold**, *italic*, `code`, lists, links, etc.
   - Multi-line content supported
5. Submit the form

### Editing an Issue

1. Open an existing issue
2. Click "Edit"
3. Textarea fields show raw markdown text for editing
4. Make changes and save

### Example Markdown Content

```markdown
## Meeting Summary

**Date**: 2026-01-27

### Attendees
- Alice (Product)
- Bob (Engineering)
- Carol (Design)

### Discussion Points
1. Feature requirements finalized
2. Timeline agreed: 2 weeks
3. Next steps assigned

### Action Items
- [ ] Create design mockups
- [ ] Write technical spec
- [ ] Schedule follow-up meeting

**Note**: See [documentation](https://example.com) for details.
```

## Display Rendering

When viewing an issue, textarea field content is automatically rendered as formatted HTML:

### Viewing an Issue

1. Open an issue from the project issues list
2. Scroll to custom fields section
3. Textarea fields display with:
   - **Bold text** rendered as bold
   - *Italic text* rendered as italic
   - `Code` rendered with syntax highlighting
   - Lists formatted properly
   - Links clickable
   - Headers with proper hierarchy

### Example Rendered Output

The markdown content above would render as:

---

## Meeting Summary

**Date**: 2026-01-27

### Attendees
- Alice (Product)
- Bob (Engineering)
- Carol (Design)

### Discussion Points
1. Feature requirements finalized
2. Timeline agreed: 2 weeks
3. Next steps assigned

### Action Items
- [ ] Create design mockups
- [ ] Write technical spec
- [ ] Schedule follow-up meeting

**Note**: See [documentation](https://example.com) for details.

---

## Required Field Validation

If a textarea field is marked as `required: true`:

- Form validation prevents submission if field is empty
- Status transitions are blocked if required textarea field is empty
- Error message displayed: "[Field Name] is required"

### Example

```yaml
custom_fields:
  - key: acceptance_criteria
    name: Acceptance Criteria
    type: textarea
    required: true  # Must be filled before moving to "Done" status
```

## Best Practices

### Field Naming

- Use descriptive `key` values: `meeting_notes`, `technical_spec`, `user_feedback`
- Use clear `name` labels: "Meeting Notes", "Technical Specification", "User Feedback"

### Content Guidelines

- Use markdown formatting for structure (headers, lists, emphasis)
- Keep content focused and readable
- Use code blocks for technical snippets
- Use links for references to external resources

### When to Use Textarea

- **Use textarea for**:
  - Multi-paragraph content
  - Formatted documentation
  - Meeting notes or summaries
  - Technical specifications
  - Acceptance criteria with formatting

- **Use regular `text` field for**:
  - Single-line values
  - Short labels or tags
  - Simple identifiers

## API Usage

### Creating Issue with Textarea Field

```bash
POST /api/projects/MYPROJ/issues
Content-Type: application/json

{
  "title": "New Feature",
  "description": "Feature description",
  "customFields": {
    "meeting_notes": "## Notes\n\nImportant discussion points here."
  }
}
```

### Updating Issue with Textarea Field

```bash
PATCH /api/projects/MYPROJ/issues/123
Content-Type: application/json

{
  "customFields": {
    "meeting_notes": "## Updated Notes\n\nNew content here."
  }
}
```

### Retrieving Issue with Textarea Field

```bash
GET /api/projects/MYPROJ/issues/123
```

Response includes customFields with raw markdown strings:

```json
{
  "id": "123",
  "title": "New Feature",
  "customFields": {
    "meeting_notes": "## Notes\n\nImportant discussion points here."
  }
}
```

**Note**: The API returns raw markdown strings. The frontend renders them as HTML when displaying issues.

## Troubleshooting

### Field Not Appearing in Form

- Verify YAML configuration is valid
- Check that `type: textarea` is spelled correctly
- Ensure project configuration is loaded correctly
- Check browser console for validation errors

### Markdown Not Rendering

- Verify content is valid markdown syntax
- Check that MarkdownRenderer component is working (test with issue descriptions)
- Review browser console for rendering errors

### Validation Errors

- Required fields must have non-empty content
- Ensure field key matches between config and form data
- Check that customFields object structure is correct

## Related Documentation

- [Configuration Reference](../../../docs/configuration/reference.md) - Full custom fields documentation
- [Issue Management](../../../docs/user/README.md) - General issue management guide
