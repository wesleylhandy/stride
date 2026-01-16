# Research: AI Autotask and Automated Response Improvements

**Feature**: `011-ai-autotask-improvements`  
**Created**: 2026-01-27

## Decisions & Rationale

### 1. Enhanced AI Prompt Engineering Approach

**Decision**: Enhance existing autotask prompt (`packages/ai-gateway/prompts/autotask-prompt.md`) with improved context extraction, confidence scoring, and reasoning requirements rather than creating a new prompt system.

**Rationale**: 
- Existing prompt already has solid foundation with issue type, priority, category frameworks
- Enhancement approach maintains backward compatibility
- Allows incremental improvements without breaking existing functionality

**Alternatives Considered**:
- Complete prompt rewrite: Rejected - too risky, would require extensive retesting
- Separate prompts per use case: Rejected - adds complexity, maintenance burden

### 2. Learning Pattern Storage Architecture

**Decision**: Store learning patterns in PostgreSQL database per project using new `LearningPattern` entity, isolated per project ID.

**Rationale**:
- Database storage provides persistence across restarts (per FR-019 clarification)
- Per-project isolation allows team-specific learning without cross-contamination
- PostgreSQL JSONB support enables flexible pattern storage (trigger conditions, behavior metadata)
- Existing Prisma ORM simplifies data access and migrations

**Alternatives Considered**:
- In-memory storage: Rejected - doesn't persist across restarts, loses learning on restart
- Global shared patterns: Rejected - doesn't allow team-specific customization
- Configuration files (YAML): Rejected - harder to query/filter, less efficient for pattern matching

### 3. Automated Response Generation Strategy

**Decision**: Generate automated responses as issue comments (using existing comment system), with optional field in comment metadata to indicate if content should also appear in description.

**Rationale**:
- Reuses existing comment infrastructure (no new database tables needed)
- Comments provide clear audit trail and chronological context
- Optional description inclusion provides flexibility for users who prefer description updates
- Aligns with existing issue workflow patterns

**Alternatives Considered**:
- Description-only approach: Rejected - loses audit trail, harder to track AI-generated vs manual content
- Separate "AI Insights" UI section: Rejected - adds UI complexity, requires new components

### 4. Confidence Threshold Strategy

**Decision**: Three-tier confidence threshold system: <0.6 request clarification, 0.6-0.75 apply conservative defaults with explanation, >0.75 proceed normally (per FR-007 clarification).

**Rationale**:
- Balanced approach prevents excessive user interruption while avoiding incorrect assumptions
- Clear thresholds enable consistent behavior and testability
- Conservative defaults with explanation maintain transparency even when confidence is moderate

**Alternatives Considered**:
- Single threshold: Rejected - too simplistic, doesn't handle moderate confidence cases well
- Always request clarification below threshold: Rejected - too disruptive, slows workflow
- Always apply defaults: Rejected - risks incorrect categorizations when confidence is low

### 5. Feedback Collection Mechanism

**Decision**: Manual "Learn from this" button with explicit user opt-in, rather than automatic feedback detection.

**Rationale**:
- Gives users control over what AI learns (per FR-022 clarification)
- Prevents learning from accidental or incorrect corrections
- Reduces risk of learning from edge cases or temporary workarounds
- Explicit opt-in builds trust in AI learning system

**Alternatives Considered**:
- Automatic override detection: Rejected - may learn from mistakes or temporary fixes
- Hybrid approach (auto-detect + manual confirmation): Rejected - adds complexity, manual-only is clearer intent

### 6. Sensitive Information Detection

**Decision**: Implement regex-based detection for common credential patterns (API keys, tokens, passwords) combined with keyword matching, flag for manual review and hide issue from public view (admin-only visibility until reviewed) (per FR-013 clarification).

**Rationale**:
- Regex patterns for common credential formats (e.g., `sk-.*`, `ghp_.*`, `AIza.*`) catch most cases
- Keyword matching catches references even if format varies
- Flagging with admin-only visibility prevents exposure while allowing review
- Manual review ensures human judgment for edge cases
- Prevents false positives from auto-redaction (which could hide legitimate code examples)

**Alternatives Considered**:
- Auto-redaction: Rejected - risk of false positives hiding legitimate content
- Flag but keep visible: Rejected - still exposes sensitive information before review
- No detection: Rejected - security risk, credentials could be exposed in issues
- ML-based detection: Rejected - overkill for MVP, regex + keywords sufficient

### 7. Context Extraction Enhancement

**Decision**: Enhance existing issue analysis to extract structured context (error traces, stack traces, affected components) using pattern matching and AI extraction, store as structured `IssueContext` entity.

**Rationale**:
- Structured context enables better suggestions and duplicate detection
- Pattern matching for common formats (stack traces, error messages) provides reliable extraction
- AI extraction for unstructured content fills gaps where patterns don't match
- Structured storage enables efficient querying for relationship detection

**Alternatives Considered**:
- Unstructured text only: Rejected - harder to query, less actionable
- AI-only extraction: Rejected - less reliable than pattern matching for common formats
- External service integration: Rejected - adds complexity, most context is in issue description

### 8. Pattern Matching for Learning

**Decision**: Use similarity matching (text similarity for issue descriptions, attribute matching for priority/assignment patterns) combined with pattern triggers (issue type, category, source) to identify when learned patterns apply.

**Rationale**:
- Text similarity (e.g., cosine similarity on issue descriptions) identifies semantically similar issues
- Attribute matching (priority, category, source) identifies structural patterns
- Pattern triggers enable efficient filtering before similarity calculation
- Combined approach balances accuracy with performance

**Alternatives Considered**:
- Exact match only: Rejected - too rigid, won't handle variations in similar issues
- Full ML model: Rejected - overkill for MVP, similarity matching sufficient
- Manual pattern rules: Rejected - doesn't scale, requires ongoing maintenance

### 9. Duplicate Detection Strategy

**Decision**: Detect duplicate and related issues during AI analysis, include suggestions as part of analysis response output. Use text similarity (title + description) combined with extracted context (error traces, stack traces) for detection, with configurable similarity threshold (default 0.8) (per FR-010 clarification).

**Rationale**:
- Detection during AI analysis integrates naturally with existing analysis flow
- Including suggestions in analysis response provides immediate feedback without separate process
- Text similarity on title + description catches obvious duplicates
- Context matching (especially error traces) catches duplicates where description varies
- Configurable threshold allows teams to tune sensitivity
- Efficient enough for real-time analysis during issue creation

**Alternatives Considered**:
- Pre-creation duplicate check: Rejected - adds extra step, duplicates might be detected after analysis reveals context
- Background job scanning: Rejected - delayed feedback, adds complexity
- Hash-based detection: Rejected - too rigid, won't catch similar but not identical duplicates
- ML-based semantic similarity: Rejected - more complex, similarity scores sufficient for MVP
- Manual linking only: Rejected - defeats automation purpose

### 10. Multiple Unrelated Issues Handling

**Decision**: When multiple unrelated issues are detected in a single description, identify all issues, prioritize the most urgent one, and suggest the user split into separate issues (per FR-018 clarification).

**Rationale**:
- Identifies all issues ensures nothing is missed
- Prioritizing most urgent provides immediate actionable information
- Suggesting user split maintains user control and preserves issue history
- Avoids automatic splitting which could fragment conversations incorrectly

**Alternatives Considered**:
- Automatic splitting: Rejected - loses conversation context, may fragment related discussions incorrectly
- Handle as single issue only: Rejected - doesn't address the problem, issues remain unorganized
- Request user clarification first: Rejected - adds friction, delays issue processing

### 11. Performance and Scalability

**Decision**: Use async processing for AI analysis with queue system for high-volume periods, cache learning patterns per project to avoid repeated database queries.

**Rationale**:
- Async processing prevents blocking issue creation during AI analysis
- Queue system ensures fair processing during high-volume periods (per FR-012)
- Pattern caching reduces database load for frequently accessed patterns
- Maintains 5-second target for 95% of requests (per SC-009)

**Alternatives Considered**:
- Synchronous processing: Rejected - would block issue creation, poor user experience
- No caching: Rejected - unnecessary database load, slower response times
- External queue service (Redis, RabbitMQ): Deferred - can add if in-memory queue insufficient
