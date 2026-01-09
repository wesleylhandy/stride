import { redirect } from 'next/navigation';
import { isFirstRun } from '@/lib/setup/first-run';
import { getTokenFromHeaders, verifySession } from '@/lib/auth/session';
import { isOnboardingComplete } from '@/lib/onboarding/status';
import { headers } from 'next/headers';

/**
 * Root page - redirects based on application state:
 * - First run: Redirect to /setup
 * - Not logged in: Redirect to /login (if admin exists) or /setup (if first run)
 * - Logged in: Redirect to onboarding or dashboard based on onboarding completion status
 */
export default async function HomePage() {
  // Check if this is first run (no admin user exists)
  const firstRun = await isFirstRun();
  
  if (firstRun) {
    redirect('/setup');
  }

  // Check if user is logged in
  const headersList = await headers();
  const token = getTokenFromHeaders(headersList);
  
  if (!token) {
    // No session token - admin exists, so redirect to login
    redirect('/login');
  }

  const session = await verifySession(token);
  
  if (!session) {
    // Invalid or expired session - admin exists, so redirect to login
    redirect('/login');
  }

  // User is logged in - check onboarding completion status
  const onboardingComplete = await isOnboardingComplete(session.userId);

  if (onboardingComplete) {
    // Onboarding complete - redirect to dashboard or projects
    redirect('/dashboard');
  } else {
    // Onboarding incomplete - redirect to onboarding flow
    redirect('/onboarding');
  }
}
