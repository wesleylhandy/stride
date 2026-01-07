# Configuration Troubleshooting Guide

Common configuration errors and how to resolve them.

> **Quick Tip**: The default configuration is designed to be permissive and allow all common operations. If you're getting errors when moving issues, check that your configuration includes all statuses that your issues use. See the [Board Status Configuration Guide](/docs/board-status-configuration-guide) for detailed help.

## Quick Fixes

### "Cannot move issue between status blocks"

**Most Common Cause**: The issue's current or target status doesn't exist in your `workflow.statuses` configuration.

**Quick Fix**:
1. Check what status your issue currently has
2. Check what status you're trying to move it to
3. Ensure both statuses exist in your configuration's `workflow.statuses` array
4. Status keys must match exactly (case-sensitive)

**Example**: If your issue has status "Backlog" but your config only has "todo", add "Backlog" to your statuses:

```yaml
workflow:
  statuses:
    - key: backlog  # Add this if your issues use "backlog"
      name: Backlog
      type: open
    - key: todo
      name: To Do
      type: open
```

### "Status 'X' is not defined in your project workflow configuration"

**Quick Fix**: Add the missing status to your `workflow.statuses` array. The error message will show you which status is missing and what statuses are currently available.

See [Status Not Found](#status-x-is-not-defined-in-workflow) below for detailed steps.

### "Cannot transition from closed status"

**Quick Fix**: Add a "reopened" status with type `in_progress` to allow reopening closed issues:

```yaml
workflow:
  statuses:
    # ... your existing statuses ...
    - key: reopened
      name: Reopened
      type: in_progress  # This allows moving from closed to reopened
```

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

**Problem**: Either:
1. The `default_status` references a status key that doesn't exist in `workflow.statuses`, OR
2. An issue has a status value that doesn't match any status key in your configuration

**Solution**: 
- **For default_status errors**: Ensure `default_status` matches one of the `key` values in `workflow.statuses` (check for typos)
- **For issue status errors**: Add the missing status to your `workflow.statuses` array. Check your issues to see what status values they currently have

**Diagnostic Steps**:
1. Look at your Kanban board - what status columns are showing?
2. Check your issues - what status values do they have?
3. Compare these to your `workflow.statuses` array
4. Add any missing statuses

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

# If your issues have status "backlog" but config doesn't:
workflow:
  statuses:
    - key: backlog  # Add missing status
      name: Backlog
      type: open
    - key: todo
      name: To Do
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

## Board Status Issues

### "Cannot move issue between status blocks on the board"

**Problem**: Validation is blocking the status change. Common causes:
1. Status not defined in configuration (see above)
2. Trying to transition from closed to open/in_progress
3. Required custom fields not set
4. Status keys don't match (case sensitivity)

**Diagnostic Steps**:
1. Check the error message - it will tell you which status is missing or what rule is violated
2. Verify both the source and target statuses exist in your config
3. Check if you're trying to reopen a closed issue (needs "reopened" status)
4. Verify custom fields if you see "Required field" errors

**Solution**: See specific error sections above for targeted fixes.

### "Status transition not allowed"

**Problem**: Trying to move an issue to a status that violates transition rules.

**Common Cases**:
- Moving from `closed` to `open` or `in_progress` (not allowed)
- Missing intermediate statuses in workflow

**Solution**: 
- **To reopen closed issues**: Add a "reopened" status with type `in_progress` to your configuration (this is included in the default config)
- Review status types and transition rules - closed statuses can only transition to other closed statuses or reopened
- Check that both statuses exist in the configuration

**Example - Allowing Reopened Issues**:
```yaml
workflow:
  statuses:
    - key: done
      name: Done
      type: closed
    - key: reopened
      name: Reopened
      type: in_progress  # Allows: done → reopened
```

### "Current status 'X' is not defined in your project workflow configuration"

**Problem**: An issue in your database has a status value that doesn't exist in your current configuration. This can happen if:
- You removed a status from the config but issues still have that status
- You imported issues with different status values
- Status keys were renamed

**Solution**:
1. Check your issues to see what status values they have
2. Add all missing statuses to your `workflow.statuses` array
3. Consider migrating issues to use status keys from your config if needed

**Example**:
```yaml
# Your issues have "Backlog" but config doesn't
workflow:
  statuses:
    - key: backlog  # Add the missing status
      name: Backlog
      type: open
    # ... other statuses ...
```

### "Target status 'Y' is not defined in your project workflow configuration"

**Problem**: You're trying to move an issue to a status that doesn't exist in your config.

**Solution**: Add the target status to your `workflow.statuses` array, or choose a different target status that exists in your config.

## Workflow Issues

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

## Configuration Migration

### Migrating from Old Default Configuration

If you created your project before the default configuration was updated to include the "reopened" status, you can add it manually:

```yaml
workflow:
  statuses:
    # ... your existing statuses ...
    - key: reopened
      name: Reopened
      type: in_progress
```

### Syncing Issues with Configuration

If you have issues with status values that don't match your configuration:

1. **Option 1 - Add Missing Statuses** (Recommended): Add all status values from your issues to your configuration
2. **Option 2 - Update Issues**: Manually update issue statuses to match your configuration
3. **Option 3 - Use Default Config**: Reset to the default permissive configuration

## Getting Help

If you're still experiencing issues:

1. **Check the error message**: Error messages include the field path and specific issue, and often show available statuses
2. **Review the Board Status Configuration Guide**: See [Board Status Configuration Guide](/docs/board-status-configuration-guide) for comprehensive help with board and status issues
3. **Validate your YAML**: Use an online YAML validator to check syntax
4. **Review examples**: See the [Configuration Examples](/docs/configuration?section=examples) for working examples
5. **Check the reference**: See the [Configuration Reference](/docs/configuration?section=reference) for complete schema details

### Diagnostic Checklist

Before asking for help, check:
- [ ] All issue status values exist in `workflow.statuses`
- [ ] `default_status` matches a status key
- [ ] No required custom fields are blocking transitions
- [ ] YAML syntax is valid (check indentation, colons, etc.)
- [ ] Status keys match exactly (case-sensitive)
- [ ] Configuration is saved and page is refreshed

