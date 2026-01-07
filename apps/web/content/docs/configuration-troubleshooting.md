# Configuration Troubleshooting Guide

Common configuration errors and how to resolve them.

## Validation Errors

### "Project key must be 2-10 uppercase alphanumeric characters"

**Problem**: The `project_key` field doesn't match the required format.

**Solution**: 
- Use only uppercase letters (A-Z) and numbers (0-9)
- Keep it between 2-10 characters
- Examples: `APP`, `WEB`, `API123`

**Example Fix**:
```yaml
# ❌ Invalid
project_key: app
project_key: my-project
project_key: A

# ✅ Valid
project_key: APP
project_key: WEB
project_key: API123
```

### "Status 'X' is not defined in workflow"

**Problem**: The `default_status` references a status key that doesn't exist in `workflow.statuses`.

**Solution**: 
- Ensure `default_status` matches one of the `key` values in `workflow.statuses`
- Check for typos in status keys

**Example Fix**:
```yaml
# ❌ Invalid - default_status doesn't match any status key
workflow:
  default_status: todo
  statuses:
    - key: open
      name: Open
      type: open

# ✅ Valid
workflow:
  default_status: open
  statuses:
    - key: open
      name: Open
      type: open
```

### "Cannot transition from closed status to open or in-progress status"

**Problem**: Attempting to move an issue from a `closed` status back to `open` or `in_progress`.

**Solution**: 
- Closed statuses are terminal - issues cannot transition back
- Create a new issue or use a different workflow if you need to reopen issues
- Consider using a status like "Reopened" with type `in_progress` if reopening is needed

**Example Fix**:
```yaml
# If you need to reopen issues, add a "reopened" status
workflow:
  statuses:
    - key: done
      name: Done
      type: closed
    - key: reopened
      name: Reopened
      type: in_progress  # Allows reopening
```

### "Required field 'X' must be set before changing status"

**Problem**: A custom field marked as `required: true` is missing when trying to change status.

**Solution**: 
- Set the required field value before changing status
- Or remove `required: true` from the field if it's not actually required
- Or change to a status that doesn't require the field

**Example Fix**:
```yaml
# Option 1: Set the field before status change
# (In the UI, fill in the Priority field before moving to "In Progress")

# Option 2: Make the field optional
custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High]
    required: false  # Changed from true
```

### "Field 'X' must be one of: [options]"

**Problem**: A dropdown field has a value that's not in the `options` array.

**Solution**: 
- Update the field value to match one of the options
- Or add the value to the `options` array in the configuration

**Example Fix**:
```yaml
# Add missing option
custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]  # Added "Critical"
    required: true
```

### "Dropdown field must have options array"

**Problem**: A custom field has `type: dropdown` but no `options` array.

**Solution**: Add an `options` array with the available choices.

**Example Fix**:
```yaml
# ❌ Invalid
custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    # Missing options array

# ✅ Valid
custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
```

## YAML Syntax Errors

### "Invalid YAML syntax"

**Problem**: YAML file has syntax errors (indentation, quotes, etc.).

**Common Issues**:
- Incorrect indentation (YAML is space-sensitive)
- Missing colons after keys
- Unquoted strings with special characters
- Incorrect list formatting

**Solution**: 
- Use a YAML validator or editor with syntax highlighting
- Ensure consistent indentation (spaces, not tabs)
- Quote strings that contain special characters

**Example Fix**:
```yaml
# ❌ Invalid - missing colon
workflow
  default_status: todo

# ✅ Valid
workflow:
  default_status: todo

# ❌ Invalid - incorrect list format
statuses: - key: todo

# ✅ Valid
statuses:
  - key: todo
```

### "Expected array but got object"

**Problem**: A field expecting an array is formatted as an object.

**Solution**: Use array syntax with dashes (`-`) for list items.

**Example Fix**:
```yaml
# ❌ Invalid
custom_fields:
  priority:
    key: priority
    name: Priority

# ✅ Valid
custom_fields:
  - key: priority
    name: Priority
```

## Workflow Issues

### "Status transition not allowed"

**Problem**: Trying to move an issue to a status that violates transition rules.

**Solution**: 
- Review status types and transition rules
- Ensure you're not trying to move from `closed` to `open`/`in_progress`
- Check that both statuses exist in the configuration

### "Default status not found"

**Problem**: The `default_status` value doesn't match any status key.

**Solution**: 
- Verify `default_status` matches exactly (case-sensitive) one of the status keys
- Check for typos or extra spaces

## Configuration Not Updating

### Changes not reflected in UI

**Problem**: Configuration changes saved but not visible in the application.

**Solution**: 
- Refresh the page (configuration is cached)
- Check that the YAML is valid and saved correctly
- Verify you have Admin permissions to edit configuration
- Check browser console for errors

### "Configuration validation failed"

**Problem**: Configuration file has validation errors that prevent saving.

**Solution**: 
- Review all validation error messages
- Fix each error one by one
- Use the configuration editor's real-time validation to catch errors early

## Getting Help

If you're still experiencing issues:

1. **Check the error message**: Error messages include the field path and specific issue
2. **Validate your YAML**: Use an online YAML validator to check syntax
3. **Review examples**: See the [Configuration Examples](/docs/configuration?section=examples) for working examples
4. **Check the reference**: See the [Configuration Reference](/docs/configuration?section=reference) for complete schema details

