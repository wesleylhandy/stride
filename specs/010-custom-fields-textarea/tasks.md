# Tasks: Custom Fields Textarea Support

**Input**: Design documents from `/specs/010-custom-fields-textarea/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are included to ensure quality and prevent regression.

**Organization**: Tasks are organized by implementation phase. This is a simple extension feature that builds on existing infrastructure, so no separate setup or foundational phases are needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: User Story 1 - Configure Textarea Custom Field with Markdown Support (Priority: P1)
- Include exact file paths in descriptions

## Phase 1: Schema & Type Updates

**Purpose**: Extend the custom field type enum to support textarea

- [ ] T001 [US1] Add 'textarea' to CustomFieldTypeSchema enum in packages/yaml-config/src/schema.ts
- [ ] T002 [P] [US1] Add unit test for textarea type validation in packages/yaml-config/src/tests/schema.test.ts
- [ ] T003 [P] [US1] Verify TypeScript types auto-update from Zod schema in packages/types/src/project.ts

**Checkpoint**: Schema validation accepts 'textarea' as valid custom field type

---

## Phase 2: Form Rendering

**Purpose**: Add textarea field rendering to issue creation and editing forms

- [ ] T004 [US1] Add 'textarea' case to renderCustomFieldInput switch statement using MarkdownEditor component in packages/ui/src/organisms/IssueForm.tsx
- [ ] T005 [US1] Add 'textarea' case to createFormSchema switch statement (z.string() validation) in packages/ui/src/organisms/IssueForm.tsx
- [ ] T006 [P] [US1] Add unit test for textarea field form rendering in packages/ui/src/organisms/__tests__/IssueForm.test.tsx
- [ ] T007 [P] [US1] Add unit test for textarea field form validation (required/optional) in packages/ui/src/organisms/__tests__/IssueForm.test.tsx

**Checkpoint**: Textarea fields appear in issue forms with markdown editing support

---

## Phase 3: Display Rendering

**Purpose**: Render textarea field values as formatted markdown in issue view

- [ ] T008 [US1] Add 'textarea' case to renderCustomFieldValue function using MarkdownRenderer component in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T009 [P] [US1] Add unit test for textarea field markdown rendering in packages/ui/src/organisms/__tests__/IssueDetail.test.tsx
- [ ] T010 [P] [US1] Add integration test for textarea field display with markdown content in packages/ui/src/organisms/__tests__/IssueDetail.test.tsx

**Checkpoint**: Textarea fields display with markdown rendered as formatted HTML

---

## Phase 4: Documentation

**Purpose**: Update configuration documentation with textarea field type

- [ ] T011 [P] [US1] Add textarea field type description to Custom Field Configuration section in docs/configuration/reference.md
- [ ] T012 [P] [US1] Add YAML example showing textarea field usage in docs/configuration/reference.md
- [ ] T013 [P] [US1] Document markdown support and rendering behavior for textarea fields in docs/configuration/reference.md

**Checkpoint**: Documentation complete with working examples

---

## Phase 5: Integration & Testing

**Purpose**: End-to-end validation and regression testing

- [ ] T014 [US1] Add E2E test for creating issue with textarea custom field in apps/web/e2e/issues.spec.ts
- [ ] T015 [US1] Add E2E test for editing issue with textarea custom field in apps/web/e2e/issues.spec.ts
- [ ] T016 [P] [US1] Add E2E test for markdown rendering in issue view for textarea fields in apps/web/e2e/issues.spec.ts
- [ ] T017 [P] [US1] Add E2E test for required textarea field validation in apps/web/e2e/issues.spec.ts
- [ ] T018 [P] Add regression test verifying existing custom field types (text, number, dropdown, date, boolean) still work in packages/ui/src/organisms/__tests__/IssueForm.test.tsx
- [ ] T019 [P] Add regression test verifying existing custom field types display correctly in packages/ui/src/organisms/__tests__/IssueDetail.test.tsx

**Checkpoint**: All tests pass, no regression in existing functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Schema & Type Updates)**: No dependencies - can start immediately
- **Phase 2 (Form Rendering)**: Depends on Phase 1 completion (needs textarea type in enum)
- **Phase 3 (Display Rendering)**: Depends on Phase 1 completion (needs textarea type in enum)
- **Phase 4 (Documentation)**: Can run in parallel with Phase 2 and 3
- **Phase 5 (Integration & Testing)**: Depends on Phases 1, 2, and 3 completion

### Within Each Phase

- Schema updates before form/display rendering
- Implementation before tests
- Unit tests before integration/E2E tests

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel (different files)
- **Phase 2**: T006 and T007 can run in parallel (different test files)
- **Phase 3**: T009 and T010 can run in parallel (different test files)
- **Phase 4**: All documentation tasks (T011, T012, T013) can run in parallel
- **Phase 5**: T016, T017, T018, T019 can run in parallel (different test files)

---

## Parallel Example: Phase 2

```bash
# Launch all tests for form rendering together:
Task: "Add unit test for textarea field form rendering in packages/ui/src/organisms/__tests__/IssueForm.test.tsx"
Task: "Add unit test for textarea field form validation (required/optional) in packages/ui/src/organisms/__tests__/IssueForm.test.tsx"
```

---

## Implementation Strategy

### MVP Delivery

This feature is a single cohesive unit - all phases are needed for a working feature:

1. Complete Phase 1: Schema & Type Updates → Textarea type recognized
2. Complete Phase 2: Form Rendering → Users can enter markdown in forms
3. Complete Phase 3: Display Rendering → Markdown renders correctly
4. Complete Phase 4: Documentation → Users know how to use it
5. Complete Phase 5: Integration & Testing → Quality assurance

**MVP Complete**: After Phase 3, the feature is functionally complete. Phases 4 and 5 ensure quality and usability.

### Incremental Delivery

Since this is a single user story, incremental delivery means:
- Phase 1 → Validate schema accepts textarea
- Phase 2 → Forms work
- Phase 3 → Display works
- Phase 4 → Documentation complete
- Phase 5 → Fully tested

### Parallel Team Strategy

With multiple developers:

1. **Developer A**: Phase 1 (Schema) → Phase 2 (Form Rendering)
2. **Developer B**: Phase 3 (Display Rendering) - can start after Phase 1
3. **Developer C**: Phase 4 (Documentation) - can start immediately
4. **Developer D**: Phase 5 (Testing) - can start after Phases 2 and 3

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps all tasks to User Story 1 (the only user story)
- This feature extends existing functionality - no new infrastructure needed
- All tasks must maintain backward compatibility with existing custom field types
- TypeScript types auto-update from Zod schema (T003 verifies this)
- MarkdownEditor and MarkdownRenderer components already exist and are tested
- No database schema changes required (customFields is JSONB)
- Verify tests fail before implementing (TDD approach)
- Commit after each phase completion
- Run regression tests (T018, T019) to ensure no breaking changes
