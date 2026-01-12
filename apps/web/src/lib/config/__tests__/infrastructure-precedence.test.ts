import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveGitOAuthConfig, resolveAIGatewayConfig, type ResolvedGitConfig, type ResolvedAIConfig } from '../infrastructure-precedence';
import { globalInfrastructureConfigRepository } from '@stride/database';
import { decrypt } from '../../integrations/storage';

// Mock dependencies
vi.mock('@stride/database', () => ({
  globalInfrastructureConfigRepository: {
    get: vi.fn(),
  },
}));

vi.mock('../../integrations/storage', () => ({
  decrypt: vi.fn((text: string) => `decrypted-${text}`),
}));

describe('infrastructure-precedence', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    delete process.env.GITLAB_CLIENT_ID;
    delete process.env.GITLAB_CLIENT_SECRET;
    delete process.env.GITLAB_BASE_URL;
    delete process.env.AI_GATEWAY_URL;
    delete process.env.LLM_ENDPOINT;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveGitOAuthConfig', () => {
    it('should resolve GitHub config from environment variables', async () => {
      process.env.GITHUB_CLIENT_ID = 'env-github-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'env-github-secret';

      const result = await resolveGitOAuthConfig();

      expect(result.github).toEqual({
        clientId: 'env-github-client-id',
        clientSecret: 'env-github-secret',
        source: 'environment',
      });
      expect(globalInfrastructureConfigRepository.get).not.toHaveBeenCalled();
    });

    it('should resolve GitLab config from environment variables', async () => {
      process.env.GITLAB_CLIENT_ID = 'env-gitlab-client-id';
      process.env.GITLAB_CLIENT_SECRET = 'env-gitlab-secret';
      process.env.GITLAB_BASE_URL = 'https://gitlab.example.com';

      const result = await resolveGitOAuthConfig();

      expect(result.gitlab).toEqual({
        clientId: 'env-gitlab-client-id',
        clientSecret: 'env-gitlab-secret',
        baseUrl: 'https://gitlab.example.com',
        source: 'environment',
      });
    });

    it('should resolve GitHub config from database when env vars not set', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {
          github: {
            clientId: 'db-github-client-id',
            clientSecret: 'encrypted-github-secret',
          },
        },
        aiConfig: {},
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolveGitOAuthConfig();

      expect(result.github).toEqual({
        clientId: 'db-github-client-id',
        clientSecret: 'decrypted-encrypted-github-secret',
        source: 'database',
      });
      expect(decrypt).toHaveBeenCalledWith('encrypted-github-secret');
    });

    it('should resolve GitLab config from database when env vars not set', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {
          gitlab: {
            clientId: 'db-gitlab-client-id',
            clientSecret: 'encrypted-gitlab-secret',
            baseUrl: 'https://gitlab.example.com',
          },
        },
        aiConfig: {},
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolveGitOAuthConfig();

      expect(result.gitlab).toEqual({
        clientId: 'db-gitlab-client-id',
        clientSecret: 'decrypted-encrypted-gitlab-secret',
        baseUrl: 'https://gitlab.example.com',
        source: 'database',
      });
    });

    it('should prefer environment variables over database config', async () => {
      process.env.GITHUB_CLIENT_ID = 'env-github-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'env-github-secret';

      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {
          github: {
            clientId: 'db-github-client-id',
            clientSecret: 'encrypted-github-secret',
          },
        },
        aiConfig: {},
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolveGitOAuthConfig();

      expect(result.github?.source).toBe('environment');
      expect(result.github?.clientId).toBe('env-github-client-id');
      expect(globalInfrastructureConfigRepository.get).not.toHaveBeenCalled();
    });

    it('should allow mixed sources (GitHub via env, GitLab via database)', async () => {
      process.env.GITHUB_CLIENT_ID = 'env-github-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'env-github-secret';

      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {
          gitlab: {
            clientId: 'db-gitlab-client-id',
            clientSecret: 'encrypted-gitlab-secret',
          },
        },
        aiConfig: {},
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolveGitOAuthConfig();

      expect(result.github?.source).toBe('environment');
      expect(result.gitlab?.source).toBe('database');
    });

    it('should handle decryption failures gracefully', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {
          github: {
            clientId: 'db-github-client-id',
            clientSecret: 'corrupted-encrypted-secret',
          },
        },
        aiConfig: {},
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decrypt).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await resolveGitOAuthConfig();

      expect(result.github).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt GitHub config:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return empty config when no sources available', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue(null);

      const result = await resolveGitOAuthConfig();

      expect(result.github).toBeUndefined();
      expect(result.gitlab).toBeUndefined();
    });
  });

  describe('resolveAIGatewayConfig', () => {
    it('should resolve config from environment variables', async () => {
      process.env.AI_GATEWAY_URL = 'http://ai-gateway:3001';
      process.env.LLM_ENDPOINT = 'http://localhost:11434';
      process.env.OPENAI_API_KEY = 'sk-env-openai-key';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-anthropic-key';
      process.env.GOOGLE_AI_API_KEY = 'AIza-env-google-key';

      const result = await resolveAIGatewayConfig();

      expect(result).toEqual({
        aiGatewayUrl: 'http://ai-gateway:3001',
        llmEndpoint: 'http://localhost:11434',
        openaiApiKey: 'sk-env-openai-key',
        anthropicApiKey: 'sk-ant-env-anthropic-key',
        googleAiApiKey: 'AIza-env-google-key',
        source: 'environment',
      });
      expect(globalInfrastructureConfigRepository.get).not.toHaveBeenCalled();
    });

    it('should resolve config from database when env vars not set', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {},
        aiConfig: {
          aiGatewayUrl: 'http://ai-gateway:3001',
          llmEndpoint: 'http://localhost:11434',
          openaiApiKey: 'encrypted-openai-key',
          anthropicApiKey: 'encrypted-anthropic-key',
          googleAiApiKey: 'encrypted-google-key',
        },
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolveAIGatewayConfig();

      expect(result).toEqual({
        aiGatewayUrl: 'http://ai-gateway:3001',
        llmEndpoint: 'http://localhost:11434',
        openaiApiKey: 'decrypted-encrypted-openai-key',
        anthropicApiKey: 'decrypted-encrypted-anthropic-key',
        googleAiApiKey: 'decrypted-encrypted-google-key',
        source: 'database',
      });
      expect(decrypt).toHaveBeenCalledTimes(3);
    });

    it('should prefer environment variables over database config', async () => {
      process.env.AI_GATEWAY_URL = 'http://env-ai-gateway:3001';

      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {},
        aiConfig: {
          aiGatewayUrl: 'http://db-ai-gateway:3001',
        },
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolveAIGatewayConfig();

      expect(result.source).toBe('environment');
      expect(result.aiGatewayUrl).toBe('http://env-ai-gateway:3001');
    });

    it('should handle partial environment variables', async () => {
      process.env.AI_GATEWAY_URL = 'http://ai-gateway:3001';
      // Other vars not set

      const result = await resolveAIGatewayConfig();

      expect(result.aiGatewayUrl).toBe('http://ai-gateway:3001');
      expect(result.source).toBe('environment');
      expect(result.llmEndpoint).toBeUndefined();
    });

    it('should handle decryption failures gracefully', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue({
        id: 'config-1',
        gitConfig: {},
        aiConfig: {
          openaiApiKey: 'corrupted-encrypted-key',
        },
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decrypt).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await resolveAIGatewayConfig();

      expect(result.openaiApiKey).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt OpenAI API key:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return default config when no sources available', async () => {
      vi.mocked(globalInfrastructureConfigRepository.get).mockResolvedValue(null);

      const result = await resolveAIGatewayConfig();

      expect(result.source).toBe('default');
      expect(result.aiGatewayUrl).toBeUndefined();
    });
  });
});
