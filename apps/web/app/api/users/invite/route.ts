import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import type { SessionPayload } from "@/lib/auth/session";
import { UserRole } from "@stride/types";
import { inviteUserSchema, hasPendingInvitation } from "@/lib/validation/user";
import { invitationService } from "@/lib/services/invitation-service";
import { emailService } from "@/lib/services/email-service";
import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * POST /api/users/invite
 * Create and send an invitation (admin only)
 * Sends email if SMTP is configured, otherwise returns invitation link for manual sharing
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

    // Validate input
    const validated = inviteUserSchema.parse(body);

    // Check for pending invitation
    const pendingInvitation = await hasPendingInvitation(validated.email);
    if (pendingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 409 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Create invitation
    const invitation = await invitationService.createInvitation({
      email: validated.email,
      role: validated.role as UserRole,
      invitedById: session.userId,
    });

    // Get inviter's name for email
    const inviter = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });

    // Generate invitation URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    // Try to send email if service is available
    let emailSent = false;
    if (emailService.isAvailable()) {
      try {
        await emailService.sendInvitation({
          to: invitation.email,
          token: invitation.token,
          invitedByName: inviter?.name || null,
          expiresAt: invitation.expiresAt,
          inviteUrl,
        });
        emailSent = true;
      } catch (emailError) {
        // Log error but don't fail the request - invitation is still created
        logger.error(
          'Failed to send invitation email',
          emailError instanceof Error ? emailError : undefined,
          {
            email: invitation.email,
            invitationId: invitation.id,
          },
        );
        emailSent = false;
      }
    }

    // Return invitation with appropriate message
    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
        inviteUrl,
        emailSent,
        message: emailSent
          ? "Invitation sent successfully"
          : "Invitation created. Email service not configured. See SMTP Configuration documentation (docs/deployment/smtp-configuration.md) to enable email invitations. Share this link manually:",
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

    // Handle invitation service errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 },
        );
      }
      if (error.message.includes('token collision') || error.message.includes('retries')) {
        return NextResponse.json(
          { error: 'Failed to create invitation due to a system error. Please try again in a moment.' },
          { status: 500 },
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
      if (target === "email") {
        return NextResponse.json(
          { error: "An invitation for this email already exists" },
          { status: 409 },
        );
      }
      if (target === "token") {
        return NextResponse.json(
          { error: "Failed to create invitation. Please try again." },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "A duplicate entry was detected. Please try again." },
        { status: 409 },
      );
    }

    logger.error('Create invitation error', error instanceof Error ? error : undefined, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    return NextResponse.json(
      { error: "Unable to create invitation. Please try again or contact support if the problem persists." },
      { status: 500 },
    );
  }
}
