import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // For prisma generate, DATABASE_URL is not required (only needed for migrations)
    // Use a dummy value if not set to allow generate to work
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
    // directUrl is optional - only needed when using connection poolers
    ...(process.env.DIRECT_URL && { directUrl: env('DIRECT_URL') }),
  },
});

