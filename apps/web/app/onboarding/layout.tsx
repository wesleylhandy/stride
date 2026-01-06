"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

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
      {/* Progress indicator */}
      <div className="border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={`${
                    stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""
                  } relative`}
                >
                  {stepIdx < currentStep ? (
                    <>
                      <div className="absolute inset-0 flex items-center">
                        <div className="h-0.5 w-full bg-accent" />
                      </div>
                      <Link
                        href={step.path}
                        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent hover:bg-accent-hover"
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
                    </>
                  ) : stepIdx === currentStep ? (
                    <>
                      {stepIdx !== steps.length - 1 && (
                        <div className="absolute inset-0 flex items-center">
                          <div className="h-0.5 w-full bg-border dark:bg-border-dark" />
                        </div>
                      )}
                      <div
                        className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-surface dark:bg-surface-dark"
                        aria-current="step"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-accent"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{step.name}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {stepIdx !== steps.length - 1 && (
                        <div className="absolute inset-0 flex items-center">
                          <div className="h-0.5 w-full bg-border dark:bg-border-dark" />
                        </div>
                      )}
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:border-border-hover dark:hover:border-border-dark-hover">
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-transparent"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{step.name}</span>
                      </div>
                    </>
                  )}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                    {step.name}
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

