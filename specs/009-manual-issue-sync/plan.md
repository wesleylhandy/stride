# Implementation Plan: Manual Issue Sync for Inactive Webhooks

**Branch**: `009-manual-issue-sync` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-manual-issue-sync/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable project administrators and members to manually synchronize repository issues and security advisories from GitHub, GitLab, and Bitbucket when webhooks are inactive. The system will fetch issues via Git provider APIs, match existing issues to prevent duplicates, and provide progress feedback. Users can sync regular issues and security advisories together (default) or separately, with optional support for closed/archived issues.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: Next.js 16+ (App Router), Prisma ORM, React Server Components  
**Storage**: PostgreSQL (via Prisma), existing `RepositoryConnection` and `Issue` models  
**Testing**: Jest, Playwright (E2E), React Testing Library  
**Target Platform**: Web application (Next.js Server Components + Client Components)  
**Project Type**: Monorepo (Turborepo) with apps/web and packages/  
**Performance Goals**: Sync up to 1,000 issues within 5 minutes, handle pagination for large repositories  
**Constraints**: Must respect Git provider API rate limits, provide async operation support for long-running syncs, maintain 95% duplicate detection accuracy  
**Scale/Scope**: Single repository sync at a time, support repositories with thousands of issues

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### SOLID Principles
- ✅ **Single Responsibility**: Sync service handles sync logic, API clients handle provider communication
- ✅ **Open/Closed**: Extensible via provider-specific sync strategies
- ✅ **Liskov Substitution**: All provider sync implementations follow same interface
- ✅ **Interface Segregation**: Separate interfaces for issue fetching, security advisory fetching, duplicate matching
- ✅ **Dependency Inversion**: Sync service depends on abstract provider interfaces

### Development Principles
- ✅ **DRY**: Reuse existing Git provider integration libraries (`apps/web/src/lib/integrations/github.ts`, `gitlab.ts`)
- ✅ **YAGNI**: Build manual sync only - defer automatic retry scheduling to future enhancement
- ✅ **KISS**: Use existing Prisma models and API route patterns
- ✅ **Composition**: Compose sync operations from smaller, reusable functions

### Code Quality
- ✅ TypeScript strict mode, proper types for Git provider APIs
- ✅ Error handling via try/catch with clear error messages
- ✅ Input validation using Zod schemas
- ✅ Security: Validate user permissions, encrypt access tokens (already handled in RepositoryConnection)

### Architecture Patterns
- ✅ **Repository Pattern**: Use existing `issueRepository` for data access
- ✅ **Service Layer**: Create `IssueSyncService` for business logic
- ✅ **API Routes**: Next.js App Router API routes for sync endpoints

**Gate Status**: ✅ **PASS** - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/009-manual-issue-sync/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.yaml         # OpenAPI specification for sync endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/
├── app/api/projects/[projectId]/repositories/
│   └── [repositoryId]/sync/
│       └── route.ts                    # POST endpoint for triggering sync
├── src/lib/
│   ├── integrations/
│   │   ├── github.ts                   # Extend: Add fetchIssues, fetchSecurityAdvisories
│   │   ├── gitlab.ts                   # Extend: Add fetchIssues, fetchSecurityAdvisories
│   │   └── bitbucket.ts                # Extend: Add fetchIssues (if not exists)
│   └── sync/
│       ├── issue-sync-service.ts       # NEW: Core sync business logic
│       ├── duplicate-matcher.ts        # NEW: Duplicate detection logic
│       ├── rate-limiter.ts             # NEW: Rate limiting handling
│       └── types.ts                    # NEW: TypeScript types for sync operations
├── src/components/features/projects/
│   └── ManualSyncButton.tsx            # NEW: UI component for triggering sync
│   └── SyncProgressDialog.tsx          # NEW: Progress indicator component

packages/database/
└── prisma/
    └── schema.prisma                    # UPDATE: Add external identifier field to Issue (if needed)
```

**Structure Decision**: Extend existing Next.js App Router structure. Sync logic in new `src/lib/sync/` directory following service layer pattern. UI components follow existing feature component patterns. Reuse existing Git provider integration libraries.

## Complexity Tracking

> **No violations detected - this section intentionally left empty**

## Phase Status

### Phase 0: Research ✅ COMPLETE
- ✅ Research.md generated with Git provider API endpoint decisions
- ✅ Duplicate matching strategy documented
- ✅ Rate limiting and pagination handling strategy defined
- ✅ Async operation support approach documented

### Phase 1: Design & Contracts ✅ COMPLETE
- ✅ Data model extensions documented (data-model.md)
- ✅ API contracts defined (contracts/api.yaml)
- ✅ Developer quickstart guide created (quickstart.md)

### Phase 2: Tasks
- ⏳ Pending `/speckit.tasks` command execution
