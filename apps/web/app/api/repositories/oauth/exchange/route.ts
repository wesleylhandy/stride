import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getGitHubOAuthConfig } from '@/lib/config/git-oauth-config';
import { getGitLabOAuthConfig } from '@/lib/config/git-oauth-config';
import { exchangeGitHubCode, type GitHubOAuthConfig } from '@/lib/integrations/github';
import { exchangeGitLabCode, type GitLabOAuthConfig } from '@/lib/integrations/gitlab';
import { z } from 'zod';

const exchangeSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['GitHub', 'GitLab']),
});

/**
 * POST /api/repositories/oauth/exchange
 * Exchange OAuth code for access token (for import flow)
 * 
 * Request body:
 * - code: OAuth authorization code (required)
 * - type: "GitHub" | "GitLab" (required)
 * 
 * Returns:
 * - accessToken: OAuth access token
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = exchangeSchema.parse(body);

    // Build callback URL (must match OAuth app configuration)
    const requestUrl = new URL(request.url);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin}/api/repositories/oauth/callback`;

    let accessToken: string;

    if (validated.type === 'GitHub') {
      const githubConfig = await getGitHubOAuthConfig();
      if (!githubConfig) {
        return NextResponse.json(
          { error: 'GitHub OAuth configuration not found' },
          { status: 400 },
        );
      }

      const config: GitHubOAuthConfig = {
        clientId: githubConfig.clientId,
        clientSecret: githubConfig.clientSecret,
        redirectUri,
      };

      accessToken = await exchangeGitHubCode(validated.code, config);
    } else {
      // GitLab
      const gitlabConfig = await getGitLabOAuthConfig();
      if (!gitlabConfig) {
        return NextResponse.json(
          { error: 'GitLab OAuth configuration not found' },
          { status: 400 },
        );
      }

      const config: GitLabOAuthConfig = {
        clientId: gitlabConfig.clientId,
        clientSecret: gitlabConfig.clientSecret,
        redirectUri,
        baseUrl: gitlabConfig.baseUrl,
      };

      accessToken = await exchangeGitLabCode(validated.code, config);
    }

    return NextResponse.json({
      accessToken,
      type: validated.type,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }

    console.error('OAuth exchange error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
