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
import { prisma } from '@stride/database';
import type { Prisma } from '@stride/database';

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

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
 * GET /api/projects/[projectId]/repositories/callback
 * OAuth callback handler for repository connections
 * 
 * Handles OAuth redirects from GitHub/GitLab and creates/updates repository connections.
 * Redirects to returnTo URL (from query param) or default to onboarding/complete.
 * 
 * Note: Repository URL and type should be stored in sessionStorage before OAuth redirect.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { projectId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const returnToRaw = searchParams.get('returnTo') || '/onboarding/complete';
    
    // Validate returnTo to prevent open redirect
    const returnTo = validateReturnToUrl(returnToRaw, request.url) || '/onboarding/complete';
    
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      return redirect(errorUrl.toString());
    }

    if (!code) {
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'missing_code');
      errorUrl.searchParams.set('error_description', 'OAuth authorization code is missing');
      return redirect(errorUrl.toString());
    }

    // Authenticate user (required for creating connection)
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      // Auth failed - redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', request.url);
      return redirect(loginUrl.toString());
    }

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'project_not_found');
      return redirect(errorUrl.toString());
    }

    // Get repository info from query params (can be passed via returnTo)
    // Or we'll need to get it from the OAuth token (more complex)
    const returnToUrl = new URL(returnTo, request.url);
    let repositoryType = returnToUrl.searchParams.get('repositoryType') as 'GitHub' | 'GitLab' | null;
    let repositoryUrl = returnToUrl.searchParams.get('repositoryUrl');

    // If not in URL, try to get from existing connection (for updates)
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
    // For MVP, we require repository URL to be provided before OAuth
    // In the future, we could fetch user's repositories and let them select
    if (!repositoryType || !repositoryUrl) {
      const errorUrl = new URL(returnTo, request.url);
      errorUrl.searchParams.set('error', 'missing_repository_info');
      errorUrl.searchParams.set('error_description', 'Repository URL and type are required. Please provide them before connecting via OAuth.');
      return redirect(errorUrl.toString());
    }

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${projectId}/repositories/callback`;
    let accessToken: string;

    if (repositoryType === 'GitHub') {
      const config: GitHubOAuthConfig = {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        redirectUri,
      };
      accessToken = await exchangeGitHubCode(code, config);
    } else if (repositoryType === 'GitLab') {
      const config: GitLabOAuthConfig = {
        clientId: process.env.GITLAB_CLIENT_ID || '',
        clientSecret: process.env.GITLAB_CLIENT_SECRET || '',
        redirectUri,
        baseUrl: process.env.GITLAB_BASE_URL,
      };
      accessToken = await exchangeGitLabCode(code, config);
    } else {
      const errorUrl = new URL(returnTo, request.url);
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
    const successUrl = new URL(returnTo, request.url);
    successUrl.searchParams.set('success', 'true');
    // Remove repository info from URL for cleaner redirect
    successUrl.searchParams.delete('repositoryType');
    successUrl.searchParams.delete('repositoryUrl');
    return redirect(successUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    const returnToRaw = request.nextUrl.searchParams.get('returnTo') || '/onboarding/complete';
    const returnTo = validateReturnToUrl(returnToRaw, request.url) || '/onboarding/complete';
    const errorUrl = new URL(returnTo, request.url);
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set('error_description', error instanceof Error ? error.message : 'OAuth callback failed');
    return redirect(errorUrl.toString());
  }
}
