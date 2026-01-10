# @stride/ui

Shared UI component library for Stride, following atomic design principles.

## Overview

This package provides reusable React components used across the Stride application. Components are organized using atomic design: atoms (basic components), molecules (composite components), and organisms (complex components).

## Installation

```bash
pnpm add @stride/ui
```

## Usage

### Basic Components

```typescript
import { Button, Input, Badge } from '@stride/ui';

function MyComponent() {
  return (
    <div>
      <Input placeholder="Enter text" />
      <Button>Click me</Button>
      <Badge variant="success">Active</Badge>
    </div>
  );
}
```

### Styles

Import the CSS file in your application:

```typescript
import '@stride/ui/styles';
```

### Complex Components

```typescript
import { KanbanBoard, ConfigEditor } from '@stride/ui';

function ProjectBoard() {
  return (
    <KanbanBoard
      issues={issues}
      statuses={statuses}
      onIssueMove={handleMove}
    />
  );
}
```

## Component Structure

- **atoms/**: Basic building blocks (Button, Input, Badge)
- **molecules/**: Composite components (Card, Form, Dialog)
- **organisms/**: Complex components (KanbanBoard, ConfigEditor, SprintPlanning)

## Key Features

- **Type-safe**: Full TypeScript support
- **Accessible**: WCAG 2.1 AA compliant components
- **Themable**: Uses Tailwind CSS with custom design tokens
- **Storybook**: Component documentation and testing via Storybook

## Development

```bash
# Run Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Dependencies

- React 19+
- Tailwind CSS
- @stride/types
- @stride/yaml-config

## Storybook

Component documentation and examples are available in Storybook:

```bash
pnpm storybook
```

Opens at http://localhost:6006
