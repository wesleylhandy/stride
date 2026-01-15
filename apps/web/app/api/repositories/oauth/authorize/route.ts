import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getGitHubOAuthConfig } from '@/lib/config/git-oauth-config';
import { getGitLabOAuthConfig } from '@/lib/config/git-oauth-config';
import { getGitHubAuthUrl } from '@/lib/integrations/github';
import { getGitLabAuthUrl } from '@/lib/integrations/gitlab';
import { z } from 'zod';

const authorizeSchema = z.object({
  type: z.enum(['GitHub', 'GitLab']),
  returnTo: z.string().url().optional(),
});

/**
 * GET /api/repositories/oauth/authorize
 * Get OAuth authorization URL for repository import
 * 
 * Query parameters:
 * - type: "GitHub" | "GitLab" (required)
 * - returnTo: Optional return URL after OAuth (must be same origin)
 * 
 * Returns:
 * - authUrl: OAuth authorization URL
 * - state: OAuth state parameter for CSRF protection
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      type: searchParams.get('type'),
      returnTo: searchParams.get('returnTo'),
    };

    const validated = authorizeSchema.parse(params);

    // Validate returnTo URL (prevent open redirect)
    let returnTo: string | undefined;
    if (validated.returnTo) {
      try {
        const returnToUrl = new URL(validated.returnTo);
        const requestUrl = new URL(request.url);
        if (returnToUrl.origin !== requestUrl.origin) {
          return NextResponse.json(
            { error: 'Invalid returnTo URL: must be same origin' },
            { status: 400 },
          );
        }
        returnTo = validated.returnTo;
      } catch {
        return NextResponse.json(
          { error: 'Invalid returnTo URL format' },
          { status: 400 },
        );
      }
    }

    // Generate state parameter (CSRF protection)
    const state = crypto.randomUUID();
    
    // Store state and returnTo in response (client will store in sessionStorage)
    // For import flow, we'll use the import page as returnTo
    const requestUrl = new URL(request.url);
    const defaultReturnTo = `${requestUrl.origin}/projects/import`;
    const finalReturnTo = returnTo || defaultReturnTo;

    // Build callback URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin}/api/repositories/oauth/callback?returnTo=${encodeURIComponent(finalReturnTo)}`;

    let authUrl: string;

    if (validated.type === 'GitHub') {
      const githubConfig = await getGitHubOAuthConfig();
      if (!githubConfig) {
        return NextResponse.json(
          { error: 'GitHub OAuth configuration not found' },
          { status: 400 },
        );
      }

      const config = {
        clientId: githubConfig.clientId,
        clientSecret: githubConfig.clientSecret,
        redirectUri,
      };

      authUrl = getGitHubAuthUrl(config, state);
    } else {
      // GitLab
      const gitlabConfig = await getGitLabOAuthConfig();
      if (!gitlabConfig) {
        return NextResponse.json(
          { error: 'GitLab OAuth configuration not found' },
          { status: 400 },
        );
      }

      const config = {
        clientId: gitlabConfig.clientId,
        clientSecret: gitlabConfig.clientSecret,
        redirectUri,
        baseUrl: gitlabConfig.baseUrl,
      };

      authUrl = getGitLabAuthUrl(config, state);
    }

    return NextResponse.json({
      authUrl,
      state,
      returnTo: finalReturnTo,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }

    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
