import { redirect } from 'next/navigation';
import { hasAdminUser } from '@/lib/setup/first-run';

/**
 * Onboarding flow entry point
 * 
 * Redirects to the appropriate step based on application state:
 * - If admin doesn't exist: redirect to admin creation step
 * - If admin exists: redirect to project creation step (skip admin step)
 */
export default async function OnboardingPage() {
  const adminExists = await hasAdminUser();

  if (adminExists) {
    // Admin already exists (e.g., created via /setup), skip to project step
    redirect('/onboarding/project');
  } else {
    // No admin exists, start with admin creation
    redirect('/onboarding/admin');
  }
}

