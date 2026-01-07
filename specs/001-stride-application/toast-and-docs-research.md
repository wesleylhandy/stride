# Research: Toast Notifications & YAML Configuration Documentation

**Feature**: Toast Notifications & YAML Configuration Documentation  
**Date**: 2024-12-20  
**Status**: Complete

## Toast Library Evaluation

### Decision: Use `sonner` library

**Rationale**:
- **Lightweight**: ~2KB gzipped, minimal bundle impact
- **Accessible**: Built with ARIA live regions, keyboard navigation support
- **TypeScript**: Full TypeScript support with excellent type definitions
- **Customizable**: Easy to style with Tailwind CSS to match design system
- **React 18+**: Optimized for React Server Components and modern React patterns
- **Simple API**: `toast.success()`, `toast.error()`, etc. - intuitive and developer-friendly
- **Action Support**: Built-in support for action buttons (undo, retry)
- **Positioning**: Flexible positioning options (top-right, bottom-right, etc.)
- **Stacking**: Automatic stacking and queue management

**Alternatives Considered**:
- **react-hot-toast**: More features but larger bundle (~5KB), more opinionated styling
- **@radix-ui/react-toast**: Excellent accessibility but requires more setup, unstyled (would need custom styling)
- **Custom implementation**: Would require significant development time for accessibility features

**Implementation**:
- Install: `pnpm add sonner`
- Wrap app with `<Toaster />` component
- Use `toast.error()`, `toast.success()`, `toast.warning()`, `toast.info()` throughout app
- Customize styling via Tailwind classes

## Toast UX Patterns

### Decision: Non-blocking notifications with action support

**Rationale**:
- **Non-blocking**: Users can continue working while notifications are visible
- **Auto-dismiss**: Success messages auto-dismiss after 4 seconds
- **Persistent errors**: Error messages require manual dismissal or action
- **Action buttons**: Support undo/retry actions for reversible operations
- **Positioning**: Bottom-right corner (standard pattern, doesn't obstruct content)
- **Stacking**: Maximum 3 toasts visible, queue additional ones

**Toast Types**:
1. **Success**: Auto-dismiss after 4 seconds, green styling
2. **Error**: Manual dismiss or action button, red styling, longer duration
3. **Warning**: Auto-dismiss after 6 seconds, yellow styling
4. **Info**: Auto-dismiss after 5 seconds, blue styling

**Action Patterns**:
- **Undo**: For reversible operations (e.g., status changes, issue deletion)
- **Retry**: For failed operations (e.g., API errors, network failures)
- **View Details**: For complex errors linking to documentation or error details

## Documentation Structure

### Decision: Multi-location documentation with progressive detail

**Rationale**:
- **Marketing Site**: Quick start and overview for new users
- **Internal App**: Comprehensive reference for active users
- **Progressive Detail**: Start simple, link to detailed docs
- **Versioned**: Documentation versioned with configuration schema

**Structure**:

1. **Marketing Site** (`apps/site/docs/configuration.md`):
   - Overview of configuration as code concept
   - Quick start: minimal example
   - Common patterns (workflow setup, custom fields)
   - Link to full documentation

2. **Internal Application** (`apps/web/app/docs/configuration/page.tsx`):
   - Complete configuration reference
   - All schema options documented
   - Validation rules explained
   - Error messages and solutions
   - Interactive examples (optional future enhancement)

3. **In-App Help**:
   - Tooltips in configuration editor
   - Contextual help links
   - Schema validation error explanations

## YAML Configuration Schema Analysis

### Configuration Sections

1. **Project Metadata**:
   - `project_key`: 2-10 uppercase alphanumeric characters (required)
   - `project_name`: String, min 1 character (required)

2. **Workflow Configuration**:
   - `default_status`: Key of a status in the statuses array (required)
   - `statuses`: Array of status definitions (required, min 1)
     - Each status requires: `key`, `name`, `type`
     - `type` must be: `'open'`, `'in_progress'`, or `'closed'`

3. **Custom Fields**:
   - Array of custom field definitions (optional, defaults to empty)
   - Each field requires: `key`, `name`, `type`
   - `type` must be: `'text'`, `'number'`, `'dropdown'`, `'date'`, or `'boolean'`
   - `options`: Required for `'dropdown'` type, array of strings
   - `required`: Boolean, defaults to `false`

4. **Automation Rules**:
   - Array of automation rule definitions (optional, defaults to empty)
   - Each rule requires: `trigger`, `action`
   - `conditions`: Optional object for rule conditions

### Validation Rules

- Project key must match regex: `/^[A-Z0-9]{2,10}$/`
- Default status must exist in statuses array
- Status keys must be unique
- Custom field keys must be unique
- Dropdown fields must have options array
- All required fields must be present

### Common Patterns

1. **Simple Workflow**: To Do → In Progress → Done
2. **Review Workflow**: To Do → In Progress → In Review → Done
3. **Priority Field**: Dropdown with Low/Medium/High/Critical
4. **Story Points**: Number field for estimation
5. **Due Date**: Date field for deadlines

## Documentation Format

### Decision: Markdown with code examples

**Rationale**:
- **Markdown**: Easy to write and maintain, version control friendly
- **Code Examples**: YAML snippets with syntax highlighting
- **Progressive Examples**: Start with minimal, build to complex
- **Validation**: All examples tested against actual schema

**Format Structure**:
- Overview section explaining the concept
- Schema reference with all options
- Examples section with common patterns
- Troubleshooting section with common errors
- Migration guide for configuration updates

## Implementation Approach

### Toast System
- Create `ToastProvider` component wrapping app
- Create `useToast` hook for triggering toasts
- Replace all `alert()` calls with appropriate toast calls
- Enhance error messages with configuration context
- Add action buttons where appropriate (undo, retry)

### Documentation
- Create comprehensive configuration reference
- Add examples for each configuration section
- Create troubleshooting guide
- Add documentation routes to both sites
- Link documentation from error messages and help tooltips

## Success Metrics

- All `alert()` calls replaced with toasts
- Toast system accessible (WCAG 2.1 AA)
- Configuration documentation covers all schema options
- Documentation accessible from marketing site and internal app
- All examples validated against schema

