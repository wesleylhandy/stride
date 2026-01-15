"use client";

import { useRouter } from "next/navigation";
import { CreateProjectForm } from "@/components/features/projects/CreateProjectForm";
import type { CreateProjectInput } from "@stride/types";

export default function ProjectPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateProjectInput) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400 && result.details) {
        const errorMessage = Array.isArray(result.details)
          ? result.details.map((err: { message: string }) => err.message).join(", ")
          : result.error || "Validation failed";
        throw new Error(errorMessage);
      }
      throw new Error(result.error || "Failed to create project");
    }

    // Redirect to repository step with project ID
    router.push(`/onboarding/repository?projectId=${result.id}`);
  };

  return (
    <CreateProjectForm
      onSubmit={handleSubmit}
      mode="onboarding"
    />
  );
}

