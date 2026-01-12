import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard overview",
};

/**
 * Dashboard route - redirects to projects page
 *
 * The /projects route serves as the main dashboard after onboarding.
 * This route exists for convenience and consistency with expected URLs.
 */
export default function DashboardPage() {
  redirect("/projects");
}
