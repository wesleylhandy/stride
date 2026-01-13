import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { projectRepository } from '@stride/database';
import { encrypt } from '@/lib/integrations/storage';
import { registerWebhook } from '@/lib/integrations/webhooks';
import { syncConfigFromRepository } from '@/lib/integrations/config-sync';
import {
  exchangeGitHubCode,
  type GitHubOAuthConfig,
} from '@/lib/integrations/github';
import {
  exchangeGitLabCode,
  type GitLabOAuthConfig,
} from '@/lib/integrations/gitlab';
import {
  getGitHubOAuthConfig,
  getGitLabOAuthConfig,
} from '@/lib/config/git-oauth-config';
import { prisma } from '@stride/database';
import type { Prisma } from '@stride/database';
import { decodeOAuthState, encodeOAuthState, type OAuthState } from '@/lib/integrations/oauth-state';

/**
 * Validate returnTo URL to prevent open redirect attacks
 * Only allows internal URLs (same origin)
 */
function validateReturnToUrl(returnTo: string, requestUrl: string): string | null {
  try {
    const url = new URL(returnTo, requestUrl);
    const requestHost = new URL(requestUrl).host;

    // Only allow same-origin redirects
    if (url.host !== requestHost) {
      return null;
    }

    // Only allow relative paths or same-origin absolute paths
    if (url.origin !== new URL(requestUrl).origin) {
      return null;
    }

    return url.pathname + url.search;
  } catch {
    // Invalid URL format - treat as relative path
    // Check if it starts with / (relative path)
    if (returnTo.startsWith('/')) {
      return returnTo;
    }
    return null;
  }
}

/**
 * GET /api/repositories/oauth/callback
 * Global OAuth callback handler for repository connections
 * 
 * Handles OAuth redirects from GitHub/GitLab and creates/updates repository connections.
 * Project context is encoded in the OAuth state parameter.
 * 
 * State parameter contains: { projectId, returnTo?, repositoryType?, repositoryUrl? }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      // Try to decode state to get returnTo URL
      let returnTo = '/onboarding/complete';
      if (stateParam) {
        const state = decodeOAuthState(stateParam);
        if (state?.returnTo) {
          const validated = validateReturnToUrl(state.returnTo, request.url);
          if (validated) {
            returnTo = validated;
          }
        }
      }
      
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      return redirect(errorUrl.toString());
    }

    if (!code) {
      let returnTo = '/onboarding/complete';
      if (stateParam) {
        const state = decodeOAuthState(stateParam);
        if (state?.returnTo) {
          const validated = validateReturnToUrl(state.returnTo, request.url);
          if (validated) {
            returnTo = validated;
          }
        }
      }
      
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'missing_code');
      errorUrl.searchParams.set('error_description', 'OAuth authorization code is missing');
      return redirect(errorUrl.toString());
    }

    if (!stateParam) {
      const errorUrl = new URL('/onboarding/complete', request.url);
      errorUrl.searchParams.set('error', 'missing_state');
      errorUrl.searchParams.set('error_description', 'OAuth state parameter is missing');
      return redirect(errorUrl.toString());
    }

    // Decode state to get project context
    const state = decodeOAuthState(stateParam);
    if (!state) {
      const errorUrl = new URL('/onboarding/complete', request.url);
      errorUrl.searchParams.set('error', 'invalid_state');
      errorUrl.searchParams.set('error_description', 'Invalid OAuth state parameter');
      return redirect(errorUrl.toString());
    }

    const { projectId, returnTo: stateReturnTo, repositoryType: stateRepositoryType, repositoryUrl: stateRepositoryUrl } = state;
    const returnTo = stateReturnTo || '/onboarding/complete';

    // Validate returnTo to prevent open redirect
    const validatedReturnTo = validateReturnToUrl(returnTo, request.url) || '/onboarding/complete';

    // Authenticate user (required for creating connection)
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      // Auth failed - redirect to login with return URL
      // Preserve the callback URL with state so user can complete OAuth after login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', request.url);
      return redirect(loginUrl.toString());
    }

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const errorUrl = new URL(validatedReturnTo, request.url);
      errorUrl.searchParams.set('error', 'project_not_found');
      return redirect(errorUrl.toString());
    }

    // Get repository info from state or existing connection
    let repositoryType = stateRepositoryType as 'GitHub' | 'GitLab' | null;
    let repositoryUrl = stateRepositoryUrl;

    // If not in state, try to get from existing connection (for updates)
    if (!repositoryType || !repositoryUrl) {
      const existingConnection = await prisma.repositoryConnection.findFirst({
        where: { projectId },
      });
      if (existingConnection) {
        repositoryType = existingConnection.serviceType as 'GitHub' | 'GitLab';
        repositoryUrl = existingConnection.repositoryUrl;
      }
    }

    // If still no repository info, we can't proceed
    if (!repositoryType || !repositoryUrl) {
      const errorUrl = new URL(validatedReturnTo, request.url);
      errorUrl.searchParams.set('error', 'missing_repository_info');
      errorUrl.searchParams.set('error_description', 'Repository URL and type are required. Please provide them before connecting via OAuth.');
      return redirect(errorUrl.toString());
    }

    // Global callback URI (used for OAuth token exchange)
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/repositories/oauth/callback`;
    let accessToken: string;

    if (repositoryType === 'GitHub') {
      // Use global infrastructure config
      // TODO: In the future, support per-project OAuth config with fallback to global
      const githubConfig = await getGitHubOAuthConfig();
      if (!githubConfig) {
        const errorUrl = new URL(validatedReturnTo, request.url);
        errorUrl.searchParams.set('error', 'config_not_found');
        errorUrl.searchParams.set('error_description', 'GitHub OAuth configuration not found');
        return redirect(errorUrl.toString());
      }

      const config: GitHubOAuthConfig = {
        clientId: githubConfig.clientId,
        clientSecret: githubConfig.clientSecret,
        redirectUri,
      };
      accessToken = await exchangeGitHubCode(code, config);
    } else if (repositoryType === 'GitLab') {
      // Use global infrastructure config
      // TODO: In the future, support per-project OAuth config with fallback to global
      const gitlabConfig = await getGitLabOAuthConfig();
      if (!gitlabConfig) {
        const errorUrl = new URL(validatedReturnTo, request.url);
        errorUrl.searchParams.set('error', 'config_not_found');
        errorUrl.searchParams.set('error_description', 'GitLab OAuth configuration not found');
        return redirect(errorUrl.toString());
      }

      const config: GitLabOAuthConfig = {
        clientId: gitlabConfig.clientId,
        clientSecret: gitlabConfig.clientSecret,
        redirectUri,
        baseUrl: gitlabConfig.baseUrl,
      };
      accessToken = await exchangeGitLabCode(code, config);
    } else {
      const errorUrl = new URL(validatedReturnTo, request.url);
      errorUrl.searchParams.set('error', 'unsupported_type');
      return redirect(errorUrl.toString());
    }

    // Sync configuration from repository
    const { configYaml, config } = await syncConfigFromRepository(
      repositoryType,
      repositoryUrl,
      accessToken,
      project.key,
      project.name,
    );

    // Update project with config
    await projectRepository.updateConfig(
      projectId,
      configYaml,
      config as Prisma.JsonValue,
    );

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/${repositoryType.toLowerCase()}`;

    // Register webhook
    const webhookResult = await registerWebhook(
      repositoryType,
      repositoryUrl,
      webhookUrl,
      accessToken,
    );

    // Encrypt credentials
    const encryptedToken = encrypt(accessToken);
    const encryptedSecret = encrypt(webhookResult.webhookSecret);

    // Create or update repository connection
    await prisma.repositoryConnection.upsert({
      where: {
        repositoryUrl,
      },
      update: {
        accessToken: encryptedToken,
        webhookSecret: encryptedSecret,
        webhookId: webhookResult.webhookId,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        projectId,
        repositoryUrl,
        serviceType: repositoryType,
        accessToken: encryptedToken,
        webhookSecret: encryptedSecret,
        webhookId: webhookResult.webhookId,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    // Redirect to returnTo URL with success
    const successUrl = new URL(validatedReturnTo, request.url);
    successUrl.searchParams.set('success', 'true');
    return redirect(successUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Try to decode state for error redirect
    let returnTo = '/onboarding/complete';
    const stateParam = request.nextUrl.searchParams.get('state');
    if (stateParam) {
      const state = decodeOAuthState(stateParam);
      if (state?.returnTo) {
        const validated = validateReturnToUrl(state.returnTo, request.url);
        if (validated) {
          returnTo = validated;
        }
      }
    }
    
    const errorUrl = new URL(returnTo, request.url);
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set('error_description', error instanceof Error ? error.message : 'OAuth callback failed');
    return redirect(errorUrl.toString());
  }
}
