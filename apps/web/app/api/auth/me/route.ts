import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import type { SessionPayload } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      // Auth failed
      return authResult;
    }

    const session = authResult as SessionPayload;

    // Fetch full user data
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

