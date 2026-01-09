import { projectRepository } from "@stride/database";

/**
 * Check if onboarding is complete for a user.
 * 
 * Onboarding is considered complete when the user has at least one project
 * in the system. Since projects are currently system-wide (all authenticated
 * users can see all projects), this checks if there are any projects in the
 * system.
 * 
 * @param userId - User ID to check onboarding status for
 * @returns True if onboarding is complete (user has at least one project), false otherwise
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  // Check if there are any projects in the system
  // For now, since projects are system-wide, we check total project count
  // In the future, this could be scoped to user-specific projects if that relationship is added
  const projectCount = await projectRepository.count();
  return projectCount > 0;
}

/**
 * Determine if user should be redirected to onboarding flow.
 * 
 * This is the inverse of `isOnboardingComplete` - returns true if user
 * should be redirected to onboarding (onboarding not complete).
 * 
 * @param userId - User ID to check
 * @returns True if user should be redirected to onboarding, false if onboarding is complete
 */
export async function shouldRedirectToOnboarding(
  userId: string,
): Promise<boolean> {
  const complete = await isOnboardingComplete(userId);
  return !complete;
}
