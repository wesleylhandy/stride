import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { listGitHubRepositories } from "@/lib/integrations/github";
import { listGitLabRepositories } from "@/lib/integrations/gitlab";
import { prisma } from "@stride/database";
import { z } from "zod";
import type { RepositoryInfo, PaginationInfo } from "@/lib/types/repository";

// Re-export types for backward compatibility
export type { RepositoryInfo, PaginationInfo };

const listRepositoriesSchema = z.object({
  type: z.enum(["GitHub", "GitLab"]),
  accessToken: z.string().min(1),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  per_page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 100)),
});

/**
 * GET /api/repositories/list
 * List repositories from git provider
 * 
 * Query parameters:
 * - type: "GitHub" | "GitLab" (required)
 * - accessToken: OAuth access token (required)
 * - page: Page number (optional, default: 1)
 * - per_page: Items per page (optional, default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      type: searchParams.get("type"),
      accessToken: searchParams.get("accessToken"),
      page: searchParams.get("page"),
      per_page: searchParams.get("per_page"),
    };

    const validated = listRepositoriesSchema.parse(params);

    // Fetch repositories from git provider
    let repositories: Array<{
      id: number;
      name: string;
      full_name?: string;
      path_with_namespace?: string;
      html_url?: string;
      web_url?: string;
      description: string | null;
      private: boolean;
      visibility?: string;
      default_branch: string;
      updated_at: string;
    }>;
    let pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };

    if (validated.type === "GitHub") {
      const result = await listGitHubRepositories(
        validated.accessToken,
        validated.page,
        validated.per_page,
      );
      repositories = result.repositories;
      pagination = result.pagination;
    } else {
      // GitLab
      const result = await listGitLabRepositories(
        validated.accessToken,
        undefined, // baseUrl - use default
        validated.page,
        validated.per_page,
      );
      // Map GitLab repositories to match expected structure with private property
      repositories = result.repositories.map((repo) => ({
        ...repo,
        private: repo.visibility === "private",
      }));
      pagination = result.pagination;
    }

    // Get all repository URLs to check for existing connections
    const repositoryUrls = repositories.map((repo) => {
      if (validated.type === "GitHub") {
        return repo.html_url || "";
      } else {
        return repo.web_url || "";
      }
    });

    // Check which repositories are already connected
    const existingConnections = await prisma.repositoryConnection.findMany({
      where: {
        repositoryUrl: {
          in: repositoryUrls.filter((url) => url.length > 0),
        },
      },
      select: {
        repositoryUrl: true,
      },
    });

    const connectedUrls = new Set(
      existingConnections.map((conn) => conn.repositoryUrl),
    );

    // Transform repositories to RepositoryInfo format
    const repositoryInfos: RepositoryInfo[] = repositories.map((repo) => {
      const url =
        validated.type === "GitHub"
          ? repo.html_url || ""
          : repo.web_url || "";
      const fullName =
        validated.type === "GitHub"
          ? repo.full_name || repo.name
          : repo.path_with_namespace || repo.name;
      const isPrivate =
        validated.type === "GitHub"
          ? repo.private
          : repo.visibility === "private";

      return {
        id: repo.id.toString(),
        name: repo.name,
        fullName,
        url,
        description: repo.description,
        private: isPrivate,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        isConnected: connectedUrls.has(url),
      };
    });

    return NextResponse.json({
      repositories: repositoryInfos,
      pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("List repositories error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
