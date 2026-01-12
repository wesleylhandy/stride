import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { UserRole } from "@stride/types";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

const testConnectionSchema = z.object({
  endpointUrl: z.string().url("Invalid endpoint URL"),
  authToken: z.string().optional(),
});

/**
 * POST /api/projects/[projectId]/ai-providers/test-connection
 * Test connection to Ollama endpoint
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
    const { projectId } = await params;

    // Admin-only access
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = testConnectionSchema.parse(body);

    // Test connection to Ollama endpoint
    try {
      const ollamaUrl = new URL(validated.endpointUrl);
      ollamaUrl.pathname = "/api/tags";

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token if provided
      if (validated.authToken) {
        headers["Authorization"] = `Bearer ${validated.authToken}`;
      }

      const response = await fetch(ollamaUrl.toString(), {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000), // 5 second timeout for connection test
      });

      if (!response.ok) {
        return NextResponse.json(
          { 
            success: false,
            error: `Connection test failed: ${response.statusText} (${response.status})` 
          },
          { status: 200 }, // Return 200 so form submission isn't blocked
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Connection test successful" 
      });
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return NextResponse.json(
          { 
            success: false,
            error: "Failed to connect to endpoint. Please check the URL and ensure Ollama is running." 
          },
          { status: 200 }, // Return 200 so form submission isn't blocked
        );
      }

      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { 
            success: false,
            error: "Connection test timed out. Please check the endpoint URL and network connectivity." 
          },
          { status: 200 }, // Return 200 so form submission isn't blocked
        );
      }

      console.error("Connection test error:", error);
      return NextResponse.json(
        { 
          success: false,
          error: "Connection test failed. Please check the endpoint URL and try again." 
        },
        { status: 200 }, // Return 200 so form submission isn't blocked
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 200 }, // Return 200 so form submission isn't blocked
      );
    }

    console.error("Test connection error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 200 }, // Return 200 so form submission isn't blocked
    );
  }
}
