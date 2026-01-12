// Priority mapping logic

/**
 * Maps AI-suggested priority to project-specific priority values
 * 
 * If projectConfig.priorityValues exists, attempts to map the AI response
 * to one of those values. Otherwise returns standard priority values (low/medium/high).
 * 
 * @param aiPriority - Priority value returned by AI
 * @param projectPriorityValues - Optional array of project-specific priority values
 * @returns Mapped priority value
 */
export function mapPriority(
  aiPriority: string,
  projectPriorityValues?: string[]
): string {
  // If no project-specific priorities, return as-is (should be low/medium/high)
  if (!projectPriorityValues || projectPriorityValues.length === 0) {
    return normalizeStandardPriority(aiPriority);
  }

  // Normalize AI priority to lowercase for comparison
  const normalized = aiPriority.toLowerCase().trim();

  // Try to find exact match in project priorities
  const exactMatch = projectPriorityValues.find(
    (p) => p.toLowerCase().trim() === normalized
  );

  if (exactMatch) {
    return exactMatch; // Return original casing from project config
  }

  // Try to map standard priorities to project priorities
  const standardPriority = normalizeStandardPriority(normalized);
  
  // Map standard to project priorities by index
  // This is a simple heuristic - could be improved with fuzzy matching
  if (standardPriority === 'high' && projectPriorityValues.length >= 3) {
    // Map high to highest project priority
    const highest = projectPriorityValues[projectPriorityValues.length - 1];
    if (highest !== undefined) return highest;
  }
  
  if (standardPriority === 'medium' && projectPriorityValues.length >= 2) {
    // Map medium to middle project priority
    const middleIndex = Math.floor(projectPriorityValues.length / 2);
    const middle = projectPriorityValues[middleIndex];
    if (middle !== undefined) return middle;
  }
  
  if (standardPriority === 'low' && projectPriorityValues.length >= 1) {
    // Map low to lowest project priority
    const lowest = projectPriorityValues[0];
    if (lowest !== undefined) return lowest;
  }

  // Fallback: return first project priority value
  const fallback = projectPriorityValues[0];
  if (fallback !== undefined) return fallback;

  // Ultimate fallback (should never happen if length > 0)
  return 'medium';
}

/**
 * Normalizes priority value to standard format (low/medium/high)
 */
function normalizeStandardPriority(priority: string): string {
  const normalized = priority.toLowerCase().trim();

  // Common variations of high
  if (['high', 'critical', 'urgent', 'p1', 'priority 1'].includes(normalized)) {
    return 'high';
  }

  // Common variations of medium
  if (['medium', 'normal', 'moderate', 'p2', 'priority 2'].includes(normalized)) {
    return 'medium';
  }

  // Common variations of low
  if (['low', 'minor', 'p3', 'priority 3', 'trivial'].includes(normalized)) {
    return 'low';
  }

  // Default to medium if unrecognized
  return 'medium';
}
