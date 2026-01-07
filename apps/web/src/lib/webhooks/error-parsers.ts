/**
 * Error payload parsers for monitoring services (Sentry, Datadog, New Relic)
 * T244, T245: Parse error payloads and extract stack traces
 */

export interface ErrorTrace {
  message: string;
  stackTrace?: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
  context?: Record<string, unknown>;
  fingerprint?: string; // For error grouping
}

export interface SentryWebhookPayload {
  action?: string;
  data?: {
    event?: {
      event_id?: string;
      message?: string;
      level?: string;
      timestamp?: number;
      environment?: string;
      release?: string;
      tags?: Array<{ key: string; value: string }>;
      contexts?: Record<string, unknown>;
      exception?: {
        values?: Array<{
          type?: string;
          value?: string;
          stacktrace?: {
            frames?: Array<{
              filename?: string;
              function?: string;
              lineno?: number;
              colno?: number;
            }>;
          };
        }>;
      };
      fingerprint?: string[];
    };
  };
}

export interface DatadogWebhookPayload {
  event?: {
    title?: string;
    text?: string;
    alert_type?: string;
    date_happened?: number;
    tags?: string[];
    host?: string;
    aggregation_key?: string;
    source_type_name?: string;
    event_object?: string;
  };
  metric?: {
    metric?: string;
    points?: Array<[number, number]>;
    tags?: string[];
  };
}

export interface NewRelicWebhookPayload {
  account_id?: number;
  account_name?: string;
  condition_id?: number;
  condition_name?: string;
  current_state?: string;
  details?: string;
  event_type?: string;
  incident_id?: number;
  incident_url?: string;
  owner?: string;
  policy_name?: string;
  policy_url?: string;
  runbook_url?: string;
  severity?: string;
  targetID?: string;
  targetName?: string;
  timestamp?: number;
}

/**
 * Parse Sentry webhook payload and extract error details
 */
export function parseSentryError(payload: unknown): ErrorTrace | null {
  try {
    const data = payload as SentryWebhookPayload;

    // Sentry webhooks can have different structures
    // Handle event webhook format
    const event = data.data?.event;
    if (!event) {
      return null;
    }

    const message = event.message || "Error occurred";
    const level = event.level || "error";
    const timestamp = event.timestamp
      ? new Date(event.timestamp * 1000)
      : new Date();

    // Extract stack trace from exception
    let stackTrace: string | undefined;
    if (event.exception?.values && event.exception.values.length > 0) {
      const exception = event.exception.values[0];
      if (exception?.stacktrace?.frames) {
        const frames = exception.stacktrace.frames;
        stackTrace = frames
          .reverse() // Sentry frames are in reverse order
          .map((frame) => {
            const location = frame.filename || "unknown";
            const functionName = frame.function || "anonymous";
            const line = frame.lineno ? `:${frame.lineno}` : "";
            const col = frame.colno ? `:${frame.colno}` : "";
            return `  at ${functionName} (${location}${line}${col})`;
          })
          .join("\n");

        if (exception.type && exception.value) {
          stackTrace = `${exception.type}: ${exception.value}\n${stackTrace}`;
        }
      }
    }

    // Convert Sentry level to severity
    const severityMap: Record<string, "low" | "medium" | "high" | "critical"> =
      {
        debug: "low",
        info: "low",
        warning: "medium",
        error: "high",
        fatal: "critical",
      };
    const severity = severityMap[level.toLowerCase()] || "medium";

    // Convert tags array to object
    const tags: Record<string, string> = {};
    if (event.tags) {
      for (const tag of event.tags) {
        tags[tag.key] = tag.value;
      }
    }

    // Get fingerprint for grouping
    const fingerprint = event.fingerprint?.[0];

    return {
      message,
      stackTrace,
      severity,
      timestamp,
      environment: event.environment,
      release: event.release,
      tags,
      context: event.contexts,
      fingerprint: fingerprint || event.event_id,
    };
  } catch (error) {
    console.error("Failed to parse Sentry error:", error);
    return null;
  }
}

/**
 * Parse Datadog webhook payload and extract error details
 */
export function parseDatadogError(payload: unknown): ErrorTrace | null {
  try {
    const data = payload as DatadogWebhookPayload;
    const event = data.event;

    if (!event) {
      return null;
    }

    const message = event.title || event.text || "Error occurred";
    const timestamp = event.date_happened
      ? new Date(event.date_happened * 1000)
      : new Date();

    // Convert Datadog alert type to severity
    const alertType = event.alert_type || "warning";
    const severityMap: Record<
      string,
      "low" | "medium" | "high" | "critical"
    > = {
      info: "low",
      warning: "medium",
      error: "high",
      success: "low",
    };
    const severity = severityMap[alertType.toLowerCase()] || "medium";

    // Parse tags from string array
    const tags: Record<string, string> = {};
    if (event.tags) {
      for (const tag of event.tags) {
        const [key, value] = tag.split(":");
        if (key && value) {
          tags[key.trim()] = value.trim();
        } else {
          tags[tag] = "";
        }
      }
    }

    // Extract stack trace from text if present
    let stackTrace: string | undefined;
    if (event.text) {
      const stackMatch = event.text.match(/```[\s\S]*?```/);
      if (stackMatch) {
        stackTrace = stackMatch[0].replace(/```/g, "").trim();
      } else if (event.text.includes("at ") || event.text.includes("Error:")) {
        stackTrace = event.text;
      }
    }

    return {
      message,
      stackTrace,
      severity,
      timestamp,
      tags,
      fingerprint: event.aggregation_key,
    };
  } catch (error) {
    console.error("Failed to parse Datadog error:", error);
    return null;
  }
}

/**
 * Parse New Relic webhook payload and extract error details
 */
export function parseNewRelicError(payload: unknown): ErrorTrace | null {
  try {
    const data = payload as NewRelicWebhookPayload;

    if (!data.condition_name && !data.details) {
      return null;
    }

    const message =
      data.condition_name || data.details || "Error occurred in New Relic";
    const timestamp = data.timestamp
      ? new Date(data.timestamp * 1000)
      : new Date();

    // Convert New Relic severity to our severity
    const severityMap: Record<
      string,
      "low" | "medium" | "high" | "critical"
    > = {
      info: "low",
      warning: "medium",
      critical: "critical",
      error: "high",
    };
    const severity =
      severityMap[data.severity?.toLowerCase() || ""] || "medium";

    const tags: Record<string, string> = {};
    if (data.account_name) tags.account = data.account_name;
    if (data.policy_name) tags.policy = data.policy_name;
    if (data.targetName) tags.target = data.targetName;

    // Extract stack trace from details if present
    let stackTrace: string | undefined;
    if (data.details) {
      const stackMatch = data.details.match(/```[\s\S]*?```/);
      if (stackMatch) {
        stackTrace = stackMatch[0].replace(/```/g, "").trim();
      } else if (
        data.details.includes("at ") ||
        data.details.includes("Error:")
      ) {
        stackTrace = data.details;
      }
    }

    return {
      message,
      stackTrace,
      severity,
      timestamp,
      tags,
      fingerprint: data.condition_id?.toString(),
      context: {
        incident_id: data.incident_id,
        incident_url: data.incident_url,
        policy_url: data.policy_url,
        runbook_url: data.runbook_url,
      },
    };
  } catch (error) {
    console.error("Failed to parse New Relic error:", error);
    return null;
  }
}

/**
 * Extract stack trace from error payload (generic fallback)
 */
export function extractStackTrace(
  payload: unknown,
  service: "sentry" | "datadog" | "newrelic",
): string | undefined {
  try {
    switch (service) {
      case "sentry": {
        const parsed = parseSentryError(payload);
        return parsed?.stackTrace;
      }
      case "datadog": {
        const parsed = parseDatadogError(payload);
        return parsed?.stackTrace;
      }
      case "newrelic": {
        const parsed = parseNewRelicError(payload);
        return parsed?.stackTrace;
      }
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

