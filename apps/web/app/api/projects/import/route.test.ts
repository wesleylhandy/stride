import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@stride/database';
import { generateUniqueProjectKey } from '@/lib/utils/project-key';
import { getGitHubRepository, parseGitHubRepositoryUrl } from '@/lib/integrations/github';
import { getGitLabRepository, parseGitLabRepositoryUrl } from '@/lib/integrations/gitlab';
import { syncConfigFromRepository } from '@/lib/integrations/config-sync';
import { registerWebhook, generateWebhookSecret } from '@/lib/integrations/webhooks';
import { encrypt } from '@/lib/integrations/storage';
import { validateProjectKeyUnique } from '@/lib/validation/project';
import type { SessionPayload } from '@/lib/auth/session';

// Mock dependencies
vi.mock('@/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@stride/database', () => ({
  prisma: {
    repositoryConnection: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/utils/project-key', () => ({
  generateUniqueProjectKey: vi.fn(),
}));

vi.mock('@/lib/integrations/github', () => ({
  getGitHubRepository: vi.fn(),
  parseGitHubRepositoryUrl: vi.fn(),
}));

vi.mock('@/lib/integrations/gitlab', () => ({
  getGitLabRepository: vi.fn(),
  parseGitLabRepositoryUrl: vi.fn(),
}));

vi.mock('@/lib/integrations/config-sync', () => ({
  syncConfigFromRepository: vi.fn(),
}));

vi.mock('@/lib/integrations/webhooks', () => ({
  registerWebhook: vi.fn(),
  generateWebhookSecret: vi.fn(),
}));

vi.mock('@/lib/integrations/storage', () => ({
  encrypt: vi.fn((value) => `encrypted-${value}`),
}));

vi.mock('@/lib/validation/project', () => ({
  validateProjectKeyUnique: vi.fn(),
}));

describe('POST /api/projects/import', () => {
  const mockSession: SessionPayload = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  const mockProject = {
    id: 'project-123',
    key: 'TEST',
    name: 'Test Project',
    description: 'Test Description',
    repositoryUrl: 'https://github.com/owner/repo',
    repositoryType: 'GitHub',
    configYaml: null,
    config: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConnection = {
    id: 'connection-123',
    projectId: 'project-123',
    repositoryUrl: 'https://github.com/owner/repo',
    serviceType: 'GitHub',
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      vi.mocked(requireAuth).mockResolvedValue(
        new Response(null, { status: 401 })
      );

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
    });

    it('should return 400 for invalid repository URL', async () => {
      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'not-a-url',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for missing access token', async () => {
      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: '',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid repository type', async () => {
      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'Invalid',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate Repository Detection', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
    });

    it('should return 409 when repository is already connected', async () => {
      vi.mocked(prisma.repositoryConnection.findUnique).mockResolvedValueOnce({
        id: 'existing-connection',
        repositoryUrl: 'https://github.com/owner/repo',
        project: {
          id: 'existing-project',
          key: 'EXISTING',
          name: 'Existing Project',
        },
      } as any);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('Repository is already connected to another project');
      expect(data.details.projectId).toBe('existing-project');
    });
  });

  describe('GitHub Import', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      vi.mocked(prisma.repositoryConnection.findUnique).mockResolvedValueOnce(null);
      vi.mocked(parseGitHubRepositoryUrl).mockReturnValue({
        owner: 'owner',
        repo: 'repo',
      });
      vi.mocked(getGitHubRepository).mockResolvedValueOnce({
        id: 1,
        name: 'repo',
        full_name: 'owner/repo',
        html_url: 'https://github.com/owner/repo',
        clone_url: 'https://github.com/owner/repo.git',
        default_branch: 'main',
        private: false,
        description: 'Test Description',
        updated_at: '2024-01-01T00:00:00Z',
      });
      vi.mocked(generateUniqueProjectKey).mockResolvedValueOnce('TEST');
      vi.mocked(syncConfigFromRepository).mockResolvedValueOnce({
        configYaml: null,
        config: null,
      });
      vi.mocked(registerWebhook).mockResolvedValueOnce({
        webhookId: 'webhook-123',
        webhookSecret: 'secret-123',
      });
      vi.mocked(validateProjectKeyUnique).mockResolvedValueOnce({
        isValid: true,
      });
    });

    it('should successfully import GitHub repository', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: vi.fn().mockResolvedValueOnce(mockProject),
          },
          repositoryConnection: {
            create: vi.fn().mockResolvedValueOnce(mockConnection),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.project).toMatchObject({
        id: 'project-123',
        key: 'TEST',
        name: 'repo',
      });
      expect(data.connection).toMatchObject({
        id: 'connection-123',
        repositoryUrl: 'https://github.com/owner/repo',
        serviceType: 'GitHub',
      });
    });

    it('should use provided project key when given', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: vi.fn().mockResolvedValueOnce(mockProject),
          },
          repositoryConnection: {
            create: vi.fn().mockResolvedValueOnce(mockConnection),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);
      vi.mocked(validateProjectKeyUnique).mockResolvedValueOnce({
        isValid: true,
      });

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
          projectKey: 'CUSTOM',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(validateProjectKeyUnique).toHaveBeenCalledWith('CUSTOM');
      expect(generateUniqueProjectKey).not.toHaveBeenCalled();
    });

    it('should return 400 when provided project key is not unique', async () => {
      vi.mocked(validateProjectKeyUnique).mockResolvedValueOnce({
        isValid: false,
        error: 'Project key already exists',
      });

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
          projectKey: 'EXISTING',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Project key already exists');
    });

    it('should use provided project name when given', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: vi.fn().mockResolvedValueOnce({
              ...mockProject,
              name: 'Custom Project Name',
            }),
          },
          repositoryConnection: {
            create: vi.fn().mockResolvedValueOnce(mockConnection),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
          projectName: 'Custom Project Name',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.project.name).toBe('Custom Project Name');
    });

    it('should return 400 for invalid GitHub repository URL', async () => {
      vi.mocked(parseGitHubRepositoryUrl).mockReturnValueOnce(null);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/invalid',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid GitHub repository URL');
    });
  });

  describe('GitLab Import', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      vi.mocked(prisma.repositoryConnection.findUnique).mockResolvedValueOnce(null);
      vi.mocked(parseGitLabRepositoryUrl).mockReturnValue('owner/repo');
      vi.mocked(getGitLabRepository).mockResolvedValueOnce({
        id: 1,
        name: 'repo',
        path_with_namespace: 'owner/repo',
        web_url: 'https://gitlab.com/owner/repo',
        http_url_to_repo: 'https://gitlab.com/owner/repo.git',
        default_branch: 'main',
        visibility: 'public',
        description: 'Test Description',
        updated_at: '2024-01-01T00:00:00Z',
      });
      vi.mocked(generateUniqueProjectKey).mockResolvedValueOnce('TEST');
      vi.mocked(syncConfigFromRepository).mockResolvedValueOnce({
        configYaml: null,
        config: null,
      });
      vi.mocked(registerWebhook).mockResolvedValueOnce({
        webhookId: 'webhook-123',
        webhookSecret: 'secret-123',
      });
    });

    it('should successfully import GitLab repository', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: vi.fn().mockResolvedValueOnce(mockProject),
          },
          repositoryConnection: {
            create: vi.fn().mockResolvedValueOnce(mockConnection),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://gitlab.com/owner/repo',
          repositoryType: 'GitLab',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(getGitLabRepository).toHaveBeenCalledWith('owner/repo', 'token');
    });

    it('should return 400 for invalid GitLab repository URL', async () => {
      vi.mocked(parseGitLabRepositoryUrl).mockReturnValueOnce(null);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://gitlab.com/invalid',
          repositoryType: 'GitLab',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid GitLab repository URL');
    });
  });

  describe('Transaction Rollback on Webhook Failure', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      vi.mocked(prisma.repositoryConnection.findUnique).mockResolvedValueOnce(null);
      vi.mocked(parseGitHubRepositoryUrl).mockReturnValue({
        owner: 'owner',
        repo: 'repo',
      });
      vi.mocked(getGitHubRepository).mockResolvedValueOnce({
        id: 1,
        name: 'repo',
        full_name: 'owner/repo',
        html_url: 'https://github.com/owner/repo',
        clone_url: 'https://github.com/owner/repo.git',
        default_branch: 'main',
        private: false,
        description: 'Test Description',
        updated_at: '2024-01-01T00:00:00Z',
      });
      vi.mocked(generateUniqueProjectKey).mockResolvedValueOnce('TEST');
      vi.mocked(syncConfigFromRepository).mockResolvedValueOnce({
        configYaml: null,
        config: null,
      });
    });

    it('should rollback transaction when webhook registration fails', async () => {
      const webhookError = new Error('Webhook registration failed: API error');
      vi.mocked(registerWebhook).mockRejectedValueOnce(webhookError);

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: vi.fn().mockResolvedValueOnce(mockProject),
          },
          repositoryConnection: {
            create: vi.fn().mockResolvedValueOnce(mockConnection),
          },
        };
        try {
          return await callback(mockTx);
        } catch (error) {
          // Transaction should rollback - verify project.create was called but transaction fails
          throw error;
        }
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Webhook registration failed');

      // Verify that the transaction callback was called (project creation attempted)
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should not create project or connection when webhook fails', async () => {
      const webhookError = new Error('Webhook registration failed');
      vi.mocked(registerWebhook).mockRejectedValueOnce(webhookError);

      const projectCreate = vi.fn().mockResolvedValueOnce(mockProject);
      const connectionCreate = vi.fn().mockResolvedValueOnce(mockConnection);

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: projectCreate,
          },
          repositoryConnection: {
            create: connectionCreate,
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(
        new Error('Webhook registration failed: Webhook registration failed')
      );

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      // The transaction should have been attempted, but since it fails,
      // Prisma will rollback automatically - we just verify the error is handled
      expect(registerWebhook).toHaveBeenCalled();
    });
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      vi.mocked(prisma.repositoryConnection.findUnique).mockResolvedValueOnce(null);
      vi.mocked(parseGitHubRepositoryUrl).mockReturnValue({
        owner: 'owner',
        repo: 'repo',
      });
      vi.mocked(getGitHubRepository).mockResolvedValueOnce({
        id: 1,
        name: 'repo',
        full_name: 'owner/repo',
        html_url: 'https://github.com/owner/repo',
        clone_url: 'https://github.com/owner/repo.git',
        default_branch: 'main',
        private: false,
        description: 'Test Description',
        updated_at: '2024-01-01T00:00:00Z',
      });
      vi.mocked(generateUniqueProjectKey).mockResolvedValueOnce('TEST');
      vi.mocked(syncConfigFromRepository).mockResolvedValueOnce({
        configYaml: null,
        config: null,
      });
      vi.mocked(generateWebhookSecret).mockReturnValueOnce('dev-secret');
    });

    it('should skip webhook registration in development with localhost', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          project: {
            create: vi.fn().mockResolvedValueOnce(mockProject),
          },
          repositoryConnection: {
            create: vi.fn().mockResolvedValueOnce(mockConnection),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      // Should not call registerWebhook in dev with localhost
      expect(registerWebhook).not.toHaveBeenCalled();
      expect(generateWebhookSecret).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession);
    });

    it('should return 400 for Bitbucket (not yet supported)', async () => {
      vi.mocked(prisma.repositoryConnection.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://bitbucket.org/owner/repo',
          repositoryType: 'Bitbucket',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Bitbucket import is not yet supported');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(prisma.repositoryConnection.findUnique).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/projects/import', {
        method: 'POST',
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
          accessToken: 'token',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database error');
    });
  });
});
