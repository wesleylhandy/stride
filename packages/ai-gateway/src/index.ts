// AI Gateway service entry point
import { createServer } from 'http';
import { handleRequest } from './routes';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error('Unhandled error in request handler:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      }));
    }
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`AI Gateway service listening on http://${HOSTNAME}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});