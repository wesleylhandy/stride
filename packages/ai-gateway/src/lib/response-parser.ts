// Response parser for LLM outputs
interface ParsedResponse {
  summary: string;
  priority: string;
  suggestedAssignee: string;
}

/**
 * Parses and validates LLM response
 * 
 * Error handling strategy:
 * 1. Try to parse as JSON
 * 2. If JSON parsing fails, attempt to extract JSON from text (common when LLM wraps JSON in markdown)
 * 3. If JSON extraction fails, fall back to text extraction with heuristics
 * 4. If required fields are missing, log error and return user-friendly defaults
 */
export function parseResponse(rawResponse: string): ParsedResponse {
  // Step 1: Try to parse as JSON directly
  try {
    const parsed = JSON.parse(rawResponse) as Partial<ParsedResponse>;
    return validateAndReturn(parsed, rawResponse);
  } catch (error) {
    // Step 2: If JSON parsing fails, try to extract JSON from text
    // (Common when LLM wraps JSON in markdown code blocks or adds explanatory text)
    if (error instanceof SyntaxError) {
      console.warn('Failed to parse JSON response directly, attempting extraction:', error.message);
      
      // Try to find JSON object in text (handles markdown code blocks, etc.)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          const parsed = JSON.parse(extractedJson) as Partial<ParsedResponse>;
          console.info('Successfully extracted JSON from text response');
          return validateAndReturn(parsed, rawResponse);
        } catch (extractError) {
          console.warn('Failed to parse extracted JSON, falling back to text extraction:', extractError);
        }
      }

      // Step 3: Fall back to text extraction with heuristics
      console.warn('Falling back to text extraction with heuristics');
      return extractFromText(rawResponse);
    }

    // Unexpected error type
    console.error('Unexpected error parsing response:', error);
    throw error;
  }
}

/**
 * Validates parsed response and returns validated result
 * If required fields are missing, logs error and returns user-friendly defaults
 */
function validateAndReturn(parsed: Partial<ParsedResponse>, rawResponse: string): ParsedResponse {
  // Validate required fields
  const missingFields: string[] = [];
  
  if (!parsed.summary || typeof parsed.summary !== 'string') {
    missingFields.push('summary');
  }

  if (!parsed.priority || typeof parsed.priority !== 'string') {
    missingFields.push('priority');
  }

  if (!parsed.suggestedAssignee || typeof parsed.suggestedAssignee !== 'string') {
    missingFields.push('suggestedAssignee');
  }

  // If all fields are present, return validated result
  if (missingFields.length === 0) {
    return {
      summary: parsed.summary!,
      priority: parsed.priority!,
      suggestedAssignee: parsed.suggestedAssignee!,
    };
  }

  // Log error about missing fields
  console.error(
    `Response missing required fields: ${missingFields.join(', ')}. ` +
    `Raw response: ${rawResponse.substring(0, 500)}`
  );

  // Return defaults for missing fields (user-friendly fallback)
  return {
    summary: parsed.summary && typeof parsed.summary === 'string'
      ? parsed.summary
      : 'Unable to generate summary from AI response',
    priority: parsed.priority && typeof parsed.priority === 'string'
      ? parsed.priority
      : 'medium',
    suggestedAssignee: parsed.suggestedAssignee && typeof parsed.suggestedAssignee === 'string'
      ? parsed.suggestedAssignee
      : 'Review by team member',
  };
}

/**
 * Fallback: extract fields from plain text response using heuristics
 * Used when JSON parsing fails completely (e.g., structured output mode failed)
 */
function extractFromText(text: string): ParsedResponse {
  // Extract summary (first paragraph or first 200 characters)
  let summary = text.split('\n\n')[0] || text.split('\n')[0] || text.substring(0, 200);
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + '...';
  }

  // Try to find priority in text (case-insensitive)
  const priorityPatterns = [
    /priority[:\s]+(low|medium|high|critical|urgent)/i,
    /(low|medium|high|critical|urgent)\s+priority/i,
  ];
  
  let priority = 'medium'; // Default
  for (const pattern of priorityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      priority = match[1].toLowerCase();
      break;
    }
  }

  // Try to find assignee suggestion
  const assigneePatterns = [
    /assignee[:\s]+([^.\n]+)/i,
    /suggested assignee[:\s]+([^.\n]+)/i,
    /assign to[:\s]+([^.\n]+)/i,
  ];
  
  let suggestedAssignee = 'Review by team member'; // Default
  for (const pattern of assigneePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      suggestedAssignee = match[1].trim();
      // Clean up common prefixes/suffixes
      suggestedAssignee = suggestedAssignee.replace(/^(a|an|the)\s+/i, '');
      break;
    }
  }

  console.info('Extracted response from text using heuristics', {
    summaryLength: summary.length,
    priority,
    suggestedAssignee,
  });

  return {
    summary: summary || 'Unable to generate summary',
    priority,
    suggestedAssignee,
  };
}
