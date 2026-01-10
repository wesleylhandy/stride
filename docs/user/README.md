# User Guide

Welcome to Stride! This guide will help you get started with using Stride for managing your projects and tracking work.

## Table of Contents

- [Getting Started](#getting-started)
- [Projects](#projects)
- [Issues](#issues)
- [Kanban Board](#kanban-board)
- [Sprints and Cycles](#sprints-and-cycles)
- [Configuration](#configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First-Time Setup

When you first access Stride, you'll need to create an admin account:

1. Navigate to your Stride instance (e.g., http://localhost:3000)
2. You'll see the setup page
3. Enter your information:
   - **Email**: Your email address
   - **Username**: A unique username (3-50 characters)
   - **Password**: A strong password (minimum 8 characters)
   - **Name**: Your display name (optional)
4. Click "Create Admin Account"

**Note**: Only the first user account created will have admin privileges.

### Logging In

1. Navigate to your Stride instance
2. Enter your email and password
3. Click "Sign In"

You'll be redirected to the dashboard after successful login.

### Dashboard Overview

The dashboard shows:
- **Projects List**: All projects you have access to
- **Quick Actions**: Create new projects, view recent activity
- **Search**: Quick access to search for projects and issues

## Projects

### Creating a Project

1. Click the "Create Project" button (or use the command palette: `Ctrl+K` or `Cmd+K`)
2. Fill in the project details:
   - **Project Key**: A short identifier (2-10 uppercase letters/numbers, e.g., "PROJ")
   - **Project Name**: The display name
   - **Description**: Optional project description
   - **Repository URL**: Optional link to your Git repository
3. Click "Create"

The project key is used to prefix issue keys (e.g., "PROJ-1", "PROJ-2").

### Viewing Projects

- **All Projects**: Click "Projects" in the navigation to see all projects
- **Project Details**: Click on a project card to view its details
- **Search**: Use the search bar to find projects by name

### Project Settings

From a project view, you can:
- **Edit Project**: Update name and description
- **Configure Workflow**: Edit the workflow configuration (YAML)
- **Manage Repository**: Connect Git repositories (GitHub, GitLab)
- **View Issues**: See all issues in the project

## Issues

### Creating an Issue

There are multiple ways to create an issue:

#### Method 1: Command Palette (Fastest)

1. Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) to open the command palette
2. Type "create issue"
3. Select the project
4. Fill in issue details:
   - **Title**: Issue title (required)
   - **Description**: Detailed description (supports Markdown)
   - **Type**: Bug, Feature, Task, or Epic
   - **Priority**: Low, Medium, High, or Critical
   - **Assignee**: Assign to a team member
   - **Story Points**: Optional estimation
5. Click "Create"

#### Method 2: Project View

1. Navigate to a project
2. Click "Create Issue"
3. Fill in the form as above

#### Method 3: Kanban Board

1. Navigate to a project's Kanban board
2. Click "Create Issue" in any status column
3. Fill in the form

### Issue Types

- **Bug**: A defect or error that needs fixing
- **Feature**: A new capability or enhancement
- **Task**: A general work item
- **Epic**: A large feature broken into smaller issues

### Viewing and Editing Issues

1. Click on any issue card to open the issue detail view
2. Edit fields by clicking on them
3. Use the **Description** field for:
   - Markdown formatting
   - Mermaid diagrams (code blocks with `mermaid` language)
   - Links to external resources (automatically show previews)
4. **Comments**: Add comments to collaborate with your team

### Issue Status

Issues have a status that determines their position on the Kanban board:
- **To Do**: Not started
- **In Progress**: Actively being worked on
- **Done/Closed**: Completed

Move issues between statuses by dragging them on the Kanban board or editing the status field.

## Kanban Board

The Kanban board is the primary interface for visualizing and managing work.

### Board Layout

- **Columns**: Each column represents a status (To Do, In Progress, Done, etc.)
- **Cards**: Each card represents an issue
- **Drag and Drop**: Move issues between columns to update their status

### Moving Issues

1. **Drag and Drop**: Click and hold an issue card, drag it to a new column, and release
2. **Validation**: The system validates that the transition is allowed by your workflow configuration
3. **Error Handling**: If a transition isn't allowed, you'll see an error message

### Board Features

- **Filter**: Filter issues by assignee, type, or priority
- **Search**: Search for specific issues
- **Grouping**: Group issues by assignee or type
- **Quick Create**: Click the "+" button in any column to create an issue in that status

### Workflow Configuration

Your Kanban board columns are defined by your project's workflow configuration. See [Configuration](#configuration) for details on customizing workflows.

**Note**: If you see "invalid configuration" errors when moving issues, check the [Board Status Configuration Guide](/docs/configuration?section=board-status).

## Sprints and Cycles

Sprints (cycles) help you organize work into time-bounded iterations.

### Creating a Sprint

1. Navigate to a project
2. Click "Sprints" or "Cycles" in the navigation
3. Click "Create Sprint"
4. Fill in details:
   - **Name**: Sprint name (e.g., "Sprint 1", "Q1 2025")
   - **Start Date**: When the sprint begins
   - **End Date**: When the sprint ends
   - **Goal**: Sprint objective (optional)
   - **Description**: Additional details (optional)
5. Click "Create"

### Adding Issues to Sprints

1. Open an issue
2. Click the "Sprint" field
3. Select a sprint from the dropdown
4. Save the issue

Or, when creating an issue, select the sprint in the creation form.

### Sprint Planning

1. Navigate to the Sprints page
2. Click on a sprint to view details
3. Use the sprint planning interface to:
   - View all issues in the sprint
   - Estimate story points
   - Track progress with burndown charts

### Burndown Charts

Sprints show burndown charts that visualize:
- **Total Story Points**: All story points in the sprint
- **Completed**: Story points completed
- **Remaining**: Story points remaining
- **Trend**: Progress over time

## Configuration

Projects use YAML configuration files to define workflows, custom fields, and automation rules.

### Accessing Configuration

1. Navigate to a project
2. Click "Settings" or "Configuration"
3. View or edit the YAML configuration

### Workflow Configuration

Define statuses and transitions:

```yaml
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
```

**Status Types**:
- `open`: Can transition to `in_progress` or `closed`
- `in_progress`: Can transition to other `in_progress` statuses or `closed`
- `closed`: Terminal status (cannot transition back)

### Custom Fields

Add custom fields to issues:

```yaml
custom_fields:
  - key: severity
    name: Severity
    type: select
    options:
      - Low
      - Medium
      - High
      - Critical
  - key: customer_reported
    name: Customer Reported
    type: boolean
```

### Automation Rules

Define rules that automatically update issues:

```yaml
automation_rules:
  - name: Auto-assign to reporter
    trigger: issue_created
    condition: true
    action:
      type: assign
      value: ${issue.reporterId}
```

For detailed configuration documentation, see the [Board Status Configuration Guide](/docs/configuration?section=board-status).

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

- **`Ctrl+K` / `Cmd+K`**: Open command palette
- **`Ctrl+F` / `Cmd+F`**: Search (context-dependent)
- **`Esc`**: Close modals, cancel actions
- **`Enter`**: Confirm actions, submit forms
- **`/`**: Quick search in command palette

### Command Palette Commands

The command palette (`Ctrl+K` / `Cmd+K`) provides quick access to:
- Create issue
- Navigate to project
- Search issues
- Recent items
- Settings

## Tips and Best Practices

### Issue Management

1. **Clear Titles**: Use descriptive, actionable titles
2. **Detailed Descriptions**: Include context, steps to reproduce (for bugs), and acceptance criteria
3. **Labels and Tags**: Use consistent naming for easy filtering
4. **Regular Updates**: Update status and add comments as work progresses

### Kanban Workflow

1. **Limit WIP**: Don't overload "In Progress" - focus on completing work
2. **Review Regularly**: Hold regular board reviews to identify blockers
3. **Clear Definitions**: Agree on what "Done" means for your team

### Sprint Planning

1. **Realistic Estimates**: Don't overcommit in sprint planning
2. **Track Progress**: Regularly update issue statuses to keep burndown charts accurate
3. **Sprint Goals**: Set clear, achievable goals for each sprint

### Configuration

1. **Start Simple**: Begin with a basic workflow and add complexity as needed
2. **Version Control**: Keep your configuration in version control (if using Git integration)
3. **Test Changes**: Test workflow changes in a test project first

### Collaboration

1. **Comments**: Use comments to communicate about issues
2. **Assignments**: Clearly assign work to team members
3. **Notifications**: Check for notifications about assigned issues

## User Roles

Stride supports three user roles:

- **Admin**: Full access to all features, including user management and project settings
- **Member**: Can create and manage issues, projects, and sprints
- **Viewer**: Read-only access to projects and issues

Your role determines what actions you can perform. If you need additional permissions, contact your administrator.

## Getting Help

### Documentation

- [API Documentation](../api/README.md) - For API integrations
- [Development Guide](../development/README.md) - For developers
- [Deployment Guide](../deployment/README.md) - For administrators

### Common Issues

**Can't move issues on Kanban board**:
- Check your workflow configuration matches your issue statuses
- See [Board Status Configuration Guide](/docs/configuration?section=board-status)

**Can't create issues**:
- Verify you have Member or Admin role
- Check that the project exists and you have access

**Configuration errors**:
- Validate your YAML syntax
- Check that all required fields are present
- Review the workflow configuration guide

### Support

If you encounter issues not covered in this guide:
1. Check the troubleshooting sections in relevant documentation
2. Review error messages for specific guidance
3. Contact your administrator or check the project's issue tracker

Happy tracking! 🚀
