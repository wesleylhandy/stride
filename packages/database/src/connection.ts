// Server-only - database operations must not run in client
if (typeof window !== 'undefined') {
  throw new Error(
    '@stride/database cannot be imported in client components. ' +
    'Database operations must be performed in Server Components or API routes.'
  );
}

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma v7: Connection URL is configured in prisma.config.ts for migrations
// For runtime, PrismaClient requires an adapter for PostgreSQL
function createPrismaClient() {
  // Try to get DATABASE_URL - it should be available at runtime
  // In Next.js, environment variables are available at runtime
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Provide a more helpful error message
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please ensure DATABASE_URL is set in your .env file or environment variables.'
    );
  }

  // Create PostgreSQL connection pool
  const pool = new Pool({ connectionString });
  
  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Lazy initialization - only create client when first accessed
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Test database connection health
 * @returns Promise<boolean> - true if connection is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Gracefully disconnect from the database
 * Closes Prisma client connection
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

/**
 * Get database connection status information
 * @returns Promise with connection status details
 */
export async function getDatabaseStatus(): Promise<{
  connected: boolean;
}> {
  const connected = await checkDatabaseHealth();
  return {
    connected,
  };
}

