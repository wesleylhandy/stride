---
purpose: Guide for configuring project workflow to enable moving issues between status blocks on the Kanban board
targetAudience: Developers, project administrators
lastUpdated: 2026-01-12
---

# Board Status Configuration Guide

This guide explains how to configure your project so you can move issues between status blocks on the Kanban board.

## Understanding the Error

When you get an "invalid configuration error" when trying to move issues, it typically means one of these problems:

1. **Status not defined in workflow**: The status value in your issue doesn't match any status key in your configuration
2. **Missing workflow configuration**: Your project doesn't have a valid workflow defined
3. **Status key mismatch**: The status keys in your configuration don't match the status values stored in your issues

## Required Configuration Structure

Every project **must** have a valid workflow configuration with at least these components:

```yaml
workflow:
  default_status: todo  # Must match one of the status keys below
  statuses:
    - key: todo          # Unique identifier (used in database)
      name: To Do        # Display name (shown in UI)
      type: open         # Must be: open, in_progress, or closed
```

## Critical Requirements

### 1. All Status Keys Must Be Unique

```yaml
workflow:
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: in_progress  # ✅ Valid
      name: In Progress
      type: in_progress
    - key: todo         # ❌ ERROR: Duplicate key
      name: Backlog
      type: open
```

### 2. `default_status` Must Match a Status Key

```yaml
workflow:
  default_status: todo  # ✅ Must match one of the keys below
  statuses:
    - key: todo         # ✅ Matches!
      name: To Do
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
```

### 3. Status Types Control Transitions

The `type` field controls what transitions are allowed:

- **`open`**: Can transition to `in_progress` or `closed`
- **`in_progress`**: Can transition to other `in_progress` statuses or `closed`
- **`closed`**: **Terminal** - Cannot transition back to `open` or `in_progress`

```yaml
workflow:
  statuses:
    - key: todo
      type: open        # Can go to in_progress or closed
    - key: done
      type: closed      # ❌ Cannot go back to open/in_progress
```

## Complete Working Example

Here's a minimal valid configuration that will allow moving issues:

```yaml
project_key: APP
project_name: My Application

workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
    - key: done
      name: Done
      type: closed

custom_fields: []
automation_rules: []
```

## Common Issues and Fixes

### Issue 1: "Status 'X' is not defined in your project workflow configuration"

**Problem**: Your issues have status values that don't exist in your workflow configuration.

**How to Diagnose**:
1. Go to your project's Kanban board
2. Look at what statuses your issues currently have
3. Check your configuration at `/projects/{projectId}/settings/config`

**Fix**:
Add the missing status to your `workflow.statuses` array:

```yaml
workflow:
  statuses:
    # If your issue has status="backlog", add this:
    - key: backlog
      name: Backlog
      type: open
    # ... other statuses
```

### Issue 2: "Project configuration not found"

**Problem**: Your project doesn't have a configuration at all.

**Fix**:
1. Navigate to `/projects/{projectId}/settings/config`
2. The editor should show a default configuration
3. If empty, paste the "Complete Working Example" above
4. Click "Save Configuration"

### Issue 3: Status Key Case Mismatch

**Problem**: Status keys are case-sensitive. `"Todo"` ≠ `"todo"`.

**Example**:
- Issue has: `status = "Todo"` (capital T)
- Config has: `key: todo` (lowercase t)
- ❌ These don't match!

**Fix**:
Ensure your configuration uses lowercase, kebab-case, or snake_case consistently:

```yaml
# ✅ Good - consistent lowercase
workflow:
  statuses:
    - key: todo
    - key: in_progress
    - key: in_review

# ❌ Bad - mixed case
workflow:
  statuses:
    - key: Todo      # Mixed case
    - key: InProgress # CamelCase
```

### Issue 4: Cannot Move from Closed Status

**Problem**: Once an issue is in a `closed` status, it cannot be moved back to `open` or `in_progress`.

**Fix**:
If you need to reopen issues, create a separate status with type `in_progress`:

```yaml
workflow:
  statuses:
    - key: done
      name: Done
      type: closed
    - key: reopened    # ✅ Allows reopening
      name: Reopened
      type: in_progress  # Not closed, so can move freely
```

### Issue 5: Missing Required Custom Fields

**Problem**: A required custom field must be set before moving to certain statuses.

**Example**:
```yaml
custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    required: true  # ❌ Must set before status change
```

**Fix**:
1. Edit the issue and set the required field
2. Then move the issue to the new status
3. Or make the field `required: false` if it's not truly required

## Step-by-Step Configuration Checklist

1. **Navigate to Configuration Editor**
   - Go to `/projects/{projectId}/settings/config`
   - You need Admin permissions

2. **Verify Your Configuration Has**:
   - [ ] `project_key` (2-10 uppercase alphanumeric)
   - [ ] `project_name`
   - [ ] `workflow.default_status` (matches a status key)
   - [ ] `workflow.statuses` array with at least 1 status
   - [ ] Each status has: `key`, `name`, and `type`

3. **Check Your Issues' Current Statuses**
   - View your Kanban board
   - Note what status values your issues have
   - Ensure each status exists in your config's `workflow.statuses`

4. **Validate YAML Syntax**
   - The editor will show syntax errors in red
   - Fix any YAML parsing errors before saving

5. **Save and Test**
   - Click "Save Configuration"
   - Return to the board
   - Try moving an issue
   - Check error messages for specific missing statuses

## Debugging Tips

### Check What Statuses Your Issues Actually Have

Run this query (if you have database access) or check the issue details:

```sql
SELECT DISTINCT status FROM "Issue" WHERE "projectId" = 'your-project-id';
```

Ensure each unique status value has a corresponding entry in your `workflow.statuses` array.

### View Error Messages Carefully

The error messages tell you exactly what's wrong:

- **"Current status 'X' is not defined"** → Add status 'X' to your config
- **"Target status 'Y' is not defined"** → Add status 'Y' to your config
- **"Available statuses: ..."** → These are the statuses that ARE defined

### Use the Default Configuration

If you're unsure, start with the default configuration from `generateDefaultConfig`:

```yaml
project_key: YOUR_PROJECT_KEY
project_name: Your Project Name

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

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: false

automation_rules: []
```

## Validation Rules Summary

From `packages/yaml-config/src/schema.ts`:

- **Project key**: `^[A-Z0-9]{2,10}$` (uppercase, alphanumeric)
- **Status type**: Must be `open`, `in_progress`, or `closed`
- **At least 1 status** required in `workflow.statuses`
- **`default_status`** must match a status key
- **Status keys** must be unique
- **Custom field type**: `text`, `number`, `dropdown`, `date`, or `boolean`

## Need More Help?

- See `/content/docs/configuration-reference.md` for full schema reference
- See `/content/docs/configuration-troubleshooting.md` for more error solutions
- Check the validation code in `packages/ui/src/organisms/KanbanBoard.tsx` (lines 249-319)

