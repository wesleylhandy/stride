# @stride/yaml-config

YAML configuration parsing and validation for Stride project workflows.

## Overview

This package provides utilities for:
- Parsing YAML configuration files
- Validating configuration against schemas
- Generating default configurations
- Type-safe configuration handling

## Installation

```bash
pnpm add @stride/yaml-config
```

## Usage

### Parsing Configuration

```typescript
import { parseYamlConfig, stringifyYamlConfig } from '@stride/yaml-config';

// Parse YAML string to configuration object
const result = parseYamlConfig(yamlString);

if (result.success) {
  const config = result.data;
  // Use validated configuration
} else {
  console.error('Validation errors:', result.errors);
}
```

### Validating Configuration

```typescript
import { validateYamlConfig } from '@stride/yaml-config';

const validation = validateYamlConfig(yamlString);
if (!validation.isValid) {
  console.error('Invalid config:', validation.errors);
}
```

### Generating Default Configuration

```typescript
import { generateDefaultConfig } from '@stride/yaml-config';

const defaultConfig = generateDefaultConfig('PROJ', 'My Project');
const yamlString = stringifyYamlConfig(defaultConfig);
```

### Converting to YAML

```typescript
import { stringifyYamlConfig } from '@stride/yaml-config';

const yaml = stringifyYamlConfig(configObject);
```

## Configuration Structure

Configuration files follow this structure:

```yaml
project:
  key: PROJ
  name: My Project

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

## Validation

The package uses Zod for runtime validation:

- Schema validation ensures type safety
- Required fields are enforced
- Invalid values are rejected with clear error messages

## Error Handling

Parsing and validation return result objects:

```typescript
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };
```

## Development

```bash
# Type check
pnpm type-check

# Lint
pnpm lint
```

## Dependencies

- `js-yaml`: YAML parsing
- `zod`: Runtime validation

## Schema Definition

The configuration schema is defined using Zod schemas. See `src/schema.ts` for the complete schema definition.

## Examples

### Complete Example

```typescript
import {
  parseYamlConfig,
  stringifyYamlConfig,
  generateDefaultConfig,
} from '@stride/yaml-config';

// Generate default config
const defaultConfig = generateDefaultConfig('APP', 'My Application');

// Convert to YAML
const yaml = stringifyYamlConfig(defaultConfig);

// Parse and validate
const result = parseYamlConfig(yaml);

if (result.success) {
  console.log('Valid configuration:', result.data);
} else {
  console.error('Errors:', result.errors);
}
```
