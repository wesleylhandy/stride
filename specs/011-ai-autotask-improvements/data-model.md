# Data Model: AI Autotask and Automated Response Improvements

**Feature**: `011-ai-autotask-improvements`  
**Created**: 2026-01-27

## Overview

This feature enhances the existing AI triage system with learning patterns, automated responses, and improved context extraction. The data model introduces one new entity (`LearningPattern`) and extends existing entities (`Comment`, `Issue`) with additional fields.

## New Entities

### LearningPattern

Stores patterns learned from team feedback to improve AI suggestions over time. Patterns are isolated per project.

**Fields**:
- `id` (String, UUID, Primary Key): Unique identifier
- `projectId` (String, Foreign Key → Project.id): Project this pattern belongs to (isolated per project per FR-019)
- `patternType` (Enum): Type of pattern learned
  - `PRIORITY_ADJUSTMENT`: Team consistently adjusts priority for certain issue types
  - `ASSIGNMENT_PREFERENCE`: Team assigns certain issue types to specific developers
  - `CATEGORIZATION_CORRECTION`: Team corrects AI categorization for certain patterns
  - `ROUTING_PATTERN`: Team routes issues through specific workflows
- `triggerConditions` (JSONB): Conditions that match this pattern (issue type, category, source, keywords, etc.)
- `suggestedBehavior` (JSONB): What the AI should suggest when pattern matches (priority value, assignee criteria, category, etc.)
- `confidenceLevel` (Float, 0.0-1.0): Confidence in this pattern based on feedback frequency and consistency
- `feedbackCount` (Int): Number of times this pattern was confirmed via "Learn from this"
- `lastAppliedAt` (DateTime?): When this pattern was last applied to an issue analysis
- `createdAt` (DateTime): When pattern was created
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `project` (Many-to-One → Project): Pattern belongs to a specific project

**Indexes**:
- `[projectId]`: Query patterns by project
- `[projectId, patternType]`: Query specific pattern types per project
- `[triggerConditions]` (GIN index on JSONB): Efficient matching of trigger conditions
- `[lastAppliedAt]`: Track recently used patterns

**Validation Rules**:
- `confidenceLevel` must be between 0.0 and 1.0
- `feedbackCount` must be >= 0
- `triggerConditions` must be valid JSON object
- `suggestedBehavior` must be valid JSON object matching pattern type
- `projectId` must reference existing project

**State Transitions**:
- Pattern created with `feedbackCount = 1` when user clicks "Learn from this"
- Pattern `confidenceLevel` increases as `feedbackCount` increases
- Pattern `lastAppliedAt` updated when pattern is matched during issue analysis
- Pattern can be deprecated (soft delete via flag) if no longer matching

## Extended Entities

### Comment (Extended)

Existing `Comment` model extended to support automated responses with optional description field inclusion.

**New Fields**:
- `isAutomatedResponse` (Boolean, default: false): Indicates if comment is an AI-generated automated response
- `includeInDescription` (Boolean, default: false): If true, response content should also appear in issue description (per FR-020)
- `aiAnalysisId` (String?, Foreign Key → IssueAnalysisResult.id): Links comment to AI analysis that generated it (optional, nullable)

**Relationships**:
- `aiAnalysis` (Optional Many-to-One → IssueAnalysisResult): Links to the AI analysis that generated this automated response

**Validation Rules**:
- `isAutomatedResponse = true` implies `isSystem = true` (automated responses are system comments)
- `includeInDescription = true` only valid when `isAutomatedResponse = true`
- `aiAnalysisId` must reference existing IssueAnalysisResult if provided

### Issue (Extended)

Existing `Issue` model may need visibility flag for sensitive information handling (per FR-013 clarification).

**Potential New Fields** (optional, can use existing status or customFields):
- `requiresAdminReview` (Boolean, default: false): Indicates issue contains sensitive information and is hidden from public view until admin review

**Usage**:
- `customFields` (JSONB) can store extracted context (error traces, affected components) as structured data
- `description` can optionally include automated response content when `includeInDescription = true` on associated comment
- `requiresAdminReview = true` hides issue from non-admin users until reviewed (per FR-013 clarification)

## Supporting Entities

### IssueAnalysisResult (New, Transient/Cached)

Enhanced AI analysis output stored temporarily for reference and linking to comments. This may be stored in cache (Redis) or database depending on retention requirements.

**Fields**:
- `id` (String, UUID, Primary Key): Unique identifier
- `issueId` (String, Foreign Key → Issue.id): Issue this analysis belongs to
- `analysisType` (Enum): Type of analysis
  - `INITIAL`: Analysis performed on issue creation
  - `RE_ANALYSIS`: Manual re-analysis triggered by user
- `issueType` (Enum → IssueType): Suggested issue type (Bug, Feature, Task, Epic)
- `priority` (Enum → Priority?): Suggested priority (Low, Medium, High, Critical)
- `urgency` (String): Urgency level (critical, high, medium, low)
- `category` (String): Issue category (bug, feature_request, technical_debt, etc.)
- `sentiment` (String): Sentiment analysis (positive, neutral, negative)
- `customerEmotion` (String): Customer emotion if applicable (calm, frustrated, angry, etc.)
- `keyIssues` (String[]): Array of 1-3 specific key issues extracted
- `technicalExpertiseRequired` (String): Suggested expertise (backend, frontend, devops, etc.)
- `issueSourceLikely` (String): Likely source (monitoring_webhook, git_sync, manual_creation, etc.)
- `suggestedResponseTime` (String): Suggested response time (immediate, urgent, standard, backlog)
- `suggestedAssignee` (String?): Description of who should handle this (natural language)
- `escalationNeeded` (Boolean): Whether escalation is needed
- `monitoringContext` (JSONB): Monitoring-specific context (has error trace, service name, severity)
- `extractedContext` (JSONB): Extracted context (error traces, stack traces, affected components, related issues)
- `relatedIssueKeys` (String[]): Array of related or duplicate issue keys identified during analysis (per FR-010 clarification)
- `multipleIssuesDetected` (Boolean): Whether multiple unrelated issues were detected in description (per FR-018 clarification)
- `multipleIssuesDetails` (JSONB?): Details about multiple issues when detected (array of issue summaries with priorities)
- `suggestedActions` (String[]): Array of suggested next actions
- `reasoning` (String): Explanation of categorization and prioritization logic
- `confidenceScore` (Float, 0.0-1.0): Overall confidence score
- `categoryConfidenceBreakdown` (JSONB): Confidence scores per category option (when ambiguous)
- `clarificationRequested` (Boolean): Whether clarification was requested (confidence < 0.6)
- `createdAt` (DateTime): When analysis was performed

**Relationships**:
- `issue` (Many-to-One → Issue): Analysis belongs to an issue
- `comments` (One-to-Many → Comment): Automated responses generated from this analysis

**Indexes**:
- `[issueId]`: Query analyses by issue
- `[issueId, createdAt]`: Get most recent analysis for an issue
- `[createdAt]`: Query by analysis time

**Validation Rules**:
- `confidenceScore` must be between 0.1 and 1.0 (per autotask prompt validation rules)
- `keyIssues` must contain 1-3 items
- `suggestedActions` can contain 0-3 items
- `categoryConfidenceBreakdown` must be valid JSON object if multiple categories suggested

## Relationships Diagram

```
Project
  ├── LearningPattern[] (1:N) - Patterns learned per project
  └── Issue[]
        ├── IssueAnalysisResult[] (1:N) - Analyses performed on issue
        │     └── Comment[] (1:N) - Automated responses from analysis
        └── Comment[] (1:N) - All comments including automated responses
```

## Data Access Patterns

### Learning Pattern Matching
1. Query `LearningPattern` by `projectId` and `patternType`
2. Match `triggerConditions` (JSONB) against issue attributes using GIN index
3. Order by `confidenceLevel` descending, `feedbackCount` descending
4. Apply first matching pattern or combine multiple patterns

### Automated Response Creation
1. Create `IssueAnalysisResult` after AI analysis completes
2. Generate automated response content based on analysis result
3. Create `Comment` with `isAutomatedResponse = true`, `aiAnalysisId` linking to analysis
4. Optionally update issue `description` if `includeInDescription = true`

### Feedback Learning
1. User clicks "Learn from this" button on issue with AI suggestions
2. Extract pattern from current AI suggestion vs user correction
3. Check if similar pattern exists (match trigger conditions)
4. If exists: increment `feedbackCount`, update `confidenceLevel`, update `triggerConditions`
5. If new: create new `LearningPattern` with `feedbackCount = 1`

## Migration Strategy

1. Add `LearningPattern` table (new entity, no breaking changes)
2. Extend `Comment` table with new fields (`isAutomatedResponse`, `includeInDescription`, `aiAnalysisId`)
3. Create `IssueAnalysisResult` table (optional, can use cache instead for MVP)
4. Add indexes for performance
5. Backfill not required (new features, no existing data to migrate)
