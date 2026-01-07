import type { Issue } from "@stride/database";

/**
 * Calculate cycle time for a single issue
 * Cycle time is the time from "In Progress" to "Done"
 *
 * Note: This is a simplified implementation. A full implementation would
 * track status change history to accurately calculate when an issue
 * entered "In Progress" status. For now, we use createdAt as a proxy.
 *
 * @param issue - The issue to calculate cycle time for
 * @param closedStatuses - Array of status keys that represent "closed/done" states
 * @returns Cycle time in hours, or null if issue is not completed
 */
export function calculateIssueCycleTime(
  issue: Issue,
  closedStatuses: string[],
): number | null {
  // Issue must be in a closed status
  if (!closedStatuses.includes(issue.status)) {
    return null;
  }

  // Issue must have a closedAt timestamp
  if (!issue.closedAt) {
    return null;
  }

  const startTime = new Date(issue.createdAt);
  const endTime = new Date(issue.closedAt);
  
  // Calculate difference in hours
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours;
}

/**
 * Calculate average cycle time for a set of issues
 *
 * @param issues - Array of issues
 * @param closedStatuses - Array of status keys that represent "closed/done" states
 * @returns Average cycle time in hours, or null if no completed issues
 */
export function calculateAverageCycleTime(
  issues: Issue[],
  closedStatuses: string[],
): number | null {
  const cycleTimes = issues
    .map((issue) => calculateIssueCycleTime(issue, closedStatuses))
    .filter((time): time is number => time !== null);

  if (cycleTimes.length === 0) {
    return null;
  }

  const sum = cycleTimes.reduce((acc, time) => acc + time, 0);
  return sum / cycleTimes.length;
}

/**
 * Calculate cycle time statistics
 *
 * @param issues - Array of issues
 * @param closedStatuses - Array of status keys that represent "closed/done" states
 * @returns Statistics object with average, median, min, max
 */
export function calculateCycleTimeStats(
  issues: Issue[],
  closedStatuses: string[],
): {
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  count: number;
} {
  const cycleTimes = issues
    .map((issue) => calculateIssueCycleTime(issue, closedStatuses))
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b);

  if (cycleTimes.length === 0) {
    return {
      average: null,
      median: null,
      min: null,
      max: null,
      count: 0,
    };
  }

  const average = cycleTimes.reduce((acc, time) => acc + time, 0) / cycleTimes.length;
  const median =
    cycleTimes.length % 2 === 0
      ? (cycleTimes[cycleTimes.length / 2 - 1]! + cycleTimes[cycleTimes.length / 2]!) / 2
      : cycleTimes[Math.floor(cycleTimes.length / 2)]!;
  const min = cycleTimes[0] ?? null;
  const max = cycleTimes[cycleTimes.length - 1] ?? null;

  return {
    average,
    median: median ?? null,
    min,
    max,
    count: cycleTimes.length,
  };
}

