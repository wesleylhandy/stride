# Quickstart: Creating Service Integration Documentation

**Feature**: Service Integration Documentation  
**Created**: 2025-01-XX  
**Purpose**: Guide for creating new service integration documentation following established patterns

## Overview

This quickstart guide provides step-by-step instructions for creating documentation for a new service integration in Stride. Follow this guide to ensure consistency with existing documentation patterns.

---

## Prerequisites

- Understanding of the service/integration being documented
- Access to Stride repository
- Basic Markdown knowledge
- Understanding of Next.js App Router (for page components)

---

## Quick Start: Adding New Service Documentation

### Step 1: Research the Service

**Task**: Understand the service and its configuration requirements

**Requirements**:
- What the service does
- What features it enables in Stride
- Configuration requirements (environment variables, external service setup)
- Supported providers/services (if multiple)
- Verification steps (how to test it's working)

**Output**: Notes on service requirements and configuration

---

### Step 2: Create Marketing Site Page

**Location**: `apps/site/app/docs/integrations/[service]/page.tsx`

**Template**: Use existing service page as template (e.g., `apps/site/app/docs/integrations/smtp/page.tsx`)

**Required Sections**:
1. Overview (what it does, why use it)
2. Quick Start (minimal example, 3-5 steps)
3. Supported Services (if applicable)
4. Next Steps (link to detailed guide)

**Example Structure**:
```typescript
import Link from "next/link";

export default function ServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            [Service Name] Integration
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            [Brief description]
          </p>

          {/* Overview section */}
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Overview
            </h2>
            {/* Content */}
          </section>

          {/* Quick Start section */}
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Quick Start
            </h2>
            {/* Content */}
          </section>

          {/* Next Steps */}
          <section className="mt-10">
            <Link href="/docs/integrations" className="text-primary-600 hover:text-primary-500">
              ← Back to Integrations
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
```

**Content Guidelines**:
- Maximum 2-3 paragraphs per section
- Keep it simple and non-technical
- Include 1 minimal working example
- Link to web app docs for detailed information

---

### Step 3: Create Web App Content File

**Location**: `apps/web/content/docs/integrations/[service].md`

**Template**: Use existing service content file as template (e.g., `apps/web/content/docs/integrations/smtp.md`)

**Required Sections** (follow contract from `service-integration-docs-contracts.md`):

1. **Frontmatter**:
```yaml
---
title: "[Service Name] Integration"
description: "[Brief description]"
service: "[service-key]"
status: "[Optional|Required]"
---
```

2. **Overview**
   - What the service does
   - Why you'd want to configure it
   - What features it enables
   - Prerequisites

3. **Configuration**
   - Environment variables table
   - Step-by-step setup
   - Service-specific configuration (external service setup)

4. **Verification**
   - How to check if configured
   - How to test
   - Expected success indicators

5. **Examples**
   - Minimal example
   - Common configurations
   - Advanced configurations (if applicable)

6. **Troubleshooting**
   - Common issues
   - Error messages
   - Debugging steps

7. **Related Documentation**
   - Links to related docs
   - External service documentation
   - Next steps

**Example Structure**:
```markdown
---
title: "[Service Name] Integration"
description: "[Brief description]"
service: "[service-key]"
status: "Optional"
---

# [Service Name] Integration

## Overview

[What it does, why use it, what features it enables, prerequisites]

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VAR_NAME` | Yes* | `default` | Description of variable |

*Required only if feature is enabled

### Step-by-Step Setup

1. [Step 1]
2. [Step 2]
...

### Service-Specific Configuration

[External service setup if needed]

## Verification

### Check if Configured

[How to check configuration status]

### Test Integration

[How to test the integration]

## Examples

### Minimal Example

```env
# Minimal configuration
VAR_NAME=value
```

### Common Configurations

[Examples for different providers/services]

## Troubleshooting

### Common Issues

#### Issue Name

**Problem**: Description of problem

**Solution**: 
1. Step 1
2. Step 2

### Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Error text | Cause description | Solution steps |

## Related Documentation

- [Related doc link](#)
- [External service docs](https://example.com)
- [Next steps](#)
```

---

### Step 4: Create Web App Page Component

**Location**: `apps/web/app/docs/integrations/[service]/page.tsx`

**Template**: Use existing service page as template (e.g., `apps/web/app/docs/integrations/smtp/page.tsx`)

**Pattern**: Read from content file using existing pattern

**Example Structure**:
```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Metadata } from 'next';
import { MarkdownRenderer } from '@stride/ui';

export const metadata: Metadata = {
  title: '[Service Name] Integration - Stride',
  description: '[Brief description]',
};

interface ServicePageProps {
  params: Promise<{ service: string }>;
}

async function getDocContent(service: string): Promise<string> {
  const contentDir = join(process.cwd(), 'content', 'docs', 'integrations');
  const filePath = join(contentDir, `${service}.md`);
  
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read doc file for ${service}:`, error);
    return `# Documentation Not Found\n\nThe requested documentation could not be loaded.`;
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { service } = await params;
  const content = await getDocContent(service);

  return (
    <div className="max-w-6xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer 
          content={content} 
          enableMermaid={false} 
          enableLinkPreviews={false} 
        />
      </div>
    </div>
  );
}
```

---

### Step 5: Update Navigation

**Marketing Site**:

**Location**: Site navigation component (check existing nav implementation)

**Action**: Add link to new service page

**Example**:
```typescript
const integrationPages = [
  { label: 'SMTP', href: '/docs/integrations/smtp' },
  { label: 'Sentry', href: '/docs/integrations/sentry' },
  // ... other services
  { label: '[New Service]', href: '/docs/integrations/[service]' }, // ADD THIS
];
```

**Web App**:

**Location**: Docs navigation sidebar or tabs (check `apps/web/app/docs/layout.tsx` or navigation component)

**Action**: Add link to new service page

**Example**:
```typescript
const integrationSections = [
  { key: 'smtp', label: 'SMTP', href: '/docs/integrations/smtp' },
  { key: 'sentry', label: 'Sentry', href: '/docs/integrations/sentry' },
  // ... other services
  { key: '[service]', label: '[Service Name]', href: '/docs/integrations/[service]' }, // ADD THIS
];
```

---

### Step 6: Update Overview Pages

**Marketing Site Overview** (`apps/site/app/docs/integrations/page.tsx`):

**Action**: Add new service to integration list

**Example**:
```typescript
const integrations = [
  {
    name: 'SMTP',
    description: 'Email invitations for user management',
    href: '/docs/integrations/smtp',
    status: 'Optional',
  },
  // ... other services
  {
    name: '[Service Name]',
    description: '[Brief description]',
    href: '/docs/integrations/[service]',
    status: 'Optional',
  }, // ADD THIS
];
```

**Web App Overview** (`apps/web/app/docs/integrations/page.tsx`):

**Action**: Update content file or component to include new service

**Location**: `apps/web/content/docs/integrations/index.md` (if exists)

**Action**: Add new service to integration list

---

### Step 7: Update Environment Variables Reference

**Location**: Web app overview page (`apps/web/app/docs/integrations/page.tsx` or `apps/web/content/docs/integrations/index.md`)

**Action**: Add new service environment variables to reference table

**Example**: Update environment variables table to include new service's variables

---

### Step 8: Test Documentation

**Testing Checklist**:
- [ ] Marketing site page renders correctly
- [ ] Web app page renders correctly
- [ ] Content file loads without errors
- [ ] Navigation links work
- [ ] All code examples work as written
- [ ] All links are valid (internal and external)
- [ ] Environment variables are documented correctly
- [ ] Troubleshooting section covers common issues
- [ ] Accessibility requirements met (heading hierarchy, semantic HTML)
- [ ] SEO requirements met (meta tags, proper headings)

---

### Step 9: Review and Publish

**Review Checklist**:
- [ ] Content follows contract (`service-integration-docs-contracts.md`)
- [ ] Writing is clear and concise
- [ ] Examples are complete and tested
- [ ] All sections are included
- [ ] Related documentation links are accurate
- [ ] Code examples use appropriate syntax highlighting
- [ ] Tables are properly formatted
- [ ] Images/diagrams have alt text (if applicable)

**Publish**:
- Commit changes to version control
- Create PR with documentation updates
- Request review from team
- Merge after approval

---

## Documentation Template

Use this template for creating new service content files:

```markdown
---
title: "[Service Name] Integration"
description: "[Brief description]"
service: "[service-key]"
status: "Optional"
---

# [Service Name] Integration

## Overview

[What the service does, why you'd want to configure it, what features it enables, prerequisites]

## Configuration

### Environment Variables

| Variable | Required | Default | Description | Notes |
|----------|----------|---------|-------------|-------|
| `VAR_NAME` | Yes* | `default` | Description | Notes about variable |

*Required only if feature is enabled

### Step-by-Step Setup

1. **[Step 1 Title]**
   - Description of step
   - Code example if needed

2. **[Step 2 Title]**
   - Description of step
   - Code example if needed

### Service-Specific Configuration

[If external service setup is required, document it here with step-by-step instructions]

## Verification

### Check if Configured

[How to check if service is configured - log messages, status checks, etc.]

### Test Integration

[How to test the integration works - commands, UI actions, etc.]

**Expected Success**:
- [Success indicator 1]
- [Success indicator 2]

## Examples

### Minimal Example

```env
# Minimal configuration
VAR_NAME=value
```

### Common Configurations

#### Provider A

```env
# Provider A configuration
VAR_NAME=provider-a-value
```

#### Provider B

```env
# Provider B configuration
VAR_NAME=provider-b-value
```

## Troubleshooting

### Common Issues

#### Issue Name

**Problem**: [Description of problem]

**Possible Causes**:
- [Cause 1]
- [Cause 2]

**Solution**:
1. [Solution step 1]
2. [Solution step 2]

### Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Error text | Cause description | Solution steps |

### Debugging Steps

1. [Debugging step 1]
2. [Debugging step 2]

## Related Documentation

- [Related Stride documentation](#)
- [External service documentation](https://example.com)
- [Next steps after configuration](#)
```

---

## Best Practices

### Content Writing

1. **Be Clear**: Use simple, direct language
2. **Be Complete**: Include all necessary steps
3. **Be Accurate**: Verify all code examples work
4. **Be Consistent**: Use consistent terminology
5. **Be Actionable**: Each section should enable action

### Code Examples

1. **Test All Examples**: Verify they work before publishing
2. **Use Realistic Values**: Don't use placeholders like "xxx" or "example"
3. **Add Comments**: Include comments for clarity
4. **Show Output**: Include expected output when helpful
5. **Syntax Highlighting**: Use appropriate language identifiers

### Structure

1. **Follow Contracts**: Use the content contracts as guide
2. **Consistent Sections**: Include all required sections
3. **Proper Headings**: Use correct heading hierarchy (H2, H3, H4)
4. **Clear Navigation**: Make it easy to find information

### Accessibility

1. **Heading Hierarchy**: Use proper H2, H3, H4 structure
2. **Descriptive Links**: Use descriptive link text (not "click here")
3. **Table Headers**: Always include table headers
4. **Alt Text**: Include alt text for images/diagrams
5. **Screen Reader**: Test with screen reader when possible

---

## Common Pitfalls

1. **Missing Sections**: Ensure all required sections are included
2. **Untested Examples**: Always test code examples before publishing
3. **Broken Links**: Verify all links (internal and external) work
4. **Inconsistent Formatting**: Follow existing formatting patterns
5. **Missing Troubleshooting**: Include troubleshooting for common issues
6. **Unclear Instructions**: Make sure steps are clear and actionable
7. **Missing Verification**: Always include how to verify configuration works

---

## Summary

Follow these steps to create consistent, complete, and high-quality service integration documentation:

1. Research the service and requirements
2. Create marketing site page (static JSX)
3. Create web app content file (Markdown)
4. Create web app page component (reads from content file)
5. Update navigation (both sites)
6. Update overview pages (both sites)
7. Update environment variables reference
8. Test documentation thoroughly
9. Review and publish

Use the provided template and follow best practices to ensure documentation quality and consistency.
