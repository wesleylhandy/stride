import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { requireAuth } from '@/middleware/auth';
import { listGitHubRepositories } from '@/lib/integrations/github';
import { listGitLabRepositories } from '@/lib/integrations/gitlab';
import { prisma } from '@stride/database';
import type { SessionPayload } from '@/lib/auth/session';

// Mock dependencies
vi.mock('@/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/integrations/github', () => ({
  listGitHubRepositories: vi.fn(),
}));

vi.mock('@/lib/integrations/gitlab', () => ({
  listGitLabRepositories: vi.fn(),
}));

vi.mock('@stride/database', () => ({
  prisma: {
    repositoryConnection: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/repositories/list', () => {
  const mockSession: SessionPayload = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 for unauthenticated requests', async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new Response(null, { status: 401 })
    );

    const request = new NextRequest('http://localhost/api/repositories/list?type=GitHub&accessToken=token');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should list GitHub repositories successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitHubRepositories).mockResolvedValueOnce({
      repositories: [
        {
          id: 1,
          name: 'repo1',
          full_name: 'owner/repo1',
          html_url: 'https://github.com/owner/repo1',
          clone_url: 'https://github.com/owner/repo1.git',
          default_branch: 'main',
          private: false,
          description: 'Description 1',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'repo2',
          full_name: 'owner/repo2',
          html_url: 'https://github.com/owner/repo2',
          clone_url: 'https://github.com/owner/repo2.git',
          default_branch: 'main',
          private: true,
          description: 'Description 2',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        perPage: 100,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    vi.mocked(prisma.repositoryConnection.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitHub&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.repositories).toHaveLength(2);
    expect(data.repositories[0]).toMatchObject({
      id: '1',
      name: 'repo1',
      fullName: 'owner/repo1',
      url: 'https://github.com/owner/repo1',
      description: 'Description 1',
      private: false,
      defaultBranch: 'main',
      isConnected: false,
    });
    expect(data.pagination).toMatchObject({
      page: 1,
      perPage: 100,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('should list GitLab repositories successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitLabRepositories).mockResolvedValueOnce({
      repositories: [
        {
          id: 1,
          name: 'repo1',
          path_with_namespace: 'owner/repo1',
          web_url: 'https://gitlab.com/owner/repo1',
          http_url_to_repo: 'https://gitlab.com/owner/repo1.git',
          default_branch: 'main',
          visibility: 'public',
          description: 'Description 1',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        perPage: 100,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    vi.mocked(prisma.repositoryConnection.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitLab&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.repositories).toHaveLength(1);
    expect(data.repositories[0]).toMatchObject({
      id: '1',
      name: 'repo1',
      fullName: 'owner/repo1',
      url: 'https://gitlab.com/owner/repo1',
      description: 'Description 1',
      private: false,
      defaultBranch: 'main',
      isConnected: false,
    });
  });

  it('should mark repositories as connected when they exist in database', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitHubRepositories).mockResolvedValueOnce({
      repositories: [
        {
          id: 1,
          name: 'repo1',
          full_name: 'owner/repo1',
          html_url: 'https://github.com/owner/repo1',
          clone_url: 'https://github.com/owner/repo1.git',
          default_branch: 'main',
          private: false,
          description: null,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        perPage: 100,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    vi.mocked(prisma.repositoryConnection.findMany).mockResolvedValueOnce([
      {
        repositoryUrl: 'https://github.com/owner/repo1',
      },
    ] as any);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitHub&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.repositories[0].isConnected).toBe(true);
  });

  it('should handle pagination parameters', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitHubRepositories).mockResolvedValueOnce({
      repositories: [],
      pagination: {
        page: 2,
        perPage: 50,
        total: 100,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      },
    });
    vi.mocked(prisma.repositoryConnection.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitHub&accessToken=test-token&page=2&per_page=50'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(listGitHubRepositories).toHaveBeenCalledWith('test-token', 2, 50);
    const data = await response.json();
    expect(data.pagination).toMatchObject({
      page: 2,
      perPage: 50,
      total: 100,
      totalPages: 2,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('should return 400 for invalid type', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=Invalid&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 400 for missing access token', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitHub'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 500 when GitHub API fails', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitHubRepositories).mockRejectedValueOnce(
      new Error('GitHub API error')
    );

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitHub&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('GitHub API error');
  });

  it('should return 500 when GitLab API fails', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitLabRepositories).mockRejectedValueOnce(
      new Error('GitLab API error')
    );

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitLab&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('GitLab API error');
  });

  it('should handle private repositories correctly', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitHubRepositories).mockResolvedValueOnce({
      repositories: [
        {
          id: 1,
          name: 'private-repo',
          full_name: 'owner/private-repo',
          html_url: 'https://github.com/owner/private-repo',
          clone_url: 'https://github.com/owner/private-repo.git',
          default_branch: 'main',
          private: true,
          description: null,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        perPage: 100,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    vi.mocked(prisma.repositoryConnection.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitHub&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.repositories[0].private).toBe(true);
  });

  it('should handle GitLab private repositories (visibility)', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockSession);
    vi.mocked(listGitLabRepositories).mockResolvedValueOnce({
      repositories: [
        {
          id: 1,
          name: 'private-repo',
          path_with_namespace: 'owner/private-repo',
          web_url: 'https://gitlab.com/owner/private-repo',
          http_url_to_repo: 'https://gitlab.com/owner/private-repo.git',
          default_branch: 'main',
          visibility: 'private',
          description: null,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        perPage: 100,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
    vi.mocked(prisma.repositoryConnection.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest(
      'http://localhost/api/repositories/list?type=GitLab&accessToken=test-token'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.repositories[0].private).toBe(true);
  });
});
