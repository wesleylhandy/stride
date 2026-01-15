import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listGitHubRepositories } from './github';
import type { GitHubRepository } from './github';

describe('listGitHubRepositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should list repositories with default pagination', async () => {
    const mockRepositories: GitHubRepository[] = [
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
    ];

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitHubRepositories('test-token');

    expect(result.repositories).toEqual(mockRepositories);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.perPage).toBe(100);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.github.com/user/repos'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token test-token',
        }),
      })
    );
  });

  it('should handle custom pagination parameters', async () => {
    const mockRepositories: GitHubRepository[] = [];
    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitHubRepositories('test-token', 2, 50);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('per_page=50'),
      expect.anything()
    );
  });

  it('should respect max perPage limit of 100', async () => {
    const mockRepositories: GitHubRepository[] = [];
    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitHubRepositories('test-token', 1, 200);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('per_page=100'),
      expect.anything()
    );
  });

  it('should parse Link header for pagination info', async () => {
    const mockRepositories: GitHubRepository[] = Array(100).fill(null).map((_, i) => ({
      id: i + 1,
      name: `repo${i + 1}`,
      full_name: `owner/repo${i + 1}`,
      html_url: `https://github.com/owner/repo${i + 1}`,
      clone_url: `https://github.com/owner/repo${i + 1}.git`,
      default_branch: 'main',
      private: false,
      description: null,
      updated_at: '2024-01-01T00:00:00Z',
    }));

    const linkHeader =
      '<https://api.github.com/user/repos?page=2>; rel="next", ' +
      '<https://api.github.com/user/repos?page=5>; rel="last"';

    const mockHeaders = new Headers();
    mockHeaders.set('Link', linkHeader);

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitHubRepositories('test-token', 1, 100);

    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
    expect(result.pagination.total).toBe(500); // 5 pages * 100 per page
    expect(result.pagination.totalPages).toBe(5);
  });

  it('should handle prev page in Link header', async () => {
    const mockRepositories: GitHubRepository[] = [];
    const linkHeader =
      '<https://api.github.com/user/repos?page=1>; rel="prev", ' +
      '<https://api.github.com/user/repos?page=3>; rel="next"';

    const mockHeaders = new Headers();
    mockHeaders.set('Link', linkHeader);

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitHubRepositories('test-token', 2, 100);

    expect(result.pagination.hasPrev).toBe(true);
    expect(result.pagination.hasNext).toBe(true);
  });

  it('should calculate total when no Link header and not full page', async () => {
    const mockRepositories: GitHubRepository[] = Array(50).fill(null).map((_, i) => ({
      id: i + 1,
      name: `repo${i + 1}`,
      full_name: `owner/repo${i + 1}`,
      html_url: `https://github.com/owner/repo${i + 1}`,
      clone_url: `https://github.com/owner/repo${i + 1}.git`,
      default_branch: 'main',
      private: false,
      description: null,
      updated_at: '2024-01-01T00:00:00Z',
    }));

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitHubRepositories('test-token', 1, 100);

    expect(result.pagination.total).toBe(50);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.pagination.hasNext).toBe(false);
  });

  it('should throw error when API request fails', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Unauthorized',
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await expect(listGitHubRepositories('invalid-token')).rejects.toThrow(
      'GitHub API error: Unauthorized'
    );
  });

  it('should include correct query parameters', async () => {
    const mockRepositories: GitHubRepository[] = [];
    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitHubRepositories('test-token', 2, 50);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const url = fetchCall[0] as string;
    const urlObj = new URL(url);

    expect(urlObj.searchParams.get('page')).toBe('2');
    expect(urlObj.searchParams.get('per_page')).toBe('50');
    expect(urlObj.searchParams.get('type')).toBe('all');
    expect(urlObj.searchParams.get('sort')).toBe('updated');
    expect(urlObj.searchParams.get('direction')).toBe('desc');
  });

  it('should use correct authorization header', async () => {
    const mockRepositories: GitHubRepository[] = [];
    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitHubRepositories('my-access-token');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const options = fetchCall[1] as RequestInit;

    expect(options.headers).toMatchObject({
      Authorization: 'token my-access-token',
      Accept: 'application/vnd.github.v3+json',
    });
  });
});
