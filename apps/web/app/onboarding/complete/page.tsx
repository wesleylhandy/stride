"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@stride/ui";

export default function CompletePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch projects to see if any exist
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleGoToDashboard = () => {
    if (projects.length > 0) {
      router.push(`/projects/${projects[0].id}`);
    } else {
      router.push("/projects");
    }
  };

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Setup Complete!
        </h1>
        <p className="mt-2 text-gray-600">
          You're all set to start using Stride. Your admin account has been
          created and your project is ready.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 text-left">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          What's Next?
        </h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start">
            <svg
              className="mr-2 h-5 w-5 flex-shrink-0 text-primary-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Create issues using the command palette (Cmd/Ctrl+K)
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="mr-2 h-5 w-5 flex-shrink-0 text-primary-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Manage your workflow with the Kanban board
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="mr-2 h-5 w-5 flex-shrink-0 text-primary-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Customize your workflow configuration in Project Settings
            </span>
          </li>
          {projects.length === 0 && (
            <li className="flex items-start">
              <svg
                className="mr-2 h-5 w-5 flex-shrink-0 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Connect a repository to enable automatic issue tracking
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-8">
        <Button onClick={handleGoToDashboard} size="lg">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

