# Configuration Reference

Complete reference for Stride YAML configuration files.

## Overview

Stride projects are configured using YAML files that define workflows, custom fields, and automation rules. Configuration files are stored in your repository and can be edited through the web interface or directly in your Git repository.

## Project Configuration Schema

### Top-Level Fields

#### `project_key` (required)

- **Type**: String
- **Format**: 2-10 uppercase alphanumeric characters (regex: `^[A-Z0-9]{2,10}$`)
- **Description**: Unique identifier for the project used in issue keys (e.g., "APP-123")
- **Example**: `APP`, `WEB`, `API123`

```yaml
project_key: APP
```

#### `project_name` (required)

- **Type**: String
- **Description**: Human-readable project name
- **Example**: `My Application`, `Web Platform`

```yaml
project_name: My Application
```

## Workflow Configuration

### `workflow` (required)

Defines the workflow statuses and default status for new issues.

#### `default_status` (required)

- **Type**: String
- **Description**: Key of the default status for newly created issues
- **Must match**: One of the keys in `workflow.statuses`

```yaml
workflow:
  default_status: todo
```

#### `statuses` (required)

- **Type**: Array of Status Configuration objects
- **Minimum**: 1 status required
- **Description**: List of all available workflow statuses

### Status Configuration

Each status in the `statuses` array must have:

#### `key` (required)

- **Type**: String
- **Description**: Unique identifier for the status (used in API and database)
- **Example**: `todo`, `in_progress`, `done`

#### `name` (required)

- **Type**: String
- **Description**: Human-readable status name displayed in UI
- **Example**: `To Do`, `In Progress`, `Done`

#### `type` (required)

- **Type**: Enum (`open`, `in_progress`, `closed`)
- **Description**: Status type that controls basic transition semantics
- **Semantics**:
  - `open`: Initial status for new issues
  - `in_progress`: Active work status
  - `closed`: Terminal status. Cannot transition back to `open` or `in_progress` (except via "reopened" status)
- **Note**: By default, all transitions are allowed (permissive design). Use `transitions` field to restrict transitions.

#### `transitions` (optional)

- **Type**: Array of status keys (strings)
- **Default**: `undefined` (all transitions allowed)
- **Description**: Explicitly defines which statuses can be transitioned to from this status. If not defined, all transitions are allowed (permissive default). If defined as an empty array, no transitions are allowed. If defined with status keys, only transitions to those statuses are allowed.
- **Use case**: Enforce workflow rules like "must go through review before done"

**Example - Restrict "To Do" to only allow transitions to "In Progress" or "In Review":**
```yaml
workflow:
  statuses:
    - key: todo
      name: To Do
      type: open
      transitions: [in_progress, in_review]  # Can only move to these statuses
    - key: in_progress
      name: In Progress
      type: in_progress
      # No transitions defined = can move to any status
    - key: in_review
      name: In Review
      type: in_progress
      transitions: [done, in_progress]  # Can only move to done or back to in_progress
    - key: done
      name: Done
      type: closed
      # No transitions defined = can move to other closed statuses or reopened
```

```yaml
workflow:
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
```

## Custom Fields Configuration

### `custom_fields` (optional)

- **Type**: Array of Custom Field Configuration objects
- **Default**: Empty array `[]`
- **Description**: Additional fields to capture project-specific information

### Custom Field Configuration

Each custom field must have:

#### `key` (required)

- **Type**: String
- **Description**: Unique identifier for the field (used in API and database)
- **Example**: `priority`, `estimate`, `component`

#### `name` (required)

- **Type**: String
- **Description**: Human-readable field name displayed in UI
- **Example**: `Priority`, `Story Points`, `Component`

#### `type` (required)

- **Type**: Enum (`text`, `number`, `dropdown`, `date`, `boolean`)
- **Description**: Field data type

**Type Details**:

- `text`: Free-form text input
- `number`: Numeric value
- `dropdown`: Selection from predefined options (requires `options` array)
- `date`: Date value
- `boolean`: True/false checkbox

#### `options` (optional)

- **Type**: Array of strings
- **Required when**: `type` is `dropdown`
- **Description**: Available options for dropdown fields

```yaml
custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: estimate
    name: Story Points
    type: number
    required: false
  - key: component
    name: Component
    type: text
    required: false
  - key: due_date
    name: Due Date
    type: date
    required: false
  - key: blocked
    name: Blocked
    type: boolean
    required: false
```

#### `required` (optional)

- **Type**: Boolean
- **Default**: `false`
- **Description**: Whether the field must be set before transitioning to certain statuses

**Note**: Required fields are enforced when changing issue status. If a required field is missing, the status transition will be blocked with a validation error.

## Automation Rules Configuration

### `automation_rules` (optional)

- **Type**: Array of Automation Rule objects
- **Default**: Empty array `[]`
- **Description**: Rules for automating issue updates based on triggers

### Automation Rule Configuration

Each automation rule must have:

#### `trigger` (required)

- **Type**: String
- **Description**: Event that triggers the automation
- **Example**: `branch_created`, `pr_merged`, `webhook_received`

#### `action` (required)

- **Type**: String
- **Description**: Action to perform when trigger fires
- **Example**: `update_status`, `assign_user`, `add_label`

#### `conditions` (optional)

- **Type**: Object (key-value pairs)
- **Description**: Conditions that must be met for the rule to execute
- **Example**: `{ branch_pattern: "feature/*", status: "todo" }`

```yaml
automation_rules:
  - trigger: branch_created
    action: update_status
    conditions:
      branch_pattern: "feature/*"
      target_status: "in_progress"
  - trigger: pr_merged
    action: update_status
    conditions:
      target_status: "done"
```

## User Assignment Configuration

### `user_assignment` (optional)

- **Type**: User Assignment Configuration object
- **Default**: See defaults below
- **Description**: Configures default assignment behavior and requirements for issues

### User Assignment Configuration

#### `default_assignee` (optional)

- **Type**: Enum (`none`, `reporter`)
- **Default**: `none`
- **Description**: Default assignee when creating new issues
  - `none`: Issue starts unassigned (default behavior)
  - `reporter`: Automatically assign to issue reporter

```yaml
user_assignment:
  default_assignee: reporter  # Auto-assign to reporter
```

#### `assignee_required` (optional)

- **Type**: Boolean
- **Default**: `false`
- **Description**: Whether assignee is required for all issues (global requirement)

#### `clone_preserve_assignee` (optional)

- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to preserve assignee when cloning issues
  - `true`: Cloned issue keeps original assignee (default)
  - `false`: Cloned issue starts unassigned

#### `require_assignee_for_statuses` (optional)

- **Type**: Array of status keys
- **Default**: `[]`
- **Description**: Status keys that require an assignee before transitioning
- **Example**: `["in_progress", "in_review"]` - Issues must be assigned before moving to these statuses

```yaml
user_assignment:
  default_assignee: reporter
  assignee_required: false
  clone_preserve_assignee: true
  require_assignee_for_statuses: [in_progress, in_review]
```

**Notes**:
- When `require_assignee_for_statuses` is configured, status transitions to those statuses will be blocked if no assignee is set
- Status keys in `require_assignee_for_statuses` must match keys defined in `workflow.statuses`
- The `default_assignee` setting applies only when creating new issues, not when updating existing ones

## Complete Example

### Permissive Configuration (Default - All Transitions Allowed)

```yaml
project_key: APP
project_name: My Application

workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
      # No transitions defined = can move to any status
    - key: in_progress
      name: In Progress
      type: in_progress
      # No transitions defined = can move to any status
    - key: in_review
      name: In Review
      type: in_progress
      # No transitions defined = can move to any status
    - key: done
      name: Done
      type: closed
      # No transitions defined = can move to other closed statuses or reopened
    - key: reopened
      name: Reopened
      type: in_progress

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: false
```

### Restricted Configuration (Enforced Workflow)

```yaml
project_key: APP
project_name: My Application

workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
      transitions: [in_progress, in_review]  # Can only move to in_progress or in_review
    - key: in_progress
      name: In Progress
      type: in_progress
      transitions: [in_review, done]  # Can move to review or done (but not back to todo)
    - key: in_review
      name: In Review
      type: in_progress
      transitions: [done, in_progress]  # Can move to done, or back to in_progress for changes
    - key: done
      name: Done
      type: closed
      transitions: [reopened]  # Can only reopen, cannot go to other statuses
    - key: reopened
      name: Reopened
      type: in_progress
      transitions: [in_progress, in_review]  # Can go back to work

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: false
```

### Full Example with All Features

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
    - key: in_review
      name: In Review
      type: in_progress
    - key: done
      name: Done
      type: closed
    - key: reopened
      name: Reopened
      type: in_progress

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: estimate
    name: Story Points
    type: number
    required: false
  - key: component
    name: Component
    type: text
    required: false

automation_rules:
  - trigger: branch_created
    action: update_status
    conditions:
      branch_pattern: "feature/*"
      target_status: "in_progress"

user_assignment:
  default_assignee: reporter
  assignee_required: false
  clone_preserve_assignee: true
  require_assignee_for_statuses: [in_progress, in_review]
```

## Validation Rules

### Project Key Validation

- Must be 2-10 characters
- Must contain only uppercase letters (A-Z) and numbers (0-9)
- Must match regex: `^[A-Z0-9]{2,10}$`

### Status Validation

- At least one status must be defined
- `default_status` must match a status key
- Status keys must be unique
- Status types must be one of: `open`, `in_progress`, `closed`

### Custom Field Validation

- Field keys must be unique
- Dropdown fields must have `options` array
- Field types must be one of: `text`, `number`, `dropdown`, `date`, `boolean`

### Transition Rules

**Default Behavior (Permissive)**:
- If `transitions` is not defined on a status, all transitions are allowed (permissive default)
- This allows teams to get started quickly without configuration barriers

**Built-in Restrictions**:
- Cannot transition from `closed` to `open` or `in_progress` (except via "reopened" status)
- This is the only hard-coded restriction

**Explicit Transition Rules**:
- If `transitions` array is defined on a status, only transitions to those statuses are allowed
- Empty `transitions` array means no transitions are allowed from that status
- Transition rules are checked before type-based restrictions

**Other Validations**:
- Required custom fields must be set before transitioning to statuses that require them
- Assignee requirements are checked if configured

## Best Practices

1. **Use descriptive status names**: Status names appear in the UI, so make them clear and user-friendly
2. **Keep status keys short**: Status keys are used in API calls and database queries
3. **Define required fields carefully**: Required fields block status transitions, so only mark fields as required when necessary
4. **Version control your config**: Store configuration files in Git to track changes over time
5. **Test transitions**: Verify that your workflow allows the transitions your team needs
6. **Use automation rules sparingly**: Start simple and add automation as needed

