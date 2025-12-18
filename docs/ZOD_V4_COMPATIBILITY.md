# Zod v4 Compatibility Guide

**Version**: Zod 4.2.1  
**Reference**: [Zod v4 Documentation](https://zod.dev/)  
**Migration from**: Zod 3.22.0 → 4.2.1

## Key Breaking Changes

### 1. Deprecated Methods

- **`.strict()` and `.passthrough()`**: Deprecated in favor of `z.strictObject()` and `z.looseObject()`
- **`.strip()`**: Deprecated
- **`.nonstrict()`**: Dropped
- **`.deepPartial()`**: Dropped
- **`.merge()`**: Deprecated, use `.extend()` or `.safeExtend()` instead
- **`.nonempty()`**: Type changed (now returns array with at least one element)

### 2. Object Changes

- **`z.object()`**: Now uses `z.strictObject()` behavior by default
- **`z.strictObject()`**: New method for strict object validation
- **`z.looseObject()`**: New method for loose object validation (allows extra keys)
- **Defaults in optional fields**: Now applied correctly within optional fields

### 3. Array Changes

- **`.nonempty()`**: Type signature changed - returns `[T, ...T[]]` instead of `T[]`

### 4. String Changes

- **`.ipv6()`**: Updated behavior
- **`.cidr()`**: Dropped (use separate validation if needed)

### 5. Coercion Updates

- **`z.coerce`**: Updated behavior - check specific coercion methods

### 6. Function Changes

- **`z.function()`**: Updated API
- **`.implementAsync()`**: New method for async function validation
- **`z.promise()`**: Deprecated

### 7. Record Changes

- **`z.record()`**: Single argument usage dropped - must specify key and value schemas
- **Enum support**: Improved enum support in records

### 8. Intersection Changes

- **`z.intersection()`**: Now throws Error on merge conflicts (previously silent)

### 9. Literal Changes

- **Symbol support**: Dropped from `z.literal()`
- **Multiple values**: Now supported in `z.literal()`

### 10. Refinement Changes

- **Type predicates**: Now ignored in `.refine()`
- **`ctx.path`**: Dropped from refinement context
- **Function as second argument**: Dropped from `.refine()`

### 11. Internal Changes

- **`._def`**: Moved to different location
- **ZodEffects**: Dropped
- **ZodTransform**: Added
- **ZodPreprocess**: Dropped
- **ZodBranded**: Dropped

## Migration Patterns

### Before (Zod v3)
```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
}).strict();

const record = z.record(z.string());
```

### After (Zod v4)
```typescript
import { z } from 'zod';

const schema = z.strictObject({
  name: z.string(),
  age: z.number(),
});

const record = z.record(z.string(), z.unknown()); // Must specify value schema
```

## Performance Improvements

- **14x faster string parsing**
- **7x faster array parsing**
- **6.5x faster object parsing**
- **100x reduction in tsc instantiations**
- **2x reduction in core bundle size**

## New Features

- **Metadata support**: `.meta()` for adding metadata to schemas
- **Global registry**: For schema management
- **File schemas**: `z.file()` for file validation
- **Internationalization**: Built-in i18n support
- **Error pretty-printing**: Improved error messages
- **Template literal types**: Enhanced support
- **Stringbool**: `z.stringbool()` for string boolean conversion

## Usage in Stride

Zod is used in:
- `packages/yaml-config`: For YAML configuration schema validation
- API route validation: For request/response validation
- Form validation: For client-side form validation

## Best Practices

1. **Use `z.strictObject()`** for strict validation (default behavior)
2. **Use `z.looseObject()`** when you need to allow extra keys
3. **Always specify both key and value schemas** for `z.record()`
4. **Use `.extend()` or `.safeExtend()`** instead of `.merge()`
5. **Check refinement context** - `ctx.path` is no longer available
6. **Use `.meta()`** for adding metadata to schemas

## References

- [Zod v4 Documentation](https://zod.dev/)
- [Zod v4 Changelog](https://zod.dev/v4/changelog)
- [Zod v4 Release Notes](https://zod.dev/v4)

