import { NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  getTokenFromHeaders,
  getSessionExpirationDays,
} from "@/lib/auth/session";
import { UserRole } from "@stride/types";
import { z } from "zod";
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validated.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Get IP address and user agent from request
    const headers = request.headers;
    const ipAddress =
      headers.get("x-forwarded-for")?.split(",")[0] ||
      headers.get("x-real-ip") ||
      undefined;
    const userAgent = headers.get("user-agent") || undefined;

    // Determine session expiration based on "Remember me" preference
    const expirationDays = getSessionExpirationDays(validated.rememberMe);

    // Create session with appropriate expiration
    const token = await createSession(
      user.id,
      user.email,
      user.role as UserRole,
      ipAddress || undefined,
      userAgent,
      expirationDays,
    );

    // Set HTTP-only cookie with matching expiration
    // secure flag should be true in production (HTTPS required)
    // Use COOKIE_SECURE env var to override, or detect HTTPS from request
    const isSecure =
      process.env.COOKIE_SECURE === "true" ||
      (process.env.NODE_ENV === "production" &&
        process.env.COOKIE_SECURE !== "false");
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * expirationDays, // Match session expiration
      path: "/",
    });

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token, // Also return token for API clients
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

