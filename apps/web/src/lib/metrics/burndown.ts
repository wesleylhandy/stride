import type { Issue, Cycle } from "@stride/database";
import type { BurndownDataPoint } from "@stride/types";

/**
 * Calculate burndown data for a cycle
 * Burndown shows remaining story points over time
 *
 * @param cycle - The cycle/sprint to calculate burndown for
 * @param issues - All issues assigned to the cycle
 * @returns Array of burndown data points
 */
export function calculateBurndownData(
  cycle: Cycle,
  issues: Issue[],
): BurndownDataPoint[] {
  const dataPoints: BurndownDataPoint[] = [];
  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);
  
  // Get total story points at start
  const totalStoryPoints = issues.reduce(
    (sum, issue) => sum + (issue.storyPoints || 0),
    0,
  );

  // Determine closed/done statuses based on workflow config
  // For now, we'll use a simple heuristic: issues with closedAt set
  // In a full implementation, this would check the workflow configuration
  const completedIssues = issues.filter((issue) => issue.closedAt !== null);
  
  // Get project config to determine closed statuses
  // This would need to be passed in from the API route
  // For now, we'll use a simple approach

  // Generate data points for each day in the cycle
  const currentDate = new Date(startDate);
  let remaining = totalStoryPoints;

  // For each day, calculate remaining story points
  while (currentDate <= endDate) {
    // Count completed issues as of this date
    const completedByDate = issues.filter((issue) => {
      if (!issue.closedAt) return false;
      const closedDate = new Date(issue.closedAt);
      return closedDate <= currentDate;
    });

    const completedStoryPoints = completedByDate.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0),
      0,
    );

    remaining = totalStoryPoints - completedStoryPoints;

    dataPoints.push({
      date: new Date(currentDate),
      remaining: Math.max(0, remaining),
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}

/**
 * Calculate ideal burndown line
 * This represents the ideal linear progression from total to zero
 *
 * @param totalStoryPoints - Total story points at start
 * @param startDate - Cycle start date
 * @param endDate - Cycle end date
 * @returns Array of ideal burndown data points
 */
export function calculateIdealBurndown(
  totalStoryPoints: number,
  startDate: Date,
  endDate: Date,
): BurndownDataPoint[] {
  const dataPoints: BurndownDataPoint[] = [];
  const currentDate = new Date(startDate);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (totalDays <= 0) {
    return dataPoints;
  }

  const pointsPerDay = totalStoryPoints / totalDays;

  while (currentDate <= endDate) {
    const daysElapsed = Math.ceil(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const idealRemaining = Math.max(
      0,
      totalStoryPoints - pointsPerDay * daysElapsed,
    );

    dataPoints.push({
      date: new Date(currentDate),
      remaining: idealRemaining,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}

