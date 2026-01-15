---
purpose: Guide to using AI-powered configuration assistant for project and infrastructure setup
targetAudience: End users, project administrators, system administrators
lastUpdated: 2026-01-23
status: Optional Feature
---

# AI Configuration Assistant

**Status**: Optional Feature  
**Required Setup**: AI Provider Configuration (see [AI Providers Integration](/docs/integrations/ai-providers))  
**Permissions**: Admin by default (configurable via project configuration)

## Overview

The AI Configuration Assistant helps you configure Stride projects and infrastructure settings through natural language conversations. The assistant understands your configuration system, references official documentation, and provides step-by-step guidance for setting up workflows, custom fields, automation rules, and infrastructure components.

### What is the AI Configuration Assistant?

The AI Configuration Assistant is an intelligent chat interface that:

- **Understands Configuration**: Knows about workflows, custom fields, automation rules, and infrastructure settings
- **Provides Guidance**: Offers step-by-step instructions for configuration tasks
- **Validates Configurations**: Reviews your existing configuration against best practices
- **References Documentation**: Cites official documentation when providing recommendations
- **Suggests Improvements**: Identifies configuration issues and suggests fixes
- **Compares Configurations**: Compares YAML files to database state to identify drift

### When to Use the AI Assistant

The AI Assistant is helpful when:

- **Setting Up New Projects**: You need guidance on configuring workflows and custom fields
- **Validating Configuration**: You want to ensure your configuration follows best practices
- **Understanding Options**: You need explanations of configuration options and their implications
- **Troubleshooting**: Your configuration isn't working as expected
- **Infrastructure Setup**: You're configuring OAuth, AI Gateway, or other infrastructure components
- **Comparing Configurations**: You want to check if YAML matches database state

### Benefits

- **Faster Configuration**: Get step-by-step guidance instead of reading documentation
- **Best Practices**: AI suggests configurations based on best practices and documentation
- **Error Prevention**: Validates configurations before applying them
- **Documentation Integration**: References official docs for accuracy
- **Context Awareness**: Understands your current configuration state

## Prerequisites

Before using the AI Configuration Assistant:

1. **AI Provider Configuration**: At least one AI provider must be configured (see [AI Providers Integration](/docs/integrations/ai-providers))
   - Can be configured at project level or infrastructure level
   - Supports OpenAI, Anthropic, Google Gemini, and Ollama
2. **Permissions**: You must have permission to use the assistant
   - **Project Assistant**: Admin by default (configurable via project configuration)
   - **Infrastructure Assistant**: System admin only (non-configurable)
3. **Project Access**: For project configuration, you need access to the project

## Accessing the Assistant

### Project Configuration Assistant

1. Navigate to your project
2. Go to **Project Settings**
3. Click **"Ask AI Assistant"** button
4. The chat interface opens with your project's configuration context

**Note**: The button is only visible if:
- ✅ You have permission (Admin by default, or roles allowed by project configuration)
- ✅ AI provider is configured (project-level or infrastructure-level)
- ✅ AI Gateway service is available

### Infrastructure Configuration Assistant

1. Navigate to **Settings** → **Infrastructure** (system admin only)
2. Click **"Ask AI Assistant"** button
3. The chat interface opens with infrastructure configuration context

**Note**: Infrastructure assistant requires system admin role and cannot be configured per-project.

## Using the Assistant

### Starting a Conversation

Type your question or request in natural language. The assistant understands:

- Configuration questions: "How do I set up a Kanban workflow?"
- Validation requests: "Review my project configuration"
- Comparison requests: "Compare my YAML config to the database"
- Infrastructure questions: "How do I configure GitHub OAuth?"
- Best practices: "What custom fields should I add for a software project?"

### Example Questions

**Project Configuration**:
- "How do I set up a Kanban workflow with priority fields?"
- "What custom fields should I add for a software development project?"
- "Review my project configuration and suggest improvements"
- "Compare my YAML configuration to the database settings"
- "Explain what the 'in_progress' status type means"

**Infrastructure Configuration**:
- "How do I configure GitHub OAuth for repository integration?"
- "What environment variables do I need for AI Gateway?"
- "How do I set up OAuth for GitLab?"
- "Explain the precedence order for configuration (env vars vs UI)"

### Conversation Features

#### Message History

- Conversations are automatically saved
- Access previous messages by scrolling up
- Use "Load older messages" button to see conversation history
- Each project/infrastructure context has separate conversation history

#### Session Management

- Recent sessions (last 30 days) are shown in the session list
- Switch between sessions to access different conversations
- Archive or delete old sessions to keep your workspace organized

#### Typing Indicators

- When the assistant is processing your request, you'll see a typing indicator
- Response time is typically 5-30 seconds depending on complexity
- The assistant processes your question, retrieves relevant documentation, and analyzes your configuration

## Common Use Cases

### Use Case 1: Setting Up a New Project

**Scenario**: You're creating a new project and need help configuring it.

**Steps**:
1. Open the assistant in project settings
2. Ask: **"I'm setting up a new software development project. What workflow and custom fields should I use?"**
3. Review the assistant's recommendations
4. Apply suggestions if they match your needs

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

**Steps**:
1. Open the assistant
2. Ask: **"Review my current project configuration"**
3. Review the validation findings
4. Apply suggested improvements if desired

**Example Response**:
```
I've reviewed your configuration. Here's what I found:

✅ Good: You have a clear workflow with appropriate status types
⚠️  Suggestion: Consider adding a "Reopened" status for closed issues that need attention
✅ Good: Custom fields are well-defined
⚠️  Suggestion: The "Priority" field should be marked as required for better triage

Would you like me to suggest specific improvements?
```

### Use Case 3: Applying Configuration Suggestions

**Scenario**: The assistant suggests a configuration change and you want to apply it.

**Steps**:
1. Review the suggestion explanation
2. Check the preview of what will change
3. Click **"Apply"** button
4. If conflicts exist, review the conflict resolution UI
5. Choose resolution strategy: use suggested, keep current, or manual merge
6. Confirm the application

**Conflict Resolution**:
- If the assistant detects conflicts with your current configuration, you'll see a side-by-side comparison
- Red shows current values, green shows suggested values
- Choose to: keep current, use suggested, or manually merge

### Use Case 4: Infrastructure Setup

**Scenario**: You're setting up infrastructure configuration for the first time.

**Steps**:
1. Open the assistant in infrastructure settings (admin only)
2. Ask: **"How do I configure GitHub OAuth for repository integration?"**
3. Follow the step-by-step guidance
4. Test the configuration

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

## Understanding Assistant Responses

### Response Structure

Assistant responses include:

1. **Main Answer**: Direct response to your question
2. **Validation Findings** (if applicable): Issues or suggestions for your configuration
3. **Documentation Links**: References to relevant documentation sections
4. **Configuration Suggestions**: Actionable configuration changes you can apply

### Validation Findings

When the assistant validates your configuration, it provides:

- **Type**: Error, Warning, Info, or Best Practice
- **Severity**: Critical, High, Medium, or Low
- **Path**: Location in configuration (e.g., "workflow.statuses[0]")
- **Message**: Description of the issue
- **Recommendation**: Suggested fix
- **Documentation Link**: Reference to relevant docs

### Configuration Suggestions

When the assistant suggests configuration changes:

- **Type**: What kind of configuration (workflow, custom field, automation rule, etc.)
- **Explanation**: Why this suggestion is recommended
- **Preview**: What the configuration will look like
- **Apply Button**: One-click application (with conflict resolution if needed)

### Documentation References

The assistant references official documentation:

- Links appear in responses for relevant topics
- Click links to view full documentation
- Assistant explains configuration options based on docs
- Ensures accuracy and provides authoritative sources

## Best Practices

### For Project Configuration

- **Start Simple**: Begin with basic workflow, add complexity as needed
- **Use Meaningful Names**: Status and field names should be clear and descriptive
- **Validate Early**: Use assistant to validate before deploying to production
- **Document Custom Fields**: Explain what each custom field is for in your team
- **Review Suggestions**: Always review assistant suggestions before applying
- **Be Specific**: Clear questions get better answers

### For Infrastructure Configuration

- **Use Environment Variables in Production**: More secure and version-controlled
- **Test Connections**: Always test OAuth and AI provider connections
- **Follow Documentation**: Assistant references official docs, follow them
- **Understand Precedence**: Know the order of configuration precedence (env vars > UI)

### For Conversations

- **Provide Context**: Mention your use case (e.g., "for a mobile app team")
- **Ask Follow-ups**: Clarify if you don't understand a suggestion
- **Break Down Complex Questions**: Split complex questions into smaller parts
- **Reference Specific Elements**: Mention specific configuration elements (e.g., "workflow statuses")

## Troubleshooting

### Assistant Not Responding

**Issue**: Assistant doesn't respond or shows error.

**Solutions**:
1. Check AI provider configuration (Infrastructure Settings or Project Settings)
2. Verify AI Gateway is running and accessible
3. Check browser console for errors
4. Try refreshing the page
5. Check if you've exceeded rate limits (20 messages per minute)

### Configuration Suggestions Fail to Apply

**Issue**: Suggestion application fails with validation error.

**Solutions**:
1. Review the error message - it will indicate which field is invalid
2. Check the configuration schema in [Configuration Reference](/docs/configuration/reference)
3. Ask assistant to explain the validation error
4. Manually fix the configuration and try again
5. Review conflict resolution UI if conflicts are detected

### Assistant Doesn't Understand My Question

**Issue**: Assistant provides irrelevant or incorrect responses.

**Solutions**:
1. Rephrase your question more specifically
2. Provide more context about your use case
3. Break complex questions into smaller parts
4. Reference specific configuration elements (e.g., "workflow statuses")
5. Try asking in English (assistant supports English-only for MVP)

### Rate Limit Exceeded

**Issue**: You see "Rate limit exceeded" error.

**Solutions**:
1. Wait for the retry period (shown in error message)
2. Rate limits: 20 messages per minute per user
3. Reduce message frequency if you're sending many requests
4. Contact administrator if you need higher limits

### Missing Documentation References

**Issue**: Assistant mentions documentation but links don't work.

**Solutions**:
1. Documentation is in the `docs/` directory of the repository
2. Check if you're viewing the correct version
3. Report broken links to maintainers
4. Use the assistant to ask about the documentation topic directly

### AI Provider Not Configured

**Issue**: Assistant shows setup instructions instead of chat interface.

**Solutions**:
1. Configure at least one AI provider (see [AI Providers Integration](/docs/integrations/ai-providers))
2. Can be configured at project level or infrastructure level
3. Follow the setup instructions shown in the assistant UI
4. Test the provider connection after configuration

## Advanced Features

### Conversation History

- Conversations are automatically saved per session
- Access previous conversations from the session list
- Each project/infrastructure context has separate conversation history
- Sessions persist for 30 days (shown in recent sessions)
- Archive or delete old sessions to manage storage

### Configuration Comparison

- Compare YAML configuration to database state
- Identify configuration drift
- Get recommendations for reconciliation
- See side-by-side differences with explanations

### Documentation Integration

- Assistant references official documentation automatically
- Click documentation links in responses for more details
- Assistant explains configuration options based on docs
- Ensures recommendations are accurate and authoritative

### Conflict Resolution

- When applying suggestions, conflicts are automatically detected
- Side-by-side diff view shows current vs suggested values
- Choose resolution strategy: keep current, use suggested, or manual merge
- Color-coded display (red for current, green for suggested)

### Session Management

- View recent sessions (last 30 days) in session list
- Switch between sessions to access different conversations
- Archive or delete sessions to keep workspace organized
- Each session maintains its own conversation context

## Performance & Limits

### Response Times

- Typical response time: 5-30 seconds
- Depends on complexity of question and AI provider
- Target: 95% of queries respond within 30 seconds
- Complex analysis (validation, comparison) may take longer

### Rate Limits

- **Per-user limit**: 20 messages per minute (configurable)
- **AI Gateway limit**: 60 requests per minute (shared across all users)
- Rate limit errors include retry-after information
- Limits prevent abuse and protect service availability

### Context Management

- Assistant uses sliding window context (last 20 messages)
- Older messages are excluded to prevent context overflow
- System prompt is always included
- Conversation summaries may be included for very long conversations

## Security & Privacy

### Access Control

- **Project Assistant**: Admin by default, configurable per project
- **Infrastructure Assistant**: System admin only (non-configurable)
- Access control enforced at API level
- Unauthorized users cannot access assistant

### Data Storage

- Conversation history stored in database
- Messages associated with user and project/infrastructure context
- Sessions can be archived or deleted by users
- No sensitive configuration values exposed in responses

### Rate Limiting

- Prevents abuse and DoS attacks
- Per-user limits prevent individual abuse
- AI Gateway limits protect shared service
- Configurable limits allow adjustment for different environments

## Next Steps

- Read the [Configuration Reference](/docs/configuration/reference) for complete schema documentation
- Explore [Configuration Examples](/docs/configuration/examples) for common patterns
- Review [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration) for infrastructure setup
- Check [AI Providers Integration](/docs/integrations/ai-providers) for AI setup details
- Learn about [AI-Powered Issue Triage](/docs/user/ai-triage) for automatic issue prioritization

## Support

If you encounter issues or have questions:

1. Check the troubleshooting section above
2. Review relevant documentation
3. Ask the assistant for help (it can explain its own features!)
4. Report bugs or request features through your project's issue tracker

## Related Features

- **[AI-Powered Issue Triage](/docs/user/ai-triage)**: Automatic priority assignment and team member routing
- **[Configuration Reference](/docs/configuration/reference)**: Complete configuration schema documentation
- **[AI Providers Integration](/docs/integrations/ai-providers)**: Setting up AI providers for assistant features
