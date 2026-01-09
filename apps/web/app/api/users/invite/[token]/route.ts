import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { invitationService } from "@/lib/services/invitation-service";
import { acceptInvitationSchema } from "@/lib/validation/user";
import { z } from "zod";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

/**
 * GET /api/users/invite/[token]
 * Get invitation details by token (public endpoint)
 * Returns invitation information if valid, error if expired/invalid
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 },
      );
    }

    // Find invitation with inviter details
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Check if already accepted (with helpful message)
    if (invitation.acceptedAt) {
      const acceptedDate = new Date(invitation.acceptedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      return NextResponse.json(
        {
          error: "This invitation has already been accepted",
          message: `This invitation was already used on ${acceptedDate}. If you need access, please request a new invitation from your administrator.`,
          acceptedAt: invitation.acceptedAt,
        },
        { status: 410 },
      );
    }

    // Check if expired (with helpful message including expiration date)
    const now = new Date();
    if (invitation.expiresAt < now) {
      const expiredDaysAgo = Math.floor(
        (now.getTime() - invitation.expiresAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const expirationDate = new Date(invitation.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      return NextResponse.json(
        {
          error: "This invitation has expired",
          message: `This invitation expired on ${expirationDate}${expiredDaysAgo > 0 ? ` (${expiredDaysAgo} day${expiredDaysAgo > 1 ? 's' : ''} ago)` : ''}. Please request a new invitation from your administrator.`,
          expiredAt: invitation.expiresAt,
        },
        { status: 410 },
      );
    }

    // Return invitation details (without sensitive token info in response)
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy?.name || null,
      },
    });
  } catch (error) {
    logger.error(
      'Get invitation by token error',
      error instanceof Error ? error : undefined,
      {
        token: typeof params === 'object' && 'token' in params
          ? (params.token as string).substring(0, 8) + '...'
          : 'unknown',
      },
    );
    return NextResponse.json(
      { error: "Unable to retrieve invitation details. Please check the invitation link and try again." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/users/invite/[token]
 * Accept invitation and create user account (public endpoint)
 * Creates user, marks invitation as accepted, and auto-logs in user
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate input
    const validated = await acceptInvitationSchema.parseAsync(body);

    // Accept invitation (creates user and marks invitation as accepted)
    const result = await invitationService.acceptInvitation(
      token,
      validated.username,
      validated.password,
      validated.name,
    );

    // Set session cookie for auto-login
    const cookieStore = await cookies();
    cookieStore.set("session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        user: result.user,
        message: "Account created successfully. You are now logged in.",
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

    // Handle specific invitation service errors with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("Invalid invitation")) {
        return NextResponse.json(
          {
            error: "Invitation not found",
            message: "This invitation link is invalid or has been removed. Please check the link or request a new invitation from your administrator.",
          },
          { status: 404 },
        );
      }

      if (error.message.includes("already been accepted")) {
        return NextResponse.json(
          {
            error: "Invitation already used",
            message: "This invitation has already been used to create an account. If you need access, please request a new invitation from your administrator or try logging in with your existing account.",
          },
          { status: 410 },
        );
      }

      if (error.message.includes("expired")) {
        return NextResponse.json(
          {
            error: "Invitation expired",
            message: "This invitation has expired. Please request a new invitation from your administrator.",
          },
          { status: 410 },
        );
      }

      if (error.message.includes("email already exists") || error.message.includes("A user with this email")) {
        return NextResponse.json(
          {
            error: "Account already exists",
            message: "A user account with this email already exists. Please try logging in instead.",
          },
          { status: 409 },
        );
      }

      if (error.message.includes("Username already taken") || error.message.includes("username")) {
        return NextResponse.json(
          {
            error: "Username unavailable",
            message: "This username is already taken. Please choose a different username.",
          },
          { status: 409 },
        );
      }

      if (error.message.includes("concurrent") || error.message.includes("try again")) {
        return NextResponse.json(
          {
            error: "Temporary conflict",
            message: "Another process is handling this invitation. Please wait a moment and try again.",
          },
          { status: 409 },
        );
      }
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
      if (target === "username") {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 },
        );
      }
      if (target === "email") {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Duplicate entry" },
        { status: 409 },
      );
    }

    logger.error(
      'Accept invitation error',
      error instanceof Error ? error : undefined,
      {
        token: typeof params === 'object' && 'token' in params
          ? (params.token as string).substring(0, 8) + '...'
          : 'unknown',
      },
    );
    return NextResponse.json(
      {
        error: "Unable to create account",
        message: "We encountered an error while creating your account. Please try again or contact support if the problem persists.",
      },
      { status: 500 },
    );
  }
}
