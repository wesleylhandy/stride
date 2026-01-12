# Quickstart: CHANGELOG Maintenance

## Overview

This guide explains how to maintain the CHANGELOG.md file following Keep a Changelog and Semantic Versioning standards.

## File Location

- **CHANGELOG.md**: Repository root (`/CHANGELOG.md`)

## Format

The CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features go here

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security fixes

## [0.1.0] - 2026-01-23

### Added
- Initial release
```

## Change Types

### Added
New features that users will notice.

**Example**:
```markdown
### Added
- User authentication with OAuth
- Dark mode support
```

### Changed
Changes to existing functionality (non-breaking).

**Example**:
```markdown
### Changed
- Improved performance of issue list loading
- Updated UI colors for better contrast
```

### Deprecated
Features that will be removed in a future version.

**Example**:
```markdown
### Deprecated
- `oldApiEndpoint` will be removed in v2.0.0. Use `newApiEndpoint` instead.
```

### Removed
Features that have been removed.

**Example**:
```markdown
### Removed
- Support for Node.js 18 (minimum is now Node.js 20)
```

### Fixed
Bug fixes.

**Example**:
```markdown
### Fixed
- Issue list not updating after creating new issue
- Memory leak in dashboard component
```

### Security
Security vulnerabilities that have been fixed.

**Example**:
```markdown
### Security
- Fixed XSS vulnerability in issue description rendering
```

## Breaking Changes

Always mark breaking changes clearly and include migration instructions.

**Format**:
```markdown
### Changed
- **BREAKING**: API endpoint `/api/v1/issues` now requires authentication
  - Migration: Add `Authorization` header to all requests
  - See [Migration Guide](./docs/migration-v1-to-v2.md) for details
```

## Workflow

### During Development

1. Add changes to the "Unreleased" section as you work
2. Group changes by type (Added, Changed, Fixed, etc.)
3. Be descriptive but concise

**Example**:
```markdown
## [Unreleased]

### Added
- New keyboard shortcut: Cmd+K for command palette

### Fixed
- Issue status not updating in real-time
```

### On Release

1. Move "Unreleased" content to a new version section
2. Update the version number (following Semantic Versioning)
3. Set the release date (ISO 8601 format: YYYY-MM-DD)
4. Update package.json version to match
5. Create git tag: `v0.2.0`
6. Clear the "Unreleased" section

**Example**:
```markdown
## [Unreleased]

## [0.2.0] - 2026-02-15

### Added
- New keyboard shortcut: Cmd+K for command palette

### Fixed
- Issue status not updating in real-time

[Full Changelog](https://github.com/owner/repo/compare/v0.1.0...v0.2.0)
```

## Semantic Versioning

Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.1.1): Bug fixes (backward compatible)

**Current Version**: Check `package.json` for current version.

## Best Practices

1. **Be Descriptive**: Write clear, user-focused descriptions
2. **Group Related Changes**: Group similar changes together
3. **Link to Issues/PRs**: Include links when available
   ```markdown
   - Fixed memory leak ([#123](https://github.com/owner/repo/issues/123))
   ```
4. **Mark Breaking Changes**: Always mark and document breaking changes
5. **Update Regularly**: Don't let "Unreleased" section get too large
6. **Use Present Tense**: "Added feature" not "Added feature in this release"

## Common Mistakes to Avoid

❌ **Don't**: Use git commit messages as changelog entries
❌ **Don't**: Include every single change (only notable changes)
❌ **Don't**: Use vague descriptions ("Fixed bugs", "Updated stuff")
❌ **Don't**: Forget to update "Unreleased" during development
❌ **Don't**: Forget to move "Unreleased" to versioned section on release

✅ **Do**: Write user-focused descriptions
✅ **Do**: Group changes by type
✅ **Do**: Include migration notes for breaking changes
✅ **Do**: Keep "Unreleased" section up to date
✅ **Do**: Follow the format consistently

## Integration with CONTRIBUTING.md

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Mergeability criteria (changelog entries required for breaking changes)
- Release process guidelines
- Version management

## References

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [spec-kit CHANGELOG Example](https://github.com/github/spec-kit/blob/main/CHANGELOG.md)
