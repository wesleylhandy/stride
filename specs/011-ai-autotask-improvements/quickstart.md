# Quickstart: AI Autotask and Automated Response Improvements

**Feature**: `011-ai-autotask-improvements`  
**Created**: 2026-01-27

## Overview

This feature enhances the existing AI triage system with:
- Improved accuracy through enhanced prompt engineering
- Automated response generation for issues from webhooks and Git syncs
- Learning from team feedback via "Learn from this" button
- Rich context extraction and suggested actions
- Better handling of edge cases with confidence thresholds

## Prerequisites

1. **Existing AI Setup**: AI Gateway service must be running and configured with at least one AI provider (Ollama, OpenAI, Anthropic, or Google Gemini)

2. **Database**: PostgreSQL with existing Stride schema (Issue, Comment, Project tables)

3. **Permissions**: 
   - Project admin access to provide feedback and view learning patterns
   - System admin access to configure AI providers

## Setup Steps

### 1. Database Migration

Run Prisma migration to add new tables and extend existing ones:

```bash
cd packages/database
pnpm db:migrate --name add_ai_autotask_improvements
pnpm db:generate
```

This creates:
- `LearningPattern` table for storing learned patterns per project
- Extends `Comment` table with `isAutomatedResponse`, `includeInDescription`, `aiAnalysisId` fields
- Creates `IssueAnalysisResult` table (optional, can use cache instead for MVP)

### 2. Update AI Gateway

The AI Gateway package (`packages/ai-gateway`) needs enhancements:

- **Enhanced Prompt**: Update `packages/ai-gateway/prompts/autotask-prompt.md` with improved context extraction and confidence scoring requirements
- **Enhanced Response Parser**: Update `packages/ai-gateway/src/lib/response-parser.ts` to handle new response fields (extractedContext, suggestedActions, categoryConfidenceBreakdown)

### 3. Backend API Updates

Update existing API routes in `apps/web/app/api/projects/[projectId]/issues/`:

- **Issue Creation**: Modify POST endpoint to trigger automated response generation after AI analysis
- **AI Triage Endpoint**: Enhance `/api/projects/[projectId]/issues/[issueKey]/ai-triage` to return enhanced analysis
- **New Feedback Endpoint**: Add `/api/projects/[projectId]/issues/[issueKey]/ai-triage/feedback` for "Learn from this" functionality

### 4. Frontend Updates

Add UI components in `apps/web/app/projects/[projectId]/issues/[issueKey]/`:

- **"Learn from this" Button**: Add button to issue detail page when AI suggestions are displayed
- **Enhanced AI Analysis Display**: Show confidence scores, extracted context, suggested actions
- **Automated Response Display**: Indicate when comments are AI-generated automated responses

## Usage

### For Users

1. **Automatic Responses**: When issues are created from monitoring webhooks or Git syncs, automated responses are automatically added as comments explaining the issue source and initial assessment.

2. **Manual AI Analysis**: Click "Analyze with AI" button on issue to trigger enhanced analysis with context extraction and suggested actions.

3. **Provide Feedback**: After AI suggests categorization/priority/assignment, click "Learn from this" button when you make corrections. This teaches the AI your team's preferences.

### For Developers

1. **Learning Patterns**: Learning patterns are automatically created when users provide feedback. Patterns are isolated per project and persist across restarts.

2. **Confidence Thresholds**: 
   - Confidence < 0.6: System requests clarification
   - Confidence 0.6-0.75: System applies conservative defaults with explanation
   - Confidence > 0.75: System proceeds normally

3. **Automated Responses**: Generated on issue creation (for webhook/Git sync issues) or on manual AI analysis trigger.

## Testing

### Manual Testing

1. Create issue from Sentry webhook → Verify automated response comment is added
2. Trigger manual AI analysis → Verify enhanced analysis with context extraction
3. Correct AI suggestion → Click "Learn from this" → Verify pattern is created
4. Create similar issue → Verify AI applies learned pattern

### Automated Testing

Unit tests:
- Learning pattern matching logic
- Confidence threshold evaluation
- Context extraction utilities
- Sensitive information detection

Integration tests:
- AI Gateway enhanced analysis flow
- Feedback creation and pattern learning
- Automated response generation
- Issue creation with automated responses

## Troubleshooting

### AI Analysis Not Working

- Verify AI Gateway service is running: `curl http://localhost:3002/health`
- Check AI provider configuration in infrastructure settings
- Verify API keys are correctly configured

### Learning Patterns Not Being Applied

- Check that patterns exist: `GET /api/projects/{projectId}/learning-patterns`
- Verify pattern `triggerConditions` match issue attributes
- Check pattern `confidenceLevel` (only high-confidence patterns are applied automatically)

### Automated Responses Not Generated

- Verify issue source (only webhook/Git sync issues trigger on creation)
- Check AI analysis completed successfully (look for `IssueAnalysisResult` in database)
- Verify comment creation didn't fail (check server logs)

## Next Steps

After setup:
1. Monitor AI accuracy metrics (SC-001, SC-002 from spec)
2. Collect user feedback on automated responses
3. Review learning patterns periodically for quality
4. Adjust confidence thresholds if needed based on team feedback
