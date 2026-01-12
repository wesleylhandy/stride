# Quickstart: AI Configuration Assistant

**Feature**: AI-powered assistant for configuring projects and infrastructure  
**Target Users**: Project administrators, system administrators  
**Prerequisites**: AI provider configured (see [AI Providers Integration](/docs/integrations/ai-providers))

## Overview

The AI Configuration Assistant helps you configure Stride projects and infrastructure settings through natural language conversations. The assistant understands:

- Project configuration (workflows, custom fields, automation rules)
- Infrastructure configuration (AI Gateway, OAuth)
- Configuration validation and best practices
- YAML vs database configuration comparison

## Getting Started

### Step 1: Ensure AI Provider is Configured

The assistant requires an AI provider to be configured. If not configured:

1. Navigate to **Infrastructure Settings** → **AI Provider Configuration**
2. Configure at least one AI provider (Ollama, OpenAI, Anthropic, or Google Gemini)
3. See [AI Providers Integration Guide](/docs/integrations/ai-providers) for detailed setup

**Note**: If AI provider is not configured, the assistant will show setup instructions.

### Step 2: Access the Assistant

#### For Project Configuration:
1. Navigate to your project
2. Go to **Project Settings**
3. Click **"Ask AI Assistant"** button (or similar UI element)
4. Chat interface opens with project context

#### For Infrastructure Configuration:
1. Navigate to **Settings** → **Infrastructure** (admin only)
2. Click **"Ask AI Assistant"** button
3. Chat interface opens with infrastructure context

### Step 3: Start a Conversation

Type your question or request in natural language. Examples:

- **"How do I set up a Kanban workflow with priority fields?"**
- **"What custom fields should I add for a software development project?"**
- **"Review my project configuration and suggest improvements"**
- **"Compare my YAML config to the database settings"**
- **"How do I configure GitHub OAuth?"** (infrastructure context)

## Common Use Cases

### Use Case 1: Setting Up a New Project

**Scenario**: You're creating a new project and need help configuring it.

1. Open the assistant in project settings
2. Ask: **"I'm setting up a new software development project. What workflow and custom fields should I use?"**
3. Assistant provides recommendations based on best practices
4. Review suggestions and apply if desired

**Example Response**:
```
I recommend a Kanban-style workflow with these statuses:
- Backlog (open)
- To Do (open)
- In Progress (in_progress)
- In Review (in_progress)
- Done (closed)

For custom fields, consider:
- Priority (dropdown: Low, Medium, High, Critical)
- Story Points (number)
- Component (text)

Would you like me to generate this configuration?
```

### Use Case 2: Validating Existing Configuration

**Scenario**: You want to ensure your project configuration follows best practices.

1. Open the assistant
2. Ask: **"Review my current project configuration"**
3. Assistant analyzes your config and provides feedback

**Example Response**:
```
I've reviewed your configuration. Here's what I found:

✅ Good: You have a clear workflow with appropriate status types
⚠️  Suggestion: Consider adding a "Reopened" status for closed issues that need attention
✅ Good: Custom fields are well-defined
⚠️  Suggestion: The "Priority" field should be marked as required for better triage

Would you like me to suggest specific improvements?
```

### Use Case 3: Comparing YAML to Database

**Scenario**: You want to check if your YAML configuration matches what's in the database.

1. Open the assistant
2. Ask: **"Compare my YAML configuration to the database"**
3. Assistant fetches both and identifies differences

**Example Response**:
```
I found the following differences:

1. YAML has "in_review" status, but database doesn't
   - YAML: { key: "in_review", name: "In Review", type: "in_progress" }
   - Database: (missing)

2. Custom field "story_points" exists in database but not in YAML
   - Database: { key: "story_points", name: "Story Points", type: "number" }
   - YAML: (missing)

Would you like me to help reconcile these differences?
```

### Use Case 4: Infrastructure Setup

**Scenario**: You're setting up infrastructure configuration for the first time.

1. Open the assistant in infrastructure settings (admin only)
2. Ask: **"How do I configure GitHub OAuth for repository integration?"**
3. Assistant provides step-by-step guidance

**Example Response**:
```
To configure GitHub OAuth:

1. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set Authorization callback URL: https://your-domain.com/api/projects/[projectId]/repositories/callback

2. Configure in Stride:
   - Enter Client ID and Client Secret in Infrastructure Settings
   - Or set environment variables: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET

3. Test the connection:
   - Click "Test Connection" to verify

See [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration) for details.
```

## Applying Configuration Suggestions

When the assistant provides configuration suggestions:

1. **Review the suggestion**: Read the explanation and understand what it does
2. **Preview the change**: Assistant shows what will be added/modified
3. **Apply the suggestion**: Click "Apply" button (if provided)
4. **Validate**: System validates the configuration before applying
5. **Confirm**: Review the final configuration and confirm

**Note**: Configuration changes are validated against the schema. Invalid configurations cannot be applied.

## Best Practices

### For Project Configuration:
- **Start simple**: Begin with basic workflow, add complexity as needed
- **Use meaningful names**: Status and field names should be clear
- **Validate early**: Use assistant to validate before deploying
- **Document custom fields**: Explain what each custom field is for

### For Infrastructure Configuration:
- **Use environment variables in production**: More secure and version-controlled
- **Test connections**: Always test OAuth and AI provider connections
- **Follow documentation**: Assistant references official docs, follow them

### For Conversations:
- **Be specific**: Clear questions get better answers
- **Provide context**: Mention your use case (e.g., "for a mobile app team")
- **Ask follow-ups**: Clarify if you don't understand a suggestion
- **Review suggestions**: Always review before applying

## Troubleshooting

### Assistant Not Responding

**Issue**: Assistant doesn't respond or shows error.

**Solutions**:
1. Check AI provider configuration (Infrastructure Settings)
2. Verify AI Gateway is running and accessible
3. Check browser console for errors
4. Try refreshing the page

### Configuration Suggestions Fail to Apply

**Issue**: Suggestion application fails with validation error.

**Solutions**:
1. Review the error message - it will indicate which field is invalid
2. Check the configuration schema in [Configuration Reference](/docs/configuration/reference)
3. Ask assistant to explain the validation error
4. Manually fix the configuration and try again

### Assistant Doesn't Understand My Question

**Issue**: Assistant provides irrelevant or incorrect responses.

**Solutions**:
1. Rephrase your question more specifically
2. Provide more context about your use case
3. Break complex questions into smaller parts
4. Reference specific configuration elements (e.g., "workflow statuses")

### Missing Documentation References

**Issue**: Assistant mentions documentation but links don't work.

**Solutions**:
1. Documentation is in the `docs/` directory of the repository
2. Check if you're viewing the correct version
3. Report broken links to maintainers

## Advanced Features

### Conversation History

- Conversations are saved automatically
- Access previous conversations from the assistant interface
- Each project/infrastructure context has separate conversation history

### Configuration Comparison

- Compare YAML configuration to database state
- Identify configuration drift
- Get recommendations for reconciliation

### Documentation Integration

- Assistant references official documentation
- Click documentation links in responses for more details
- Assistant explains configuration options based on docs

## Next Steps

- Read the [Configuration Reference](/docs/configuration/reference) for complete schema documentation
- Explore [Configuration Examples](/docs/configuration/examples) for common patterns
- Review [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration) for infrastructure setup
- Check [AI Providers Integration](/docs/integrations/ai-providers) for AI setup details

## Support

If you encounter issues or have questions:

1. Check the troubleshooting section above
2. Review relevant documentation
3. Ask the assistant for help (it can explain its own features!)
4. Report bugs or request features through your project's issue tracker
