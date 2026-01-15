import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma } from "@stride/database";
import type { Prisma } from "@stride/database";
import { z } from "zod";
import { generateUniqueProjectKey } from "@/lib/utils/project-key";
import { getGitHubRepository, parseGitHubRepositoryUrl } from "@/lib/integrations/github";
import { getGitLabRepository, parseGitLabRepositoryUrl } from "@/lib/integrations/gitlab";
import { syncConfigFromRepository } from "@/lib/integrations/config-sync";
import { registerWebhook, generateWebhookSecret } from "@/lib/integrations/webhooks";
import { encrypt } from "@/lib/integrations/storage";
import { validateProjectKeyUnique } from "@/lib/validation/project";

const importProjectSchema = z.object({
  repositoryUrl: z.string().url("Invalid repository URL"),
  repositoryType: z.enum(["GitHub", "GitLab", "Bitbucket"]),
  accessToken: z.string().min(1, "Access token is required"),
  projectKey: z.string().regex(/^[A-Z0-9]{2,10}$/).optional(),
  projectName: z.string().optional(),
});

/**
 * POST /api/projects/import
 * Import a project from a git repository
 * 
 * Creates a new project with repository connection, configuration sync, and webhook registration
 * All operations are performed in a transaction - if any step fails, the entire import is rolled back
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validated = importProjectSchema.parse(body);

    // Check for duplicate repository connection
    const existingConnection = await prisma.repositoryConnection.findUnique({
      where: {
        repositoryUrl: validated.repositoryUrl,
      },
      include: {
        project: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        {
          error: "Repository is already connected to another project",
          details: {
            projectId: existingConnection.project.id,
            projectKey: existingConnection.project.key,
            projectName: existingConnection.project.name,
          },
        },
        { status: 409 },
      );
    }

    // Fetch repository metadata
    let repoName: string;
    let repoDescription: string | null = null;
    let defaultBranch: string;

    if (validated.repositoryType === "GitHub") {
      const parsed = parseGitHubRepositoryUrl(validated.repositoryUrl);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid GitHub repository URL" },
          { status: 400 },
        );
      }

      const repo = await getGitHubRepository(
        parsed.owner,
        parsed.repo,
        validated.accessToken,
      );
      repoName = repo.name;
      repoDescription = repo.description || null;
      defaultBranch = repo.default_branch;
    } else if (validated.repositoryType === "GitLab") {
      const projectPath = parseGitLabRepositoryUrl(validated.repositoryUrl);
      if (!projectPath) {
        return NextResponse.json(
          { error: "Invalid GitLab repository URL" },
          { status: 400 },
        );
      }

      const repo = await getGitLabRepository(
        projectPath,
        validated.accessToken,
      );
      repoName = repo.name;
      repoDescription = repo.description || null;
      defaultBranch = repo.default_branch;
    } else {
      return NextResponse.json(
        { error: "Bitbucket import is not yet supported" },
        { status: 400 },
      );
    }

    // Generate project key if not provided
    let projectKey = validated.projectKey;
    if (!projectKey) {
      projectKey = await generateUniqueProjectKey(repoName);
    } else {
      // Validate project key uniqueness if provided
      const keyValidation = await validateProjectKeyUnique(projectKey);
      if (!keyValidation.isValid) {
        return NextResponse.json(
          { error: keyValidation.error },
          { status: 400 },
        );
      }
    }

    // Use provided project name or fall back to repository name
    const projectName = validated.projectName || repoName;

    // Sync configuration from repository
    const { configYaml, config } = await syncConfigFromRepository(
      validated.repositoryType,
      validated.repositoryUrl,
      validated.accessToken,
      projectKey,
      projectName,
      defaultBranch,
    );

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.project.create({
        data: {
          key: projectKey!,
          name: projectName,
          description: repoDescription,
          repositoryUrl: validated.repositoryUrl,
          repositoryType: validated.repositoryType,
          configYaml,
          config: config as Prisma.InputJsonValue,
        },
      });

      // Generate webhook URL
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/${validated.repositoryType.toLowerCase()}`;

      // Check if webhook URL is localhost (not accessible from public Internet)
      const isLocalhost = webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1');
      const isDevelopment = process.env.NODE_ENV === 'development';

      // Register webhook (skip in development if localhost - GitHub won't accept it)
      let webhookResult: { webhookId: string; webhookSecret: string };
      if (isDevelopment && isLocalhost) {
        // Skip webhook registration in development with localhost
        // Generate a placeholder secret anyway for consistency
        const webhookSecret = generateWebhookSecret();
        webhookResult = {
          webhookId: 'dev-placeholder', // Placeholder for development
          webhookSecret,
        };
        console.warn(
          `[DEV] Skipping webhook registration for localhost URL: ${webhookUrl}. ` +
          `Webhooks won't work in development. Use a tunnel (ngrok, cloudflared) or deploy to test webhooks.`,
        );
      } else {
        // Register webhook in production or with public URL
        try {
          webhookResult = await registerWebhook(
            validated.repositoryType,
            validated.repositoryUrl,
            webhookUrl,
            validated.accessToken,
          );
        } catch (webhookError) {
          // Webhook registration failure triggers transaction rollback in production
          throw new Error(
            `Webhook registration failed: ${webhookError instanceof Error ? webhookError.message : "Unknown error"}`,
          );
        }
      }

      // Encrypt credentials
      const encryptedToken = encrypt(validated.accessToken);
      const encryptedSecret = encrypt(webhookResult.webhookSecret);

      // Create repository connection
      const connection = await tx.repositoryConnection.create({
        data: {
          projectId: project.id,
          repositoryUrl: validated.repositoryUrl,
          serviceType: validated.repositoryType,
          accessToken: encryptedToken,
          webhookSecret: encryptedSecret,
          webhookId: webhookResult.webhookId === 'dev-placeholder' ? null : webhookResult.webhookId, // Store null for dev placeholder
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      return {
        project,
        connection: {
          id: connection.id,
          repositoryUrl: connection.repositoryUrl,
          serviceType: connection.serviceType,
          isActive: connection.isActive,
          createdAt: connection.createdAt,
        },
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Import project error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
