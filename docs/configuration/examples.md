---
purpose: Validated YAML configuration examples for common use cases
targetAudience: Developers, project administrators
lastUpdated: 2026-01-12
---

# Configuration Examples

Validated YAML configuration examples for common use cases.

## Basic Workflow

Minimal configuration with standard workflow:

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

## Kanban Workflow

Extended workflow with review stage:

```yaml
project_key: WEB
project_name: Web Platform

workflow:
  default_status: backlog
  statuses:
    - key: backlog
      name: Backlog
      type: open
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

custom_fields: []
automation_rules: []
```

## With Custom Fields

Configuration with priority and story points:

```yaml
project_key: API
project_name: API Service

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

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: story_points
    name: Story Points
    type: number
    required: false
  - key: component
    name: Component
    type: text
    required: false

automation_rules: []
```

## Complex Workflow with Multiple Custom Fields

Full-featured configuration:

```yaml
project_key: PLATFORM
project_name: Platform Team

workflow:
  default_status: backlog
  statuses:
    - key: backlog
      name: Backlog
      type: open
    - key: todo
      name: To Do
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
    - key: code_review
      name: Code Review
      type: in_progress
    - key: qa
      name: QA Testing
      type: in_progress
    - key: done
      name: Done
      type: closed
    - key: cancelled
      name: Cancelled
      type: closed

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: story_points
    name: Story Points
    type: number
    required: false
  - key: component
    name: Component
    type: dropdown
    options: [Frontend, Backend, Infrastructure, Mobile]
    required: false
  - key: due_date
    name: Due Date
    type: date
    required: false
  - key: blocked
    name: Blocked
    type: boolean
    required: false
  - key: epic
    name: Epic
    type: text
    required: false

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

## Sprint-Based Workflow

Configuration optimized for sprint planning:

```yaml
project_key: SPRINT
project_name: Sprint Team

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
    options: [Low, Medium, High]
    required: true
  - key: story_points
    name: Story Points
    type: number
    required: false
  - key: sprint
    name: Sprint
    type: text
    required: false

automation_rules: []
```

## Bug Tracking Workflow

Configuration focused on bug tracking:

```yaml
project_key: BUGS
project_name: Bug Tracker

workflow:
  default_status: reported
  statuses:
    - key: reported
      name: Reported
      type: open
    - key: triaged
      name: Triaged
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
    - key: fixed
      name: Fixed
      type: in_progress
    - key: verified
      name: Verified
      type: closed
    - key: wont_fix
      name: Won't Fix
      type: closed

custom_fields:
  - key: severity
    name: Severity
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: true
  - key: reproduction_steps
    name: Reproduction Steps
    type: text
    required: false
  - key: environment
    name: Environment
    type: dropdown
    options: [Development, Staging, Production]
    required: false

automation_rules: []
```

## With User Assignment Configuration

Configuration with user assignment defaults and requirements:

```yaml
project_key: TEAM
project_name: Team Project

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

user_assignment:
  default_assignee: reporter  # Auto-assign new issues to reporter
  assignee_required: false
  clone_preserve_assignee: true  # Keep assignee when cloning
  require_assignee_for_statuses: [in_progress, in_review]  # Require assignee before moving to these statuses
```

## Validation Notes

All examples above:
- ✅ Use valid project keys (2-10 uppercase alphanumeric)
- ✅ Have at least one status
- ✅ Have `default_status` matching a status key
- ✅ Use valid status types (`open`, `in_progress`, `closed`)
- ✅ Have unique status keys
- ✅ Have unique custom field keys
- ✅ Include `options` for dropdown fields
- ✅ Use valid custom field types

You can copy any of these examples and customize them for your project needs.
