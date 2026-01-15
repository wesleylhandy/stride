"use client";

/**
 * ConfigurationSuggestion component
 * Displays AI-generated configuration suggestions with apply button and conflict resolution
 */

import { useState } from "react";
import { Button } from "@stride/ui";
import { useToast } from "@stride/ui";
import { cn } from "@stride/ui";
import { getCsrfHeaders } from "@/lib/utils/csrf";

export interface ConfigurationSuggestionProps {
  suggestion: {
    type: string;
    config: unknown;
    explanation?: string;
  };
  projectId: string;
  conflictResolution?: {
    hasConflict: boolean;
    conflicts?: {
      differences: Array<{
        path: string;
        currentValue: unknown;
        suggestedValue: unknown;
      }>;
    };
  };
}

/**
 * ConfigurationSuggestion component
 * Renders a suggestion with apply functionality
 */
export function ConfigurationSuggestion({
  suggestion,
  projectId,
  conflictResolution,
}: ConfigurationSuggestionProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [resolutionChoice, setResolutionChoice] = useState<"keep_current" | "use_suggested" | "manual">("use_suggested");
  const toast = useToast();

  const handleApply = async () => {
    // If conflicts exist and not shown, show conflict resolution UI
    if (conflictResolution?.hasConflict && !showConflictResolution) {
      setShowConflictResolution(true);
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/assistant/apply-suggestion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({
            suggestion,
            resolveConflicts: resolutionChoice,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply suggestion");
      }

      const data = await response.json();
      
      if (data.applied) {
        toast.success("Configuration applied successfully");
        // Refresh the page to show updated config
        window.location.reload();
      } else if (data.conflictResolution?.hasConflict) {
        // Show conflict resolution UI if not already shown
        if (!showConflictResolution) {
          setShowConflictResolution(true);
        }
        toast.warning("Configuration conflicts detected");
      }
    } catch (error) {
      toast.error("Failed to apply suggestion", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3">
      <div className="space-y-3">
        {suggestion.explanation && (
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            {suggestion.explanation}
          </p>
        )}

        {/* Conflict Resolution UI */}
        {showConflictResolution && conflictResolution?.hasConflict && (
          <div className="space-y-3 pt-3 border-t border-border dark:border-border-dark">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h4 className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                Configuration Conflicts Detected
              </h4>
            </div>

            {/* Differences List */}
            {conflictResolution.conflicts?.differences && conflictResolution.conflicts.differences.length > 0 && (
              <div className="space-y-2">
                {conflictResolution.conflicts.differences.map((diff: { path: string; currentValue: unknown; suggestedValue: unknown }, index: number) => (
                  <div
                    key={index}
                    className="rounded-md border border-border dark:border-border-dark bg-background dark:bg-background-dark p-3"
                  >
                    <div className="flex items-start gap-4">
                      {/* Current Version */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-xs font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
                            Current
                          </span>
                        </div>
                        <div className="text-xs font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                          <div className="text-red-800 dark:text-red-200 font-semibold mb-1">
                            {diff.path}
                          </div>
                          <div className="text-red-700 dark:text-red-300 whitespace-pre-wrap break-all">
                            {formatValue(diff.currentValue)}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Version */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
                            Suggested
                          </span>
                        </div>
                        <div className="text-xs font-mono bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                          <div className="text-green-800 dark:text-green-200 font-semibold mb-1">
                            {diff.path}
                          </div>
                          <div className="text-green-700 dark:text-green-300 whitespace-pre-wrap break-all">
                            {formatValue(diff.suggestedValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resolution Options */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground dark:text-foreground-dark">
                Resolution Strategy:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resolution"
                    value="use_suggested"
                    checked={resolutionChoice === "use_suggested"}
                    onChange={() => setResolutionChoice("use_suggested")}
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    Use suggested configuration (replace current)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resolution"
                    value="keep_current"
                    checked={resolutionChoice === "keep_current"}
                    onChange={() => setResolutionChoice("keep_current")}
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    Keep current configuration
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resolution"
                    value="manual"
                    checked={resolutionChoice === "manual"}
                    onChange={() => setResolutionChoice("manual")}
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    Manual merge (edit configuration manually)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
            Type: {suggestion.type}
            {conflictResolution?.hasConflict && !showConflictResolution && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                (conflicts detected)
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {showConflictResolution && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowConflictResolution(false);
                  setResolutionChoice("use_suggested");
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="shrink-0"
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Applying...
                </>
              ) : conflictResolution?.hasConflict && !showConflictResolution ? (
                "Review Conflicts"
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
