import { describe, it, expect } from 'vitest';
import {
  githubOAuthConfigSchema,
  gitLabOAuthConfigSchema,
  gitOAuthConfigSchema,
  type GitHubOAuthConfig,
  type GitLabOAuthConfig,
  type GitOAuthConfig,
} from '../git-oauth-schema';
import { aiGatewayConfigSchema, type AIGatewayConfig } from '../ai-gateway-schema';
import { infrastructureConfigSchema, type InfrastructureConfig } from '../infrastructure-schema';

describe('infrastructure-schema', () => {
  describe('git-oauth-schema', () => {
    describe('githubOAuthConfigSchema', () => {
      it('should validate valid GitHub OAuth config', () => {
        const valid = {
          clientId: 'github-client-id-123',
          clientSecret: 'github-secret-456',
        };

        const result = githubOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(valid);
        }
      });

      it('should reject missing clientId', () => {
        const invalid = {
          clientSecret: 'github-secret-456',
        };

        const result = githubOAuthConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('clientId');
        }
      });

      it('should reject empty clientId', () => {
        const invalid = {
          clientId: '',
          clientSecret: 'github-secret-456',
        };

        const result = githubOAuthConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject missing clientSecret', () => {
        const invalid = {
          clientId: 'github-client-id-123',
        };

        const result = githubOAuthConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('clientSecret');
        }
      });
    });

    describe('gitLabOAuthConfigSchema', () => {
      it('should validate valid GitLab OAuth config with baseUrl', () => {
        const valid = {
          clientId: 'gitlab-client-id-123',
          clientSecret: 'gitlab-secret-456',
          baseUrl: 'https://gitlab.example.com',
        };

        const result = gitLabOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(valid);
        }
      });

      it('should validate valid GitLab OAuth config without baseUrl (uses default)', () => {
        const valid = {
          clientId: 'gitlab-client-id-123',
          clientSecret: 'gitlab-secret-456',
        };

        const result = gitLabOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.baseUrl).toBe('https://gitlab.com');
        }
      });

      it('should reject invalid baseUrl', () => {
        const invalid = {
          clientId: 'gitlab-client-id-123',
          clientSecret: 'gitlab-secret-456',
          baseUrl: 'not-a-valid-url',
        };

        const result = gitLabOAuthConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('URL');
        }
      });

      it('should reject missing required fields', () => {
        const invalid = {
          clientId: 'gitlab-client-id-123',
          // Missing clientSecret
        };

        const result = gitLabOAuthConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });
    });

    describe('gitOAuthConfigSchema', () => {
      it('should validate config with GitHub only', () => {
        const valid = {
          github: {
            clientId: 'github-client-id',
            clientSecret: 'github-secret',
          },
        };

        const result = gitOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate config with GitLab only', () => {
        const valid = {
          gitlab: {
            clientId: 'gitlab-client-id',
            clientSecret: 'gitlab-secret',
          },
        };

        const result = gitOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate config with both GitHub and GitLab', () => {
        const valid = {
          github: {
            clientId: 'github-client-id',
            clientSecret: 'github-secret',
          },
          gitlab: {
            clientId: 'gitlab-client-id',
            clientSecret: 'gitlab-secret',
          },
        };

        const result = gitOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate empty config (both optional)', () => {
        const valid = {};

        const result = gitOAuthConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should reject invalid GitHub config', () => {
        const invalid = {
          github: {
            clientId: '', // Empty
            clientSecret: 'github-secret',
          },
        };

        const result = gitOAuthConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('ai-gateway-schema', () => {
    describe('aiGatewayConfigSchema', () => {
      it('should validate valid AI Gateway config with all fields', () => {
        const valid = {
          aiGatewayUrl: 'http://ai-gateway:3001',
          llmEndpoint: 'http://localhost:11434',
          openaiApiKey: 'sk-openai-key-123',
          anthropicApiKey: 'sk-ant-anthropic-key-456',
          googleAiApiKey: 'AIza-google-key-789',
        };

        const result = aiGatewayConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(valid);
        }
      });

      it('should validate config with only required fields', () => {
        const valid = {
          aiGatewayUrl: 'http://ai-gateway:3001',
        };

        const result = aiGatewayConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate empty config (all optional)', () => {
        const valid = {};

        const result = aiGatewayConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should reject invalid URL format for aiGatewayUrl', () => {
        const invalid = {
          aiGatewayUrl: 'not-a-valid-url',
        };

        const result = aiGatewayConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('URL');
        }
      });

      it('should reject invalid URL format for llmEndpoint', () => {
        const invalid = {
          llmEndpoint: 'not-a-valid-url',
        };

        const result = aiGatewayConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });

      it('should validate OpenAI API key format', () => {
        const valid = {
          openaiApiKey: 'sk-openai-key-123',
        };

        const result = aiGatewayConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate Anthropic API key format', () => {
        const valid = {
          anthropicApiKey: 'sk-ant-anthropic-key-456',
        };

        const result = aiGatewayConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate Google AI API key format', () => {
        const valid = {
          googleAiApiKey: 'AIza-google-key-789',
        };

        const result = aiGatewayConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should reject invalid OpenAI API key format', () => {
        const invalid = {
          openaiApiKey: 'invalid-format',
        };

        const result = aiGatewayConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('format');
        }
      });

      it('should reject invalid Anthropic API key format', () => {
        const invalid = {
          anthropicApiKey: 'invalid-format',
        };

        const result = aiGatewayConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });

      it('should reject invalid Google AI API key format', () => {
        const invalid = {
          googleAiApiKey: 'invalid-format',
        };

        const result = aiGatewayConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('infrastructure-schema', () => {
    describe('infrastructureConfigSchema', () => {
      it('should validate complete infrastructure config', () => {
        const valid: InfrastructureConfig = {
          gitConfig: {
            github: {
              clientId: 'github-client-id',
              clientSecret: 'github-secret',
            },
          },
          aiConfig: {
            aiGatewayUrl: 'http://ai-gateway:3001',
            openaiApiKey: 'sk-openai-key',
          },
        };

        const result = infrastructureConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should validate config with empty gitConfig and aiConfig', () => {
        const valid: InfrastructureConfig = {
          gitConfig: {},
          aiConfig: {},
        };

        const result = infrastructureConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
      });

      it('should use default empty objects when not provided', () => {
        const valid = {};

        const result = infrastructureConfigSchema.safeParse(valid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gitConfig).toEqual({});
          expect(result.data.aiConfig).toEqual({});
        }
      });

      it('should reject invalid gitConfig', () => {
        const invalid = {
          gitConfig: {
            github: {
              clientId: '', // Invalid
              clientSecret: 'github-secret',
            },
          },
          aiConfig: {},
        };

        const result = infrastructureConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });

      it('should reject invalid aiConfig', () => {
        const invalid = {
          gitConfig: {},
          aiConfig: {
            aiGatewayUrl: 'not-a-valid-url', // Invalid
          },
        };

        const result = infrastructureConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
      });
    });
  });
});
