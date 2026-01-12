import { redirect } from 'next/navigation';
import { hasAdminUser } from '@/lib/setup/first-run';
import { getTokenFromHeaders, verifySession } from '@/lib/auth/session';
import { isOnboardingComplete } from '@/lib/onboarding/status';
import { headers } from 'next/headers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding',
  description: 'Complete setup and onboarding',
};

/**
 * Onboarding flow entry point
 * 
 * Redirects based on application state:
 * - If onboarding already complete: redirect to dashboard (prevent re-entering)
 * - If admin doesn't exist: redirect to admin creation step
 * - If admin exists: redirect to project creation step (skip admin step)
 */
export default async function OnboardingPage() {
  // Check if user is logged in to check onboarding status
  const headersList = await headers();
  const token = getTokenFromHeaders(headersList);
  
  if (token) {
    const session = await verifySession(token);
    
    if (session) {
      // User is logged in - check if onboarding is already complete
      const onboardingComplete = await isOnboardingComplete(session.userId);
      
      if (onboardingComplete) {
        // Onboarding already complete - redirect to dashboard (prevent re-entering)
        redirect('/dashboard');
      }
    }
  }

  // Onboarding not complete or user not logged in - proceed with onboarding flow
  const adminExists = await hasAdminUser();

  if (adminExists) {
    // Admin already exists (e.g., created via /setup), skip to project step
    redirect('/onboarding/project');
  } else {
    // No admin exists, start with admin creation
    redirect('/onboarding/admin');
  }
}

