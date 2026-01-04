import { NextResponse } from "next/server";
import { deleteSession, getTokenFromHeaders } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const headers = new Headers(request.headers);
    const token = getTokenFromHeaders(headers);

    if (token) {
      // Delete session from database
      await deleteSession(token);
    }

    // Clear cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, clear the cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

