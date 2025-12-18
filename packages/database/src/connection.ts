import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma v7: Connection URL is configured in prisma.config.ts for migrations
// For runtime, PrismaClient reads DATABASE_URL from environment variables
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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

