---
purpose: Guide to using AI-powered issue triage for automatic priority assignment and team member routing
targetAudience: End users, project managers, administrators
lastUpdated: 2026-01-12
status: Optional Feature
---

# AI-Powered Issue Triage

**Status**: Optional Feature  
**Required Setup**: AI Provider Configuration (see [AI Providers Integration](/docs/integrations/ai-providers))  
**Permissions**: Admin by default (configurable via project configuration)

## Overview

AI-Powered Issue Triage uses machine learning to automatically analyze issues and provide intelligent suggestions for priority assignment and team member assignment. This feature helps teams quickly understand issues, prioritize work, and route issues to the right team members.

### What is AI Triage?

AI Triage analyzes issue context including:
- Issue title and description
- Current status and custom fields
- Error traces (if available from error tracking integrations)
- Recent comments (last 5-10 comments)

The AI then provides:
- **Summary**: Plain-language root cause analysis
- **Priority Suggestion**: Recommended priority level (matches project configuration or standard low/medium/high)
- **Assignee Suggestion**: Natural language description of recommended team member (e.g., "backend developer with API experience")

### When to Use AI Triage

AI Triage is helpful when:
- **Complex Issues**: Issues with lots of context that need analysis
- **Priority Uncertainty**: You're not sure how to prioritize an issue
- **Assignment Routing**: You need help determining who should work on an issue
- **Error Analysis**: Issues with error traces from monitoring tools
- **Large Volume**: You have many issues to triage quickly

### Benefits

- **Faster Triage**: Quickly understand complex issues without reading all details
- **Consistent Prioritization**: AI suggestions help maintain consistent priority standards
- **Better Routing**: Intelligent suggestions for issue assignment
- **Root Cause Analysis**: AI identifies patterns and root causes from error traces and descriptions

## Prerequisites

Before using AI Triage:

1. **AI Provider Configuration**: At least one AI provider must be configured (see [AI Providers Integration](/docs/integrations/ai-providers))
2. **Permissions**: You must have permission to use AI triage (Admin by default, configurable via `ai_triage_permissions` in project configuration)
3. **Issue Context**: Issues should have descriptive titles and descriptions for best results

## How to Trigger AI Triage

### Step 1: Open an Issue

1. Navigate to your project
2. Click on an issue to open the issue detail view
3. The AI Triage button appears in the issue header (if you have permissions)

### Step 2: Click "Triage with AI" Button

1. Look for the **"Triage with AI"** button in the issue detail header
2. **Note**: The button is only visible if:
   - You have permission to use AI triage (Admin by default, or roles allowed by project configuration)
   - AI provider is configured for the project
3. Click the button to trigger AI analysis

### Step 3: Wait for Analysis

- AI analysis typically takes 5-30 seconds (depending on provider and model)
- A loading indicator shows progress
- The "AI Triage Analysis" section automatically expands when analysis completes

### Button Visibility

The "Triage with AI" button is visible when:
- ✅ You have permission (Admin by default, or configured roles)
- ✅ At least one AI provider is configured for the project
- ✅ AI Gateway service is available

The button is hidden or disabled when:
- ❌ You don't have permission to use AI triage
- ❌ No AI providers are configured
- ❌ AI Gateway service is unavailable

**Permission Configuration**: See [Configuration Reference](/docs/configuration?section=reference) for `ai_triage_permissions` setting.

## Interpreting AI Triage Results

After AI analysis completes, the "AI Triage Analysis" section displays three types of suggestions:

### Summary Section

**What it shows**: Plain-language root cause analysis of the issue

**Example**:
```
This issue appears to be an authentication failure in the API endpoint. 
The error trace shows 401 responses when users attempt to log in. 
The root cause is likely an expired session token or invalid credentials.
```

**How to use**: Read the summary to quickly understand the issue without reviewing all details

### Priority Suggestion

**What it shows**: Recommended priority level

**Format**: 
- Matches your project's custom priority values (if configured in project configuration)
- Falls back to standard values (low/medium/high) if no custom priorities are configured

**Example** (with custom priorities):
```
Suggested Priority: Critical
```

**Example** (standard priorities):
```
Suggested Priority: High
```

**How to use**: Review the priority suggestion and accept it, modify it, or dismiss it

### Assignee Suggestion

**What it shows**: Natural language description of recommended team member

**Example**:
```
Suggested Assignee: Backend developer with API authentication experience
```

**Note**: Assignee suggestions are descriptive, not specific user names. You manually select the actual team member from your project members list.

**How to use**: Review the suggestion, then select the appropriate team member from your project

## Accepting and Modifying AI Suggestions

### Accepting Priority Suggestions

1. Review the priority suggestion in the "AI Triage Analysis" section
2. Click **"Accept"** button next to the priority suggestion
3. Issue priority is immediately updated
4. The suggestion is marked as accepted

**Modifying Priority**:
- Click the priority dropdown/selector to change the priority
- Select a different priority level
- Save the change (issue is updated immediately)

### Selecting Assignee

1. Review the assignee suggestion description
2. Click **"Select Assignee"** button
3. Project members list opens (filtered to project members)
4. Select the appropriate team member
5. Assignee is immediately updated on the issue

**Manual Selection**: You can also assign an issue manually using the assignee field in the issue detail view (AI suggestion is just a guide)

### Dismissing Suggestions

1. Click **"Dismiss"** button in the "AI Triage Analysis" section
2. AI Triage Analysis section collapses
3. Suggestions are cleared (you can re-run AI triage later)

**Note**: Dismissing suggestions does not revert any changes you've already accepted (priority/assignee updates remain)

### Collapsing/Expanding Section

- **Collapse**: Click the section header to collapse the "AI Triage Analysis" section
- **Expand**: Click the section header again to expand and view suggestions
- **Auto-expand**: Section automatically expands when new analysis completes

## Troubleshooting

### AI Gateway Unavailable

**Symptom**: Error message "AI Gateway is unavailable. Please check your configuration."

**Causes**:
- AI Gateway service is not running
- Network connectivity issues
- Incorrect AI Gateway URL configuration

**Solution**:
1. Check AI Gateway service status (see [AI Providers Integration](/docs/integrations/ai-providers) for verification steps)
2. Verify AI Gateway URL configuration (infrastructure setup)
3. Check network connectivity from web app to AI Gateway
4. Click **"Retry"** button to try again

**Note**: Issue functionality remains fully available even when AI is unavailable

### Permission Denied

**Symptom**: Button is hidden, or error "You do not have permission to use AI triage" (403 error)

**Causes**:
- User role is not in allowed permissions list
- Default permission is Admin only (if not configured)
- Project configuration restricts AI triage access

**Solution**:
1. Verify your user role (Admin, Member, or Viewer)
2. Check project configuration for `ai_triage_permissions` setting (see [Configuration Reference](/docs/configuration?section=reference))
3. Contact project administrator to update permissions if needed

**Configuration**: See [Configuration Reference](/docs/configuration?section=reference) for `ai_triage_permissions` field documentation

### Timeout (30 seconds)

**Symptom**: Error message "AI analysis request timed out. Please try again."

**Causes**:
- AI provider is slow to respond
- Network latency
- AI Gateway timeout (30-second limit)

**Solution**:
1. Click **"Retry"** button to try again
2. Check AI provider status (if using self-hosted LLM, verify service is running)
3. Try again later if provider is experiencing issues

**Note**: Timeout limit is 30 seconds per SC-011 requirement

### Malformed Response

**Symptom**: Error message "Invalid AI Gateway response. Please try again."

**Causes**:
- AI provider returned invalid response format
- AI Gateway parsing error
- Provider API issue

**Solution**:
1. Click **"Retry"** button to try again
2. If problem persists, check AI Gateway logs
3. Verify AI provider configuration is correct (see [AI Providers Integration](/docs/integrations/ai-providers))
4. Try a different AI provider if multiple are configured

### No Analysis Available

**Symptom**: "AI Triage Analysis" section doesn't appear or is empty

**Causes**:
- AI triage has not been triggered yet
- Analysis failed and was dismissed
- No AI providers configured

**Solution**:
1. Click **"Triage with AI"** button to trigger analysis
2. Verify AI providers are configured (see [AI Providers Integration](/docs/integrations/ai-providers))
3. Check that you have permission to use AI triage

### Priority Doesn't Match Project Config

**Symptom**: Priority suggestion uses standard values (low/medium/high) instead of custom priorities

**Causes**:
- Project configuration doesn't define custom priority values
- Priority field is not configured as dropdown type in project config

**Solution**:
1. Check project configuration for priority field definition
2. Ensure priority field is type `dropdown` with options defined
3. AI will use custom priorities if properly configured, otherwise falls back to standard values

**Configuration**: See [Configuration Reference](/docs/configuration?section=reference) for custom fields documentation

## Best Practices

### Writing Issue Descriptions

For best AI triage results:

1. **Clear Titles**: Use descriptive, specific titles
2. **Detailed Descriptions**: Include context, steps to reproduce, error messages
3. **Error Traces**: Include error traces from monitoring tools when available
4. **Context**: Provide background information and related issues

### Using Priority Suggestions

1. **Review Before Accepting**: Always review priority suggestions before accepting
2. **Project Context**: Consider your project's priority definitions and workflow
3. **Team Standards**: Align with team priority standards
4. **Modify as Needed**: Don't hesitate to modify suggestions based on team knowledge

### Assignee Selection

1. **Use Suggestions as Guide**: AI suggestions are descriptive, not definitive
2. **Team Knowledge**: Combine AI suggestions with team knowledge
3. **Workload**: Consider team member workload when selecting assignee
4. **Skills Match**: Match assignee skills to issue requirements

### When to Re-run Analysis

Re-run AI triage when:
- Issue description or context is updated significantly
- Error traces are added or updated
- Comments add important context
- Initial analysis was inaccurate or unclear

## Related Documentation

- [AI Providers Integration](/docs/integrations/ai-providers) - Setup and configuration for AI providers (infrastructure and project-level)
- [Configuration Reference](/docs/configuration?section=reference) - Project configuration documentation, including `ai_triage_permissions` setting
- [Project Settings](/docs/user/README.md#project-settings) - General project settings documentation

## Getting Help

If you encounter issues with AI Triage:

1. **Check Prerequisites**: Verify AI provider configuration and permissions
2. **Review Troubleshooting**: See troubleshooting section above for common issues
3. **Check Documentation**: Review [AI Providers Integration](/docs/integrations/ai-providers) for setup details
4. **Contact Administrator**: If issues persist, contact your project administrator

---

**Note**: AI Triage is an optional feature. All core issue management functionality works without AI Triage. The feature enhances issue triage but is not required for basic issue tracking.
