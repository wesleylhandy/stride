import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/session";
import { isOnboardingComplete } from "@/lib/onboarding/status";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in to Stride",
  description: "Enter your credentials to access your workspace",
};

/**
 * Login Page (Server Component)
 * 
 * Checks for existing valid sessions and redirects authenticated users.
 * If no valid session exists, renders the login form.
 * 
 * **Session Detection**:
 * - Checks for session cookie
 * - Verifies session token validity
 * - Redirects to dashboard if authenticated and onboarding complete
 * - Redirects to onboarding if authenticated but onboarding incomplete
 * - Renders login form if not authenticated
 */
export default async function LoginPage() {
  // Check for existing session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const token = sessionCookie?.value;

  if (token) {
    // Verify session token
    const session = await verifySession(token);

    if (session) {
      // User is already authenticated - check onboarding status
      const onboardingComplete = await isOnboardingComplete(session.userId);

      if (onboardingComplete) {
        // Onboarding complete - redirect to dashboard
        redirect("/dashboard");
      } else {
        // Onboarding incomplete - redirect to onboarding
        redirect("/onboarding");
      }
    }
    // If session is invalid/expired, continue to render login form
  }

  // No valid session - render login form
  return <LoginForm />;
}
