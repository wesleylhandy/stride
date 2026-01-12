// Request/response logging middleware
import type { IncomingMessage, ServerResponse } from 'http';

export const requestLogger = {
  log(req: IncomingMessage): void {
    const timestamp = new Date().toISOString();
    const method = req.method || 'UNKNOWN';
    const url = req.url || '/';
    const ip = getClientIP(req);

    console.log(JSON.stringify({
      timestamp,
      type: 'request',
      method,
      url,
      ip,
      userAgent: req.headers['user-agent'],
    }));
  },

  logResponse(res: ServerResponse, responseData?: unknown): void {
    const timestamp = new Date().toISOString();
    const statusCode = res.statusCode || 200;

    console.log(JSON.stringify({
      timestamp,
      type: 'response',
      statusCode,
      responseSize: responseData ? JSON.stringify(responseData).length : 0,
    }));
  },

  logError(error: Error, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();

    console.error(JSON.stringify({
      timestamp,
      type: 'error',
      message: error.message,
      stack: error.stack,
      ...context,
    }));
  },
};

function getClientIP(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) return firstIP.trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return realIP;
  }

  // Fallback to connection remoteAddress
  const socket = req.socket;
  if (socket && socket.remoteAddress) {
    return socket.remoteAddress;
  }

  return 'unknown';
}
