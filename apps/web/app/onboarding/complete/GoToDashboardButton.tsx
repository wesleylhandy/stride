"use client";

import { useRouter } from "next/navigation";
import { Button } from "@stride/ui";

/**
 * GoToDashboardButton (Client Component)
 * 
 * Button that navigates to the projects dashboard.
 * Extracted as a client component because it needs useRouter for navigation.
 */
export function GoToDashboardButton() {
  const router = useRouter();

  const handleGoToDashboard = () => {
    // Always redirect to projects listing page (T017, T036)
    // The listing page will show projects or empty state as appropriate
    // Documentation: The /projects route serves as the main dashboard after onboarding
    router.push("/projects");
  };

  return (
    <Button onClick={handleGoToDashboard} size="lg">
      Go to Dashboard
    </Button>
  );
}
