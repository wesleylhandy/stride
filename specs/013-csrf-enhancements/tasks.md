# Tasks: CSRF Protection Security Enhancements

**Input**: Design documents from `/specs/013-csrf-enhancements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in specification, but recommended for security-critical code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/src/` for source code, `apps/web/app/api/` for API routes

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment configuration and prerequisites

- [ ] T001 Add CSRF_SECRET environment variable validation in apps/web/src/middleware/csrf.ts
- [ ] T002 [P] Update .env.example with CSRF_SECRET documentation
- [ ] T003 [P] Add CSRF_SECRET to deployment documentation in docs/deployment/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Update SessionPayload interface to include sessionId in apps/web/src/lib/auth/session.ts
- [ ] T005 Modify createSession() to include session database ID in JWT payload in apps/web/src/lib/auth/session.ts
- [ ] T006 Modify verifySession() to extract and return sessionId from JWT in apps/web/src/lib/auth/session.ts

**Checkpoint**: Foundation ready - session ID now available in JWT for CSRF token binding. User story implementation can now begin.

---

## Phase 3: User Story 1 - Enhanced CSRF Token Security (Priority: P1) 🎯 MVP

**Goal**: Implement CSRF token binding to sessions and automatic token rotation on login/logout to prevent token reuse attacks.

**Independent Test**: Perform login/logout operations and verify that CSRF tokens change, and that old tokens become invalid. This delivers enhanced security posture without breaking existing functionality.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Add computeHmac() function for HMAC-SHA256 signature generation in apps/web/src/middleware/csrf.ts
- [ ] T008 [P] [US1] Enhance generateCsrfToken() to accept sessionId parameter and include session binding in apps/web/src/middleware/csrf.ts
- [ ] T009 [P] [US1] Add parseCsrfToken() function to extract sessionId, randomBytes, hmac from token in apps/web/src/middleware/csrf.ts
- [ ] T010 [US1] Add validateTokenBinding() function to check session binding in apps/web/src/middleware/csrf.ts (depends on T007, T009)
- [ ] T011 [US1] Add getSessionIdFromRequest() helper to extract sessionId from JWT in apps/web/src/middleware/csrf.ts (depends on T004, T006)
- [ ] T012 [US1] Enhance verifyCsrfToken() to include session binding validation in apps/web/src/middleware/csrf.ts (depends on T010, T011)
- [ ] T013 [US1] Update csrfMiddleware() to validate session binding for unsafe methods in apps/web/src/middleware/csrf.ts (depends on T012)
- [ ] T014 [US1] Update error response format to structured object with error code, message, and request ID in apps/web/src/middleware/csrf.ts (depends on T013)
- [ ] T015 [US1] Add rotateCsrfToken() export function for use in route handlers in apps/web/src/middleware/csrf.ts (depends on T008)
- [ ] T016 [US1] Integrate rotateCsrfToken() call in login route after session creation in apps/web/app/api/auth/login/route.ts (depends on T015, T005)
- [ ] T017 [US1] Integrate rotateCsrfToken() call in logout route with null sessionId in apps/web/app/api/auth/logout/route.ts (depends on T015)
- [ ] T018 [US1] Add comprehensive logging for CSRF validation failures with security context in apps/web/src/middleware/csrf.ts (depends on T013)

**Checkpoint**: At this point, User Story 1 should be fully functional. CSRF tokens are bound to sessions, rotated on login/logout, and validated with session binding. Test by logging in/out and verifying token rotation.

---

## Phase 4: User Story 2 - Robust Client-Side Token Handling (Priority: P2)

**Goal**: Improve client-side cookie parsing to handle edge cases gracefully, preventing failures that could block legitimate requests.

**Independent Test**: Simulate various cookie formats, malformed values, and edge cases to ensure the client-side parser handles them gracefully without throwing errors.

### Implementation for User Story 2

- [ ] T019 [P] [US2] Improve getCsrfToken() with regex-based cookie parsing in apps/web/src/lib/utils/csrf.ts
- [ ] T020 [US2] Add try-catch around decodeURIComponent() to handle malformed cookie values in apps/web/src/lib/utils/csrf.ts (depends on T019)
- [ ] T021 [US2] Ensure getCsrfToken() returns null gracefully on any parsing error in apps/web/src/lib/utils/csrf.ts (depends on T020)
- [ ] T022 [US2] Verify backward compatibility with existing client-side code using CSRF tokens in apps/web/src/lib/utils/csrf.ts (depends on T021)

**Checkpoint**: At this point, User Story 2 should be complete. Client-side cookie parsing handles all edge cases gracefully. Test by simulating malformed cookies, missing cookies, and URL-encoded values.

---

## Phase 5: User Story 3 - Consistent Security Implementation Across All Endpoints (Priority: P1)

**Goal**: Ensure all API endpoints that perform state-changing operations consistently apply CSRF protection, maintaining uniform security posture.

**Independent Test**: Audit all API endpoints that accept POST, PUT, PATCH, or DELETE methods and verify they all require and validate CSRF tokens. This delivers comprehensive security coverage.

### Implementation for User Story 3

- [ ] T023 [US3] Audit all API route files to identify endpoints accepting POST, PUT, PATCH, DELETE methods
- [ ] T024 [US3] Verify middleware matcher configuration covers all API routes in apps/web/middleware.ts
- [ ] T025 [US3] Test CSRF protection on all identified unsafe method endpoints
- [ ] T026 [US3] Verify webhook endpoints are properly exempted from CSRF protection in apps/web/src/middleware/csrf.ts
- [ ] T027 [US3] Verify safe HTTP methods (GET, HEAD, OPTIONS) are exempted from CSRF protection in apps/web/src/middleware/csrf.ts
- [ ] T028 [US3] Document CSRF protection coverage in SECURITY_ANALYSIS.md

**Checkpoint**: At this point, User Story 3 should be complete. All state-changing endpoints are protected, exemptions are correct, and coverage is documented. Test by attempting requests without CSRF tokens to all endpoints.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T029 [P] Update CSRF_SECURITY_REVIEW.md with implementation status
- [ ] T030 [P] Run quickstart.md validation to ensure setup instructions are accurate
- [ ] T031 Verify all 60+ API endpoints have consistent CSRF protection
- [ ] T032 [P] Add integration tests for login/logout token rotation in apps/web/app/api/auth/__tests__/csrf-rotation.test.ts
- [ ] T033 [P] Add unit tests for token binding and validation in apps/web/src/middleware/__tests__/csrf.test.ts
- [ ] T034 [P] Add E2E tests for full CSRF protection flow in e2e/csrf-protection.spec.ts
- [ ] T035 Code review for security best practices (constant-time comparison, HMAC validation, error handling)
- [ ] T036 Performance validation (token validation overhead < 10ms)
- [ ] T037 Verify zero false positives in CSRF validation (legitimate requests never incorrectly rejected)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (session ID must be in JWT)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 3 (P1) can proceed in parallel after foundational
  - User Story 2 (P2) can proceed independently after foundational
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - Requires: Session ID in JWT (T004-T006)
  - Delivers: Token binding, rotation, session validation
  
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Completely independent
  - Requires: No dependencies on other stories
  - Delivers: Improved client-side cookie parsing
  
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent verification task
  - Requires: CSRF middleware working (from US1)
  - Delivers: Comprehensive endpoint coverage verification

### Within Each User Story

- Core functions before integration functions
- Token generation/parsing before validation
- Validation logic before middleware integration
- Middleware updates before route handler integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel
- **Phase 2**: All tasks are sequential (session ID changes affect JWT structure)
- **Phase 3 (US1)**: T007, T008, T009 can run in parallel (different functions)
- **Phase 4 (US2)**: T019 can start independently, then sequential improvements
- **Phase 5 (US3)**: T023-T027 are mostly sequential (audit → verify → test → document)
- **Phase 6**: T029, T030, T032, T033, T034 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch core function implementations in parallel:
Task: "Add computeHmac() function for HMAC-SHA256 signature generation in apps/web/src/middleware/csrf.ts"
Task: "Enhance generateCsrfToken() to accept sessionId parameter and include session binding in apps/web/src/middleware/csrf.ts"
Task: "Add parseCsrfToken() function to extract sessionId, randomBytes, hmac from token in apps/web/src/middleware/csrf.ts"

# After core functions complete, launch validation functions:
Task: "Add validateTokenBinding() function to check session binding in apps/web/src/middleware/csrf.ts"
Task: "Add getSessionIdFromRequest() helper to extract sessionId from JWT in apps/web/src/middleware/csrf.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (CSRF_SECRET configuration)
2. Complete Phase 2: Foundational (Session ID in JWT) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (Token binding and rotation)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Login → verify token rotates
   - Logout → verify token rotates
   - Old tokens → verify they're rejected
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Improved reliability)
4. Add User Story 3 → Test independently → Deploy/Demo (Comprehensive coverage)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (sequential due to JWT changes)
2. Once Foundational is done:
   - Developer A: User Story 1 (token binding/rotation)
   - Developer B: User Story 2 (client-side improvements)
   - Developer C: User Story 3 (endpoint coverage audit)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Phase 2 (Foundational) is CRITICAL - blocks all user stories
- User Story 1 and User Story 3 are both P1 priority - can be worked on in parallel after foundational
- User Story 2 is P2 priority - can be deferred if needed
- Security is paramount - all token operations must use constant-time algorithms
- Backward compatibility must be maintained - existing client code should continue working
- All 60+ API endpoints must be verified for CSRF protection coverage
