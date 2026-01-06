import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { issueRepository, projectRepository } from "@stride/database";
import {
  createIssueSchema,
  issueFilterSchema,
} from "@/lib/validation/issue";
import {
  canCreateIssue,
  canViewIssue,
} from "@/lib/auth/permissions";
import { z } from "zod";

interface RouteParams {
  params: {
    projectId: string;
  };
}

/**
 * GET /api/projects/[projectId]/issues
 * List issues for a project with optional filtering and pagination
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

    const session = authResult;

    // Check permission to view issues
    if (!canViewIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot view issues" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(params.projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterData: Record<string, unknown> = {
      projectId: params.projectId,
    };

    // Parse filter from query params
    const filterResult = issueFilterSchema.safeParse({
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      priority: searchParams.get("priority") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      cycleId: searchParams.get("cycleId") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
    });

    if (!filterResult.success) {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: filterResult.error.errors },
        { status: 400 },
      );
    }

    const filter = filterResult.data;

    // Handle search query
    if (filter.search) {
      const searchResult = await issueRepository.search(
        params.projectId,
        filter.search,
        {
          page: filter.page,
          pageSize: filter.pageSize,
        },
      );
      return NextResponse.json(searchResult);
    }

    // Build filter object for findManyPaginated
    const issueFilter: Record<string, unknown> = {
      projectId: params.projectId,
    };

    if (filter.status) issueFilter.status = filter.status;
    if (filter.type) issueFilter.type = filter.type;
    if (filter.priority) issueFilter.priority = filter.priority;
    if (filter.assigneeId !== undefined) {
      issueFilter.assigneeId = filter.assigneeId === null ? null : filter.assigneeId;
    }
    if (filter.cycleId !== undefined) {
      issueFilter.cycleId = filter.cycleId === null ? null : filter.cycleId;
    }

    // Get paginated issues
    const result = await issueRepository.findManyPaginated(issueFilter, {
      page: filter.page,
      pageSize: filter.pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("List issues error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/issues
 * Create a new issue
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

    const session = authResult;

    // Check permission to create issues
    if (!canCreateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot create issues" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(params.projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = createIssueSchema.parse({
      ...body,
      projectId: params.projectId,
    });

    // Create issue with reporter ID from session
    const issue = await issueRepository.create({
      ...validated,
      reporterId: session.userId,
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

