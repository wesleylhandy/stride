import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import { changePasswordSchema } from "@/lib/validation/user";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { z } from "zod";

/**
 * PUT /api/user/password
 * Change current user password
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      validated.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validated.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: authResult.userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

