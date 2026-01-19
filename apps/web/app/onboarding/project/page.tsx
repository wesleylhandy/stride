import { redirect } from "next/navigation";

/**
 * Legacy Project Page - Redirects to new project-setup page
 * 
 * Maintains backward compatibility for users who may have bookmarked
 * or have the old URL in their browser history.
 */
export default function ProjectPage() {
  redirect("/onboarding/project-setup");
}

