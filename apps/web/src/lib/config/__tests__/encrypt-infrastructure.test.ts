import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptGitConfig, encryptAiConfig } from '../encrypt-infrastructure';
import { encrypt } from '../../integrations/storage';

// Mock encryption function
vi.mock('../../integrations/storage', () => ({
  encrypt: vi.fn((text: string) => `encrypted-${text}`),
}));

describe('encrypt-infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encryptGitConfig', () => {
    it('should encrypt GitHub client secret', () => {
      const config = {
        github: {
          clientId: 'github-client-id',
          clientSecret: 'github-secret',
        },
      };

      const result = encryptGitConfig(config);

      expect(result.github?.clientId).toBe('github-client-id');
      expect(result.github?.clientSecret).toBe('encrypted-github-secret');
      expect(encrypt).toHaveBeenCalledWith('github-secret');
    });

    it('should encrypt GitLab client secret', () => {
      const config = {
        gitlab: {
          clientId: 'gitlab-client-id',
          clientSecret: 'gitlab-secret',
          baseUrl: 'https://gitlab.example.com',
        },
      };

      const result = encryptGitConfig(config);

      expect(result.gitlab?.clientId).toBe('gitlab-client-id');
      expect(result.gitlab?.clientSecret).toBe('encrypted-gitlab-secret');
      expect(result.gitlab?.baseUrl).toBe('https://gitlab.example.com');
      expect(encrypt).toHaveBeenCalledWith('gitlab-secret');
    });

    it('should encrypt both GitHub and GitLab secrets', () => {
      const config = {
        github: {
          clientId: 'github-client-id',
          clientSecret: 'github-secret',
        },
        gitlab: {
          clientId: 'gitlab-client-id',
          clientSecret: 'gitlab-secret',
        },
      };

      const result = encryptGitConfig(config);

      expect(result.github?.clientSecret).toBe('encrypted-github-secret');
      expect(result.gitlab?.clientSecret).toBe('encrypted-gitlab-secret');
      expect(encrypt).toHaveBeenCalledTimes(2);
    });

    it('should not encrypt client IDs (not sensitive)', () => {
      const config = {
        github: {
          clientId: 'github-client-id',
          clientSecret: 'github-secret',
        },
      };

      const result = encryptGitConfig(config);

      expect(result.github?.clientId).toBe('github-client-id');
      expect(encrypt).not.toHaveBeenCalledWith('github-client-id');
    });

    it('should handle empty config', () => {
      const config = {};

      const result = encryptGitConfig(config);

      expect(result).toEqual({});
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('should handle config with only GitHub', () => {
      const config = {
        github: {
          clientId: 'github-client-id',
          clientSecret: 'github-secret',
        },
      };

      const result = encryptGitConfig(config);

      expect(result.github).toBeDefined();
      expect(result.gitlab).toBeUndefined();
    });

    it('should handle config with only GitLab', () => {
      const config = {
        gitlab: {
          clientId: 'gitlab-client-id',
          clientSecret: 'gitlab-secret',
        },
      };

      const result = encryptGitConfig(config);

      expect(result.gitlab).toBeDefined();
      expect(result.github).toBeUndefined();
    });
  });

  describe('encryptAiConfig', () => {
    it('should encrypt OpenAI API key', () => {
      const config = {
        openaiApiKey: 'sk-openai-key',
      };

      const result = encryptAiConfig(config);

      expect(result.openaiApiKey).toBe('encrypted-sk-openai-key');
      expect(encrypt).toHaveBeenCalledWith('sk-openai-key');
    });

    it('should encrypt Anthropic API key', () => {
      const config = {
        anthropicApiKey: 'sk-ant-anthropic-key',
      };

      const result = encryptAiConfig(config);

      expect(result.anthropicApiKey).toBe('encrypted-sk-ant-anthropic-key');
      expect(encrypt).toHaveBeenCalledWith('sk-ant-anthropic-key');
    });

    it('should encrypt Google AI API key', () => {
      const config = {
        googleAiApiKey: 'AIza-google-key',
      };

      const result = encryptAiConfig(config);

      expect(result.googleAiApiKey).toBe('encrypted-AIza-google-key');
      expect(encrypt).toHaveBeenCalledWith('AIza-google-key');
    });

    it('should encrypt all API keys', () => {
      const config = {
        openaiApiKey: 'sk-openai-key',
        anthropicApiKey: 'sk-ant-anthropic-key',
        googleAiApiKey: 'AIza-google-key',
      };

      const result = encryptAiConfig(config);

      expect(result.openaiApiKey).toBe('encrypted-sk-openai-key');
      expect(result.anthropicApiKey).toBe('encrypted-sk-ant-anthropic-key');
      expect(result.googleAiApiKey).toBe('encrypted-AIza-google-key');
      expect(encrypt).toHaveBeenCalledTimes(3);
    });

    it('should not encrypt URLs (not sensitive)', () => {
      const config = {
        aiGatewayUrl: 'http://ai-gateway:3001',
        llmEndpoint: 'http://localhost:11434',
      };

      const result = encryptAiConfig(config);

      expect(result.aiGatewayUrl).toBe('http://ai-gateway:3001');
      expect(result.llmEndpoint).toBe('http://localhost:11434');
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('should handle empty config', () => {
      const config = {};

      const result = encryptAiConfig(config);

      expect(result).toEqual({});
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('should handle config with only URLs', () => {
      const config = {
        aiGatewayUrl: 'http://ai-gateway:3001',
        llmEndpoint: 'http://localhost:11434',
      };

      const result = encryptAiConfig(config);

      expect(result.aiGatewayUrl).toBe('http://ai-gateway:3001');
      expect(result.llmEndpoint).toBe('http://localhost:11434');
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('should handle partial config', () => {
      const config = {
        aiGatewayUrl: 'http://ai-gateway:3001',
        openaiApiKey: 'sk-openai-key',
      };

      const result = encryptAiConfig(config);

      expect(result.aiGatewayUrl).toBe('http://ai-gateway:3001');
      expect(result.openaiApiKey).toBe('encrypted-sk-openai-key');
      expect(result.anthropicApiKey).toBeUndefined();
    });
  });
});
