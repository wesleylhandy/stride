import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/admin/settings/infrastructure/route';
import { requireAuth } from '@/middleware/auth';
import { globalInfrastructureConfigRepository } from '@stride/database';
import { UserRole } from '@stride/types';
import type { SessionPayload } from '@/lib/auth/session';

// Mock dependencies
vi.mock('@/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@stride/database', () => ({
  globalInfrastructureConfigRepository: {
    get: vi.fn(),
    getOrCreate: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/config/infrastructure-precedence', () => ({
  resolveGitOAuthConfig: vi.fn(),
  resolveAIGatewayConfig: vi.fn(),
}));

vi.mock('@/lib/config/validate-infrastructure', () => ({
  validateInfrastructureConfigStrict: vi.fn(),
  validateInfrastructureConfig: vi.fn(),
}));

vi.mock('@/lib/config/encrypt-infrastructure', () => ({
  encryptGitConfig: vi.fn((config) => config),
  encryptAiConfig: vi.fn((config) => config),
}));

describe('GET /api/admin/settings/infrastructure', () => {
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

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin users', async () => {
    const session: SessionPayload = {
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      role: UserRole.Member,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toContain('Admin access required');
  });

  it('should return configuration for admin users', async () => {
    const session: SessionPayload = {
      id: 'admin-1',
      email: 'admin@example.com',
      username: 'admin',
      role: UserRole.Admin,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const { resolveGitOAuthConfig, resolveAIGatewayConfig } = await import('@/lib/config/infrastructure-precedence');
    
    vi.mocked(resolveGitOAuthConfig).mockResolvedValue({
      github: {
        clientId: 'github-client-id',
        clientSecret: 'github-secret',
        source: 'environment',
      },
    });

    vi.mocked(resolveAIGatewayConfig).mockResolvedValue({
      aiGatewayUrl: 'http://ai-gateway:3001',
      source: 'environment',
    });

    vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.gitConfig.github?.clientId).toBe('github-client-id');
    expect(json.gitConfig.github?.configured).toBe(true);
    expect(json.gitConfig.github?.source).toBe('environment');
    // Secrets should never be exposed
    expect(json.gitConfig.github?.clientSecret).toBeUndefined();
  });

  it('should never expose secrets in response', async () => {
    const session: SessionPayload = {
      id: 'admin-1',
      email: 'admin@example.com',
      username: 'admin',
      role: UserRole.Admin,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const { resolveGitOAuthConfig, resolveAIGatewayConfig } = await import('@/lib/config/infrastructure-precedence');
    
    vi.mocked(resolveGitOAuthConfig).mockResolvedValue({
      github: {
        clientId: 'github-client-id',
        clientSecret: 'github-secret',
        source: 'database',
      },
    });

    vi.mocked(resolveAIGatewayConfig).mockResolvedValue({
      aiGatewayUrl: 'http://ai-gateway:3001',
      openaiApiKey: 'sk-openai-key',
      source: 'database',
    });

    vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    // Verify secrets are never exposed
    expect(json.gitConfig.github?.clientSecret).toBeUndefined();
    expect(json.aiConfig.openaiApiKey).toBeUndefined();
  });
});

describe('PUT /api/admin/settings/infrastructure', () => {
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

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure', {
      method: 'PUT',
      body: JSON.stringify({ gitConfig: {}, aiConfig: {} }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin users', async () => {
    const session: SessionPayload = {
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      role: UserRole.Member,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure', {
      method: 'PUT',
      body: JSON.stringify({ gitConfig: {}, aiConfig: {} }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toContain('Admin access required');
  });

  it('should validate configuration before saving', async () => {
    const session: SessionPayload = {
      id: 'admin-1',
      email: 'admin@example.com',
      username: 'admin',
      role: UserRole.Admin,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const { validateInfrastructureConfigStrict } = await import('@/lib/config/validate-infrastructure');
    vi.mocked(validateInfrastructureConfigStrict).mockImplementation(() => {
      throw new Error('Validation failed');
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure', {
      method: 'PUT',
      body: JSON.stringify({
        gitConfig: { github: { clientId: '', clientSecret: '' } },
        aiConfig: {},
      }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  it('should save valid configuration for admin users', async () => {
    const session: SessionPayload = {
      id: 'admin-1',
      email: 'admin@example.com',
      username: 'admin',
      role: UserRole.Admin,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const { validateInfrastructureConfigStrict } = await import('@/lib/config/validate-infrastructure');
    vi.mocked(validateInfrastructureConfigStrict).mockReturnValue({
      gitConfig: { github: { clientId: 'github-client-id', clientSecret: 'github-secret' } },
      aiConfig: {},
    });

    vi.mocked(globalInfrastructureConfigRepository.getOrCreate).mockResolvedValue({
      id: 'config-1',
      gitConfig: {},
      aiConfig: {},
      updatedBy: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(globalInfrastructureConfigRepository.update).mockResolvedValue({
      id: 'config-1',
      gitConfig: {},
      aiConfig: {},
      updatedBy: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure', {
      method: 'PUT',
      body: JSON.stringify({
        gitConfig: { github: { clientId: 'github-client-id', clientSecret: 'github-secret' } },
        aiConfig: {},
      }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(globalInfrastructureConfigRepository.update).toHaveBeenCalled();
  });

  it('should track updatedBy audit trail', async () => {
    const session: SessionPayload = {
      id: 'admin-1',
      email: 'admin@example.com',
      username: 'admin',
      role: UserRole.Admin,
    };

    vi.mocked(requireAuth).mockResolvedValue(session);

    const { validateInfrastructureConfigStrict } = await import('@/lib/config/validate-infrastructure');
    vi.mocked(validateInfrastructureConfigStrict).mockReturnValue({
      gitConfig: {},
      aiConfig: {},
    });

    vi.mocked(globalInfrastructureConfigRepository.getOrCreate).mockResolvedValue({
      id: 'config-1',
      gitConfig: {},
      aiConfig: {},
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(globalInfrastructureConfigRepository.update).mockResolvedValue({
      id: 'config-1',
      gitConfig: {},
      aiConfig: {},
      updatedBy: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/infrastructure', {
      method: 'PUT',
      body: JSON.stringify({ gitConfig: {}, aiConfig: {} }),
    });

    await PUT(request);

    expect(globalInfrastructureConfigRepository.update).toHaveBeenCalledWith(
      expect.anything(),
      'admin-1'
    );
  });
});
