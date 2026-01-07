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
- **Description**: Status type that controls transition rules
- **Rules**:
  - `open`: Initial status for new issues. Can transition to `in_progress` or `closed`
  - `in_progress`: Active work status. Can transition to other `in_progress` statuses or `closed`
  - `closed`: Terminal status. Cannot transition back to `open` or `in_progress`

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

## Complete Example

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

- Cannot transition from `closed` to `open` or `in_progress`
- Can transition from `open` to `in_progress` or `closed`
- Can transition between `in_progress` statuses
- Required custom fields must be set before transitioning to statuses that require them

## Best Practices

1. **Use descriptive status names**: Status names appear in the UI, so make them clear and user-friendly
2. **Keep status keys short**: Status keys are used in API calls and database queries
3. **Define required fields carefully**: Required fields block status transitions, so only mark fields as required when necessary
4. **Version control your config**: Store configuration files in Git to track changes over time
5. **Test transitions**: Verify that your workflow allows the transitions your team needs
6. **Use automation rules sparingly**: Start simple and add automation as needed

