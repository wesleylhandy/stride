// HTTP routes for AI Gateway service
import type { IncomingMessage, ServerResponse } from 'http';
import type { AnalyzeIssueRequest } from './types';
import { analyzeIssue } from './lib/analyze-issue';
import { requestLogger } from './middleware/logging';
import { rateLimiter } from './middleware/rate-limit';
import { parseJSON, sendJSON, sendError } from './lib/http-utils';

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter(req);
  if (!rateLimitResult.allowed) {
    sendError(res, 429, 'Too Many Requests', {
      message: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter,
    });
    return;
  }

  // Apply request logging
  requestLogger.log(req);

  // Parse URL
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const method = req.method || 'GET';
  const pathname = url.pathname;

  // Route handling
  if (method === 'POST' && pathname === '/analyze-issue') {
    await handleAnalyzeIssue(req, res);
    return;
  }

  // Health check endpoint
  if (method === 'GET' && pathname === '/health') {
    sendJSON(res, 200, { status: 'ok' });
    return;
  }

  // 404 for unknown routes
  sendError(res, 404, 'Not Found', { message: 'Endpoint not found' });
}

async function handleAnalyzeIssue(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    // Parse request body
    const body = await parseJSON<AnalyzeIssueRequest>(req);

    // Validate request structure
    if (!body.issueContext) {
      sendError(res, 400, 'Bad Request', {
        message: 'Missing required field: issueContext',
      });
      return;
    }

    if (!body.issueContext.title || !body.issueContext.description) {
      sendError(res, 400, 'Bad Request', {
        message: 'issueContext must include title and description',
      });
      return;
    }

    // Analyze issue (pass provider config if provided)
    const result = await analyzeIssue(body.issueContext, body.projectConfig, body.providerConfig);

    // Log response
    requestLogger.logResponse(res, result);

    // Send response
    sendJSON(res, 200, result);
  } catch (error) {
    console.error('Error analyzing issue:', error);
    sendError(res, 500, 'Internal Server Error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
