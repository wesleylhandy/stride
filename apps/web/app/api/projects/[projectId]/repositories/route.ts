import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma, projectRepository } from "@stride/database";
import type { Prisma } from "@stride/database";
import { encrypt } from "@/lib/integrations/storage";
import { registerWebhook } from "@/lib/integrations/webhooks";
import { syncConfigFromRepository } from "@/lib/integrations/config-sync";
import {
  getGitHubAuthUrl,
  exchangeGitHubCode,
  type GitHubOAuthConfig,
} from "@/lib/integrations/github";
import {
  getGitLabAuthUrl,
  exchangeGitLabCode,
  type GitLabOAuthConfig,
} from "@/lib/integrations/gitlab";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

const connectRepositorySchema = z.object({
  repositoryUrl: z.string().url("Invalid repository URL"),
  repositoryType: z.enum(["GitHub", "GitLab", "Bitbucket"]),
  accessToken: z.string().optional(), // For direct token connection
  code: z.string().optional(), // For OAuth flow
  state: z.string().optional(), // For OAuth state verification
});

/**
 * GET /api/projects/[projectId]/repositories
 * Get repository connection or initiate OAuth flow
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { projectId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const repositoryType = searchParams.get("type") as
      | "GitHub"
      | "GitLab"
      | "Bitbucket"
      | null;

    // If requesting OAuth URL
    if (action === "oauth" && repositoryType) {
      const state = crypto.randomUUID();
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/projects/${projectId}/repositories/callback`;

      let authUrl: string;

      if (repositoryType === "GitHub") {
        const config: GitHubOAuthConfig = {
          clientId: process.env.GITHUB_CLIENT_ID || "",
          clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
          redirectUri,
        };
        authUrl = getGitHubAuthUrl(config, state);
      } else if (repositoryType === "GitLab") {
        const config: GitLabOAuthConfig = {
          clientId: process.env.GITLAB_CLIENT_ID || "",
          clientSecret: process.env.GITLAB_CLIENT_SECRET || "",
          redirectUri,
          baseUrl: process.env.GITLAB_BASE_URL,
        };
        authUrl = getGitLabAuthUrl(config, state);
      } else {
        return NextResponse.json(
          { error: "Unsupported repository type" },
          { status: 400 },
        );
      }

      return NextResponse.json({ authUrl, state });
    }

    // Get existing repository connection
    const connection = await prisma.repositoryConnection.findFirst({
      where: { projectId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No repository connection found" },
        { status: 404 },
      );
    }

    // Return connection info (without sensitive data)
    return NextResponse.json({
      id: connection.id,
      repositoryUrl: connection.repositoryUrl,
      serviceType: connection.serviceType,
      isActive: connection.isActive,
      lastSyncAt: connection.lastSyncAt,
      createdAt: connection.createdAt,
    });
  } catch (error) {
    console.error("Get repository connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/repositories
 * Connect a repository to a project
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { projectId } = await params;
    const body = await request.json();
    const validated = connectRepositorySchema.parse(body);

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    let accessToken: string;

    // Handle OAuth flow
    if (validated.code) {
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/projects/${projectId}/repositories/callback`;

      if (validated.repositoryType === "GitHub") {
        const config: GitHubOAuthConfig = {
          clientId: process.env.GITHUB_CLIENT_ID || "",
          clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
          redirectUri,
        };
        accessToken = await exchangeGitHubCode(validated.code, config);
      } else if (validated.repositoryType === "GitLab") {
        const config: GitLabOAuthConfig = {
          clientId: process.env.GITLAB_CLIENT_ID || "",
          clientSecret: process.env.GITLAB_CLIENT_SECRET || "",
          redirectUri,
          baseUrl: process.env.GITLAB_BASE_URL,
        };
        accessToken = await exchangeGitLabCode(validated.code, config);
      } else {
        return NextResponse.json(
          { error: "OAuth not supported for this repository type" },
          { status: 400 },
        );
      }
    } else if (validated.accessToken) {
      accessToken = validated.accessToken;
    } else {
      return NextResponse.json(
        { error: "Either accessToken or code must be provided" },
        { status: 400 },
      );
    }

    // Sync configuration from repository
    const { configYaml, config } = await syncConfigFromRepository(
      validated.repositoryType,
      validated.repositoryUrl,
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
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/${validated.repositoryType.toLowerCase()}`;

    // Register webhook
    const webhookResult = await registerWebhook(
      validated.repositoryType,
      validated.repositoryUrl,
      webhookUrl,
      accessToken,
    );

    // Encrypt credentials
    const encryptedToken = encrypt(accessToken);
    const encryptedSecret = encrypt(webhookResult.webhookSecret);

    // Create or update repository connection
    const connection = await prisma.repositoryConnection.upsert({
      where: {
        repositoryUrl: validated.repositoryUrl,
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
        repositoryUrl: validated.repositoryUrl,
        serviceType: validated.repositoryType,
        accessToken: encryptedToken,
        webhookSecret: encryptedSecret,
        webhookId: webhookResult.webhookId,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        id: connection.id,
        repositoryUrl: connection.repositoryUrl,
        serviceType: connection.serviceType,
        isActive: connection.isActive,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Connect repository error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

