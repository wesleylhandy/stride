import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import { updateProfileSchema } from "@/lib/validation/user";
import { z } from "zod";

/**
 * GET /api/user/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
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
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Check if username is being changed and if it's already taken
    if (validated.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validated.username,
          NOT: { id: authResult.userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 },
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: authResult.userId },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.username && { username: validated.username }),
        ...(validated.avatarUrl !== undefined && {
          avatarUrl: validated.avatarUrl,
        }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

