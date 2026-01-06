// Server-only package - prevent client-side usage
if (typeof window !== 'undefined') {
  throw new Error(
    '@stride/database cannot be imported in client components. ' +
    'Database operations must be performed in Server Components or API routes.'
  );
}

// Database package exports
export {
  prisma,
  checkDatabaseHealth,
  disconnectDatabase,
  getDatabaseStatus,
} from './connection';
export * from './repositories';
export * from '@prisma/client';

