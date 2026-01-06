import { NextResponse } from "next/server";
import { hasAdminUser } from "@/lib/setup/first-run";

/**
 * GET /api/setup/status
 * 
 * Returns the setup status of the application
 */
export async function GET() {
  try {
    const adminExists = await hasAdminUser();

    return NextResponse.json({
      adminExists,
      setupComplete: adminExists,
    });
  } catch (error) {
    console.error("Setup status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

