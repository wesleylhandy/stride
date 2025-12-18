// Re-export Prisma types from database package
// Import from @stride/database which has @prisma/client as a dependency
export type {
  User as PrismaUser,
  Project as PrismaProject,
  Issue as PrismaIssue,
  Cycle as PrismaCycle,
  Comment as PrismaComment,
  Attachment as PrismaAttachment,
  RepositoryConnection as PrismaRepositoryConnection,
  IssueBranch as PrismaIssueBranch,
  Webhook as PrismaWebhook,
  Session as PrismaSession,
} from '@prisma/client';

// Note: @prisma/client must be available via @stride/database dependency
// This file will work once Prisma client is generated in the database package

