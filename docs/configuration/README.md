---
purpose: Complete documentation for configuring Stride projects using YAML configuration files
targetAudience: Developers, project administrators
lastUpdated: 2026-01-12
---

# Configuration Documentation

Complete documentation for configuring Stride projects using YAML configuration files.

## Documentation

- **[Configuration Reference](./reference.md)** - Complete schema reference with all fields, options, and validation rules
- **[Configuration Examples](./examples.md)** - Working examples for common use cases (Kanban, sprint-based, bug tracking, etc.)
- **[Troubleshooting Guide](./troubleshooting.md)** - Common errors and how to resolve them

## Quick Start

Stride projects are configured using YAML files that define workflows, custom fields, and automation rules. Here's a minimal example:

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
```

See the [Configuration Reference](./reference.md) for complete details, or check out [Configuration Examples](./examples.md) for ready-to-use templates.

## Additional Resources

- [Board Status Configuration Guide](/docs/configuration?section=board-status) - Detailed guide for configuring Kanban board workflows
