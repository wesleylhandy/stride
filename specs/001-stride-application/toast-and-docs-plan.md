# Implementation Plan: Toast Notifications & YAML Configuration Documentation

**Feature Branch**: `001-stride-application` (enhancement)  
**Created**: 2024-12-20  
**Status**: Planning Complete (Phase 0-1)  
**Parent Feature**: `specs/001-stride-application/spec.md`

## User Input

```text
We need to transition away from window alerts to toasts or some more graceful handling of configuration issues. We also need to add documentation to the main site, and perhaps to the internal site as well, for how to configure the yaml. What are the rules and options, for instance.
```

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **UI Library**: Custom component library in `packages/ui`
- **Styling**: Tailwind CSS with custom design tokens
- **Monorepo**: Turborepo with pnpm
- **Documentation**: MDX for marketing site, Markdown for internal docs

### Current State
- **Alert Usage**: `window.alert()` used in:
  - `apps/web/src/components/KanbanBoardClient.tsx` - Error handling for status updates
  - Configuration validation errors
  - API error responses
- **Documentation**: 
  - Marketing site exists at `apps/site`
  - No comprehensive YAML configuration documentation
  - Configuration schema defined in `packages/yaml-config/src/schema.ts`
  - Default config example in `packages/yaml-config/src/default-config.ts`

### Dependencies
- **Toast Library Options**:
  - `sonner` - Lightweight, accessible toast library
  - `react-hot-toast` - Popular, feature-rich
  - `@radix-ui/react-toast` - Accessible, unstyled (matches design system)
  - Custom implementation using existing UI components
- **Documentation Tools**:
  - MDX for marketing site (already in use)
  - Markdown for internal documentation
  - Code examples and schema documentation

### Integrations
- **Toast System**: Must integrate with existing error handling patterns
- **Documentation**: Must be accessible from:
  - Marketing site (`apps/site`)
  - Internal application (help/docs section)
  - Potentially in-app tooltips/help text

### Architecture Decisions
- **Toast Implementation**: 
  - NEEDS CLARIFICATION: Which toast library to use?
  - NEEDS CLARIFICATION: Should toasts be global or context-specific?
  - NEEDS CLARIFICATION: Toast positioning and styling preferences?
- **Documentation Structure**:
  - NEEDS CLARIFICATION: Single comprehensive guide or multiple focused pages?
  - NEEDS CLARIFICATION: Interactive examples or static documentation?
  - NEEDS CLARIFICATION: Should documentation be versioned with config schema?

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Toast library selection - Use `sonner` (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Toast implementation - Use library, not custom (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Toast types - success, error, warning, info (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Toast actions - Support undo/retry actions (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Documentation detail - Progressive detail (quick start → full reference) (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Documentation format - Static Markdown with code examples (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Documentation location - Both marketing site and internal app (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Documentation versioning - Versioned with schema, examples validated (see `toast-and-docs-research.md`)
- ✅ **RESOLVED**: Example format - YAML snippets with progressive complexity (see `toast-and-docs-research.md`)

All clarifications resolved. See `toast-and-docs-research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [x] SOLID principles
  - Toast component should be single responsibility
  - Documentation should be open/closed (extensible)
- [x] DRY, YAGNI, KISS
  - Reusable toast system (DRY)
  - Start with essential toast types (YAGNI)
  - Simple documentation structure (KISS)
- [x] Type safety
  - TypeScript for toast props and documentation types
  - Zod schemas for configuration examples
- [x] Accessibility
  - WCAG 2.1 AA compliance for toasts
  - ARIA live regions for toast announcements
  - Keyboard navigation for toast actions
- [x] User experience
  - Non-blocking error notifications
  - Clear, actionable error messages
  - Comprehensive but scannable documentation

### Code Quality Gates
- [ ] No `any` types in toast implementation
- [ ] Proper error handling in toast system
- [ ] Documentation examples must be valid YAML
- [ ] All configuration options documented

## Phase 0: Outline & Research

### Research Tasks
- [x] Toast library evaluation (sonner selected)
- [x] Toast UX patterns research
- [x] Documentation structure research
- [x] YAML configuration schema analysis

### Research Output
- [x] `toast-and-docs-research.md` generated with all clarifications resolved
- [x] Toast library decision: `sonner` selected
- [x] Documentation structure: Multi-location with progressive detail
- [x] Configuration schema analysis complete

## Phase 1: Design & Contracts

### Toast System Design
- [x] Toast API designed (using `sonner` library)
- [x] Error handling integration pattern defined
- [x] Action button support designed

### Documentation Structure
- [x] Marketing site documentation structure defined
- [x] Internal application documentation structure defined
- [x] Configuration reference sections identified

### Data Model
- [x] `toast-and-docs-data-model.md` generated
- [x] Toast state model defined (client-side only)
- [x] Documentation content model defined (static)

### API Contracts
- [x] `toast-and-docs-contracts.md` generated
- [x] Toast hook interface defined
- [x] Error response enhancement pattern defined

### Quickstart
- [x] `toast-and-docs-quickstart.md` generated
- [x] Toast system setup guide created
- [x] Documentation setup guide created

## Phase 2: Implementation Planning

### Component Structure

**Toast Components** (`packages/ui/src/molecules/Toast.tsx`):
- Toast component with variants
- ToastProvider context
- useToast hook
- ToastContainer layout

**Documentation Components** (`apps/site/components/docs/`):
- ConfigurationReference component
- SchemaExplorer component
- ExampleCodeBlock component
- InteractiveConfigBuilder (optional)

### State Management
- Toast state: Local React state in ToastProvider
- Toast queue: Array of pending toasts
- Documentation: Static content, no state needed

### Testing Strategy
- Unit tests for toast component
- Integration tests for toast integration
- Documentation examples validated against schema
- Accessibility tests for toast announcements

## Phase 3: Implementation Tasks

### Task Breakdown

**Toast System**:
1. Research and select toast library
2. Create Toast component with variants
3. Create ToastProvider and useToast hook
4. Replace alert() calls in KanbanBoardClient
5. Replace alert() calls in error handlers
6. Add toast support for configuration errors
7. Add action buttons for retry/undo where appropriate
8. Test accessibility (screen readers, keyboard navigation)

**Documentation**:
1. Analyze YAML configuration schema
2. Create configuration reference documentation
3. Add examples for each configuration section
4. Create quick start guide
5. Add documentation to marketing site
6. Add documentation to internal application
7. Create interactive examples (optional)
8. Add validation rules documentation
9. Document error messages and solutions

## Success Criteria

- [ ] All `alert()` calls replaced with toast notifications
- [ ] Toast system accessible (WCAG 2.1 AA compliant)
- [ ] Error messages provide actionable guidance
- [ ] Configuration documentation covers all schema options
- [ ] Documentation accessible from marketing site
- [ ] Documentation accessible from internal application
- [ ] All documentation examples are valid YAML
- [ ] Documentation includes troubleshooting section

## Notes

- Toast system should be non-intrusive and accessible
- Documentation should be comprehensive but scannable
- Configuration examples must be tested against actual schema
- Consider adding in-app help tooltips linking to documentation

