"use client";

/**
 * AssistantMessage component
 * Displays individual messages in the chat interface
 */

import { cn, MarkdownRenderer, Badge } from "@stride/ui";
import type { AssistantMessageData } from "./ConfigurationAssistantClient";
import { ConfigurationSuggestion } from "./ConfigurationSuggestion";
import { DocumentationLinks } from "./DocumentationLinks";

export interface AssistantMessageProps {
  message: AssistantMessageData;
  projectId: string;
}

interface ValidationFinding {
  type: "error" | "warning" | "info" | "best_practice";
  severity: "critical" | "high" | "medium" | "low";
  path?: (string | number)[];
  message: string;
  recommendation?: string;
  documentationLink?: string;
}

interface DocumentationLink {
  title: string;
  url: string;
  description?: string;
}

/**
 * AssistantMessage component
 * Renders a single message with markdown support
 */
export function AssistantMessage({ message, projectId }: AssistantMessageProps) {
  const isUser = message.role === "user";
  const metadata = message.metadata as {
    suggestions?: Array<{
      type: string;
      config: unknown;
      explanation?: string;
    }>;
    validationFindings?: ValidationFinding[];
    documentationLinks?: DocumentationLink[];
  } | null;

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
      role="article"
      aria-label={isUser ? "Your message" : "Assistant message"}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-4",
          isUser
            ? "bg-accent text-white dark:text-white"
            : "bg-surface-secondary dark:bg-surface-dark-secondary border border-border dark:border-border-dark"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap text-white">{message.content}</p>
        ) : (
          <div className="space-y-3">
            {/* Message content (markdown rendered) */}
            <div className="text-sm text-foreground dark:text-foreground-dark">
              <MarkdownRenderer content={message.content} />
            </div>

            {/* Validation findings */}
            {metadata?.validationFindings && metadata.validationFindings.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border dark:border-border-dark">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-dark-secondary">
                  Validation Findings
                </h4>
                <div className="space-y-2">
                  {metadata.validationFindings.map((finding, index) => {
                    const severityVariant =
                      finding.severity === "critical"
                        ? "error"
                        : finding.severity === "high"
                        ? "warning"
                        : finding.severity === "medium"
                        ? "warning"
                        : "info";
                    
                    return (
                      <div
                        key={index}
                        className="rounded-md border border-border dark:border-border-dark p-3 bg-background dark:bg-background-dark"
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant={severityVariant} size="sm">
                            {finding.type === "error"
                              ? "Error"
                              : finding.type === "warning"
                              ? "Warning"
                              : finding.type === "best_practice"
                              ? "Best Practice"
                              : "Info"}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
                              {finding.message}
                            </p>
                            {finding.path && finding.path.length > 0 && (
                              <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
                                Path: {finding.path.join(".")}
                              </p>
                            )}
                            {finding.recommendation && (
                              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-2">
                                <span className="font-medium">Recommendation:</span>{" "}
                                {finding.recommendation}
                              </p>
                            )}
                            {finding.documentationLink && (
                              <a
                                href={finding.documentationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accent hover:underline mt-1 inline-block"
                              >
                                View Documentation →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Documentation links */}
            {metadata?.documentationLinks && metadata.documentationLinks.length > 0 && (
              <div className="pt-2 border-t border-border dark:border-border-dark">
                <DocumentationLinks links={metadata.documentationLinks} />
              </div>
            )}

            {/* Configuration suggestions */}
            {metadata?.suggestions && metadata.suggestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border dark:border-border-dark">
                {metadata.suggestions.map((suggestion, index) => (
                  <ConfigurationSuggestion
                    key={index}
                    suggestion={suggestion}
                    projectId={projectId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
