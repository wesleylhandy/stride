import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import type { SessionPayload } from "@/lib/auth/session";

/**
 * GET /api/users
 * List all users in the system for assignment purposes
 * Returns id, username, name, avatarUrl, role for each user
 */
export async function GET(request: NextRequest) {
  try {
    // T401: Implement authentication check
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      // Auth failed - T403: Add error handling (401)
      return authResult;
    }

    const session = authResult as SessionPayload;

    // T402: Implement user list query (select id, username, name, avatarUrl, role)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    // T403: Response formatting
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    // T403: Add error handling (500)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

