import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listGitLabRepositories } from './gitlab';
import type { GitLabRepository } from './gitlab';

describe('listGitLabRepositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should list repositories with default pagination', async () => {
    const mockRepositories: GitLabRepository[] = [
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
      {
        id: 2,
        name: 'repo2',
        path_with_namespace: 'owner/repo2',
        web_url: 'https://gitlab.com/owner/repo2',
        http_url_to_repo: 'https://gitlab.com/owner/repo2.git',
        default_branch: 'main',
        visibility: 'private',
        description: 'Description 2',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '2');
    mockHeaders.set('X-Total-Pages', '1');
    mockHeaders.set('X-Next-Page', '');
    mockHeaders.set('X-Prev-Page', '');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitLabRepositories('test-token');

    expect(result.repositories).toEqual(mockRepositories);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.perPage).toBe(100);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://gitlab.com/api/v4/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('should handle custom pagination parameters', async () => {
    const mockRepositories: GitLabRepository[] = [];
    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '0');
    mockHeaders.set('X-Total-Pages', '0');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitLabRepositories('test-token', undefined, 2, 50);

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
    const mockRepositories: GitLabRepository[] = [];
    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '0');
    mockHeaders.set('X-Total-Pages', '0');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitLabRepositories('test-token', undefined, 1, 200);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('per_page=100'),
      expect.anything()
    );
  });

  it('should parse pagination headers correctly', async () => {
    const mockRepositories: GitLabRepository[] = Array(100).fill(null).map((_, i) => ({
      id: i + 1,
      name: `repo${i + 1}`,
      path_with_namespace: `owner/repo${i + 1}`,
      web_url: `https://gitlab.com/owner/repo${i + 1}`,
      http_url_to_repo: `https://gitlab.com/owner/repo${i + 1}.git`,
      default_branch: 'main',
      visibility: 'public',
      description: null,
      updated_at: '2024-01-01T00:00:00Z',
    }));

    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '500');
    mockHeaders.set('X-Total-Pages', '5');
    mockHeaders.set('X-Next-Page', '2');
    mockHeaders.set('X-Prev-Page', '');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitLabRepositories('test-token', undefined, 1, 100);

    expect(result.pagination.total).toBe(500);
    expect(result.pagination.totalPages).toBe(5);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('should handle prev page in headers', async () => {
    const mockRepositories: GitLabRepository[] = [];
    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '500');
    mockHeaders.set('X-Total-Pages', '5');
    mockHeaders.set('X-Next-Page', '3');
    mockHeaders.set('X-Prev-Page', '1');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitLabRepositories('test-token', undefined, 2, 100);

    expect(result.pagination.hasPrev).toBe(true);
    expect(result.pagination.hasNext).toBe(true);
  });

  it('should calculate totalPages when headers are missing', async () => {
    const mockRepositories: GitLabRepository[] = Array(50).fill(null).map((_, i) => ({
      id: i + 1,
      name: `repo${i + 1}`,
      path_with_namespace: `owner/repo${i + 1}`,
      web_url: `https://gitlab.com/owner/repo${i + 1}`,
      http_url_to_repo: `https://gitlab.com/owner/repo${i + 1}.git`,
      default_branch: 'main',
      visibility: 'public',
      description: null,
      updated_at: '2024-01-01T00:00:00Z',
    }));

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(), // No pagination headers
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await listGitLabRepositories('test-token', undefined, 1, 100);

    expect(result.pagination.total).toBe(50);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('should throw error when API request fails', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Unauthorized',
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await expect(listGitLabRepositories('invalid-token')).rejects.toThrow(
      'GitLab API error: Unauthorized'
    );
  });

  it('should include correct query parameters', async () => {
    const mockRepositories: GitLabRepository[] = [];
    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '0');
    mockHeaders.set('X-Total-Pages', '0');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitLabRepositories('test-token', undefined, 2, 50);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const url = fetchCall[0] as string;
    const urlObj = new URL(url);

    expect(urlObj.searchParams.get('page')).toBe('2');
    expect(urlObj.searchParams.get('per_page')).toBe('50');
    expect(urlObj.searchParams.get('order_by')).toBe('updated_at');
    expect(urlObj.searchParams.get('sort')).toBe('desc');
    expect(urlObj.searchParams.get('membership')).toBe('true');
  });

  it('should use correct authorization header', async () => {
    const mockRepositories: GitLabRepository[] = [];
    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '0');
    mockHeaders.set('X-Total-Pages', '0');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitLabRepositories('my-access-token');

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const options = fetchCall[1] as RequestInit;

    expect(options.headers).toMatchObject({
      Authorization: 'Bearer my-access-token',
    });
  });

  it('should support custom baseUrl for self-hosted GitLab', async () => {
    const mockRepositories: GitLabRepository[] = [];
    const mockHeaders = new Headers();
    mockHeaders.set('X-Total', '0');
    mockHeaders.set('X-Total-Pages', '0');

    const mockResponse = {
      ok: true,
      json: async () => mockRepositories,
      headers: mockHeaders,
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    await listGitLabRepositories('test-token', 'https://gitlab.example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://gitlab.example.com/api/v4/projects'),
      expect.anything()
    );
  });
});
