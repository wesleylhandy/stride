import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import type { SessionPayload } from "@/lib/auth/session";
import { UserRole } from "@stride/types";
import { createUserSchema } from "@/lib/validation/user";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * GET /api/users
 * List all users in the system (admin only)
 * Returns id, email, username, name, role, createdAt for each user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult as SessionPayload;

    // Admin-only access check
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/users
 * Create a new user (admin only)
 * Admin sets password directly for immediate access
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult as SessionPayload;

    // Admin-only access check
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate input using Zod schema (includes async uniqueness checks)
    const validated = await createUserSchema.parseAsync(body);

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        username: validated.username,
        passwordHash,
        name: validated.name || null,
        role: validated.role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        user,
        message: "User created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    // Handle Prisma unique constraint violations
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const target = (error as { meta?: { target?: string[] } }).meta
        ?.target?.[0];
      if (target === "email") {
        return NextResponse.json(
          { error: "A user with this email address already exists. Please use a different email address." },
          { status: 409 },
        );
      }
      if (target === "username") {
        return NextResponse.json(
          { error: "This username is already taken. Please choose a different username." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "A duplicate entry was detected. Please check the provided information and try again." },
        { status: 409 },
      );
    }

    logger.error(
      'Create user error',
      error instanceof Error ? error : undefined,
      {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
    );
    return NextResponse.json(
      {
        error: "Unable to create user account",
        message: "We encountered an error while creating the user account. Please try again or contact support if the problem persists.",
      },
      { status: 500 },
    );
  }
}