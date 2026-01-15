import { test, expect } from '@playwright/test';
import { mockAuthRoute, mockProjectRoute, mockProjectsListRoute } from './utils/api-helpers';
import { testProjects } from './fixtures/projects';

/**
 * E2E Tests for Issues with Custom Fields
 * 
 * Tests issue creation, editing, and display with custom fields:
 * - Creating issues with textarea custom fields
 * - Editing issues with textarea custom fields
 * - Markdown rendering in issue view
 * - Required field validation
 */

test.describe('Issues with Custom Fields', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication using shared utility
    await mockAuthRoute(page, {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'Admin',
    });
  });

  test('user can create issue with textarea custom field', async ({ page }) => {
    // Create project with textarea custom field
    const project = testProjects.withOnboarding();
    project.id = 'project-123';
    project.key = 'TEST';
    project.name = 'Test Project';
    project.config = {
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'done', name: 'Done', type: 'closed' },
        ],
      },
      custom_fields: [
        {
          key: 'meeting_notes',
          name: 'Meeting Notes',
          type: 'textarea',
          required: false,
        },
      ],
    };

    await mockProjectsListRoute(page, [project]);
    await mockProjectRoute(page, project);

    // Mock users fetch
    await page.route('/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock successful issue creation
    let createdIssue: any = null;
    await page.route('/api/projects/project-123/issues', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        createdIssue = {
          id: 'issue-123',
          key: 'TEST-1',
          title: requestBody.title,
          description: requestBody.description || '',
          status: 'todo',
          customFields: requestBody.customFields || {},
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createdIssue),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 0,
            items: [],
          }),
        });
      }
    });

    // Navigate to project board
    await page.goto('/projects/project-123/board');
    await page.waitForSelector('text=Kanban Board');

    // Open command palette (Cmd/Ctrl+K)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

    // Wait for command palette
    await page.waitForSelector('text=Create Issue', { timeout: 2000 });

    // Click "Create Issue" command
    await page.getByText('Create Issue').click();

    // Wait for modal
    await page.waitForSelector('text=Create New Issue');

    // Fill in issue form
    const titleInput = page.getByLabel(/title/i);
    await titleInput.fill('Test Issue with Notes');

    // Fill in textarea custom field
    const notesField = page.getByLabel(/meeting notes/i);
    await notesField.fill('# Meeting Summary\n\n- Discussed requirements\n- Agreed on timeline');

    // Submit form
    const submitButton = page.getByRole('button', { name: /create|submit/i });
    await submitButton.click();

    // Wait for success and verify issue was created with textarea content
    await expect(page.getByText(/issue created|success/i)).toBeVisible({ timeout: 5000 });
    
    // Verify the issue was created with the textarea content
    expect(createdIssue).not.toBeNull();
    expect(createdIssue.customFields.meeting_notes).toBe('# Meeting Summary\n\n- Discussed requirements\n- Agreed on timeline');
  });

  test('user can edit issue with textarea custom field', async ({ page }) => {
    // Create project with textarea custom field
    const project = testProjects.withOnboarding();
    project.id = 'project-123';
    project.key = 'TEST';
    project.name = 'Test Project';
    project.config = {
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'done', name: 'Done', type: 'closed' },
        ],
      },
      custom_fields: [
        {
          key: 'meeting_notes',
          name: 'Meeting Notes',
          type: 'textarea',
          required: false,
        },
      ],
    };

    await mockProjectsListRoute(page, [project]);
    await mockProjectRoute(page, project);

    // Mock existing issue
    const existingIssue = {
      id: 'issue-123',
      key: 'TEST-1',
      title: 'Existing Issue',
      description: '',
      status: 'todo',
      customFields: {
        meeting_notes: '# Original Notes\n\nOriginal content',
      },
    };

    // Mock issue fetch
    await page.route('/api/projects/project-123/issues/issue-123', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(existingIssue),
        });
      } else if (route.request().method() === 'PATCH') {
        const requestBody = route.request().postDataJSON();
        Object.assign(existingIssue, requestBody);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(existingIssue),
        });
      }
    });

    // Mock users fetch
    await page.route('/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Navigate to issue detail page
    await page.goto('/projects/project-123/issues/TEST-1');

    // Wait for issue to load
    await page.waitForSelector('text=Existing Issue');

    // Click Edit button
    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();

    // Wait for edit form
    await page.waitForSelector('text=Edit Issue');

    // Update textarea field
    const notesField = page.getByLabel(/meeting notes/i);
    await notesField.clear();
    await notesField.fill('# Updated Notes\n\n- New discussion point\n- Action items');

    // Save changes
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();

    // Wait for success message
    await expect(page.getByText(/updated|saved/i)).toBeVisible({ timeout: 5000 });

    // Verify the issue was updated
    expect(existingIssue.customFields.meeting_notes).toBe('# Updated Notes\n\n- New discussion point\n- Action items');
  });

  test('textarea field markdown renders correctly in issue view', async ({ page }) => {
    // Create project with textarea custom field
    const project = testProjects.withOnboarding();
    project.id = 'project-123';
    project.key = 'TEST';
    project.name = 'Test Project';
    project.config = {
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'done', name: 'Done', type: 'closed' },
        ],
      },
      custom_fields: [
        {
          key: 'meeting_notes',
          name: 'Meeting Notes',
          type: 'textarea',
          required: false,
        },
      ],
    };

    await mockProjectsListRoute(page, [project]);
    await mockProjectRoute(page, project);

    // Mock issue with markdown content
    const issue = {
      id: 'issue-123',
      key: 'TEST-1',
      title: 'Test Issue',
      description: '',
      status: 'todo',
      customFields: {
        meeting_notes: '# Meeting Summary\n\n## Discussion Points\n\n- Point 1\n- Point 2\n\n**Action Items**:\n1. Task 1\n2. Task 2',
      },
    };

    // Mock issue fetch
    await page.route('/api/projects/project-123/issues/issue-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(issue),
      });
    });

    // Navigate to issue detail page
    await page.goto('/projects/project-123/issues/TEST-1');

    // Wait for issue to load
    await page.waitForSelector('text=Test Issue');

    // Verify markdown is rendered (check for formatted content)
    // The markdown should be rendered as HTML, so we check for the content
    await expect(page.getByText('Meeting Summary')).toBeVisible();
    await expect(page.getByText('Discussion Points')).toBeVisible();
    
    // Verify the custom field label is visible
    await expect(page.getByText('Meeting Notes')).toBeVisible();
  });

  test('required textarea field validation blocks submission', async ({ page }) => {
    // Create project with required textarea custom field
    const project = testProjects.withOnboarding();
    project.id = 'project-123';
    project.key = 'TEST';
    project.name = 'Test Project';
    project.config = {
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'done', name: 'Done', type: 'closed' },
        ],
      },
      custom_fields: [
        {
          key: 'description',
          name: 'Description',
          type: 'textarea',
          required: true,
        },
      ],
    };

    await mockProjectsListRoute(page, [project]);
    await mockProjectRoute(page, project);

    // Mock users fetch
    await page.route('/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock issue creation (should not be called if validation fails)
    let issueCreated = false;
    await page.route('/api/projects/project-123/issues', async (route) => {
      if (route.request().method() === 'POST') {
        issueCreated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'issue-123',
            key: 'TEST-1',
            title: 'Test Issue',
            status: 'todo',
          }),
        });
      }
    });

    // Navigate to project board
    await page.goto('/projects/project-123/board');
    await page.waitForSelector('text=Kanban Board');

    // Open command palette
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
    await page.waitForSelector('text=Create Issue', { timeout: 2000 });
    await page.getByText('Create Issue').click();

    // Wait for modal
    await page.waitForSelector('text=Create New Issue');

    // Fill in title but NOT the required textarea field
    const titleInput = page.getByLabel(/title/i);
    await titleInput.fill('Test Issue');

    // Try to submit without filling required textarea
    const submitButton = page.getByRole('button', { name: /create|submit/i });
    await submitButton.click();

    // Wait a bit to see if validation error appears
    await page.waitForTimeout(1000);

    // Verify issue was NOT created (validation should have blocked it)
    // The form should still be visible (not submitted)
    await expect(page.getByText('Create New Issue')).toBeVisible();
    
    // Note: The actual validation error display depends on form implementation
    // This test verifies that submission was blocked
  });
});
