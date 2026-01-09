"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@stride/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

const steps = [
  { id: "admin", name: "Admin Account", path: "/onboarding/admin" },
  { id: "project", name: "Project", path: "/onboarding/project" },
  { id: "repository", name: "Repository", path: "/onboarding/repository" },
  { id: "complete", name: "Complete", path: "/onboarding/complete" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStepIndex = steps.findIndex((step) =>
    pathname?.startsWith(step.path),
  );
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background-secondary dark:bg-background-dark">
      {/* Header with user menu and theme toggle */}
      <div className="border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Stride Setup
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
      {/* Progress indicator */}
      <div className="border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Progress">
            <ol className="flex items-start">
              {steps.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={`${
                    stepIdx !== steps.length - 1 ? "flex-1" : ""
                  } relative flex flex-col items-center`}
                >
                  {/* Connecting line - only show between steps */}
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-4 left-[50%] right-0 h-0.5 -mr-4">
                      {stepIdx < currentStep ? (
                        <div className="h-full bg-accent" />
                      ) : (
                        <div className="h-full bg-border dark:bg-border-dark" />
                      )}
                    </div>
                  )}
                  
                  {/* Step circle */}
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center">
                    {stepIdx < currentStep ? (
                      <Link
                        href={step.path}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent hover:bg-accent-hover transition-colors"
                      >
                        <svg
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="sr-only">{step.name}</span>
                      </Link>
                    ) : stepIdx === currentStep ? (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-surface dark:bg-surface-dark"
                        aria-current="step"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-accent"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{step.name}</span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-transparent"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{step.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary whitespace-nowrap">
                      {step.name}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

