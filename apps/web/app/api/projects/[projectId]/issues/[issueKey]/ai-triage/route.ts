import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { issueRepository, projectRepository } from '@stride/database';
import { canUseAITriage } from '@/lib/ai/permissions';
import {
  buildIssueContext,
  buildProjectConfigPayload,
  callAIGateway,
  type AIGatewayRequest,
} from '@/lib/ai/triage';
import { selectProviderForProject } from '@/lib/ai/provider-selector';
import type { ProjectConfig } from '@stride/types';

interface RouteParams {
  params: Promise<{
    projectId: string;
    issueKey: string;
  }>;
}

/**
 * POST /api/projects/[projectId]/issues/[issueKey]/ai-triage
 * Analyze issue using AI triage
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId, issueKey } = await params;

    // Verify project exists and get config
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      );
    }

    // Get project config (stored as JSONB, already parsed)
    const projectConfigData = await projectRepository.getConfig(projectId);
    if (!projectConfigData || !projectConfigData.config) {
      return NextResponse.json(
        { error: 'Project configuration not found' },
        { status: 404 },
      );
    }

    // Cast config through unknown first (JSONB is already parsed)
    const projectConfig = projectConfigData.config as unknown as ProjectConfig;

    // Check permission to use AI triage
    if (!canUseAITriage(session.role, projectConfig)) {
      return NextResponse.json(
        { error: 'Permission denied: You do not have permission to use AI triage' },
        { status: 403 },
      );
    }

    // Find issue by key
    const issue = await issueRepository.findByKey(
      projectId,
      issueKey,
    );

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 },
      );
    }

    // Build issue context payload
    const issueContext = await buildIssueContext(issue);

    // Build project config payload
    const projectConfigPayload = buildProjectConfigPayload(projectConfig);

    // Select provider for this project
    const selectedProvider = await selectProviderForProject(projectId);
    
    if (!selectedProvider) {
      return NextResponse.json(
        {
          error: 'No AI provider configured',
          message: 'Please configure an AI provider in Project Settings → Integrations before using AI triage.',
        },
        { status: 400 },
      );
    }

    // Build provider config payload
    const providerConfigPayload = {
      type: selectedProvider.providerType,
      model: selectedProvider.model,
      ...(selectedProvider.apiKey && { apiKey: selectedProvider.apiKey }),
      ...(selectedProvider.endpointUrl && { endpointUrl: selectedProvider.endpointUrl }),
      ...(selectedProvider.authToken && { authToken: selectedProvider.authToken }),
    };

    // Build AI Gateway request
    const gatewayRequest: AIGatewayRequest = {
      issueContext,
      projectConfig: projectConfigPayload,
      providerConfig: providerConfigPayload,
    };

    // Call AI Gateway
    try {
      const result = await callAIGateway(gatewayRequest);

      // Return formatted response
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      // Handle AI Gateway errors
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          return NextResponse.json(
            {
              error: 'AI Gateway request timed out',
              message: 'The AI analysis request took longer than 30 seconds. Please try again.',
            },
            { status: 504 },
          );
        }

        if (error.message.includes('not configured') || error.message.includes('unavailable')) {
          return NextResponse.json(
            {
              error: 'AI Gateway is unavailable',
              message: 'The AI Gateway service is not configured or unavailable. Please check your configuration.',
            },
            { status: 503 },
          );
        }

        if (error.message.includes('Invalid') || error.message.includes('malformed')) {
          return NextResponse.json(
            {
              error: 'Invalid AI Gateway response',
              message: 'The AI Gateway returned an invalid response. Please try again.',
            },
            { status: 502 },
          );
        }

        // Generic error
        console.error('AI Gateway error:', error);
        return NextResponse.json(
          {
            error: 'AI Gateway error',
            message: error.message || 'An error occurred while analyzing the issue.',
          },
          { status: 502 },
        );
      }

      // Unknown error
      console.error('Unknown AI Gateway error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred while analyzing the issue.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('AI triage API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
