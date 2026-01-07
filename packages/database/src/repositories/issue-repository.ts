import { prisma } from "../connection";
import type {
  IRepository,
  PaginationOptions,
  PaginatedResult,
} from "./index";
import type { Issue, Prisma } from "@prisma/client";
import type {
  CreateIssueInput,
  UpdateIssueInput,
} from "@stride/types";
import { projectRepository } from "./project-repository";

/**
 * Issue repository implementing CRUD operations for issues
 */
export class IssueRepository
  implements IRepository<Issue, CreateIssueInput, UpdateIssueInput>
{
  /**
   * Find an issue by ID
   */
  async findById(id: string): Promise<Issue | null> {
    return prisma.issue.findUnique({
      where: { id },
    });
  }

  /**
   * Find an issue by project ID and key
   */
  async findByKey(projectId: string, key: string): Promise<Issue | null> {
    return prisma.issue.findFirst({
      where: {
        projectId,
        key,
      },
    });
  }

  /**
   * Find multiple issues with optional filtering
   */
  async findMany(filter?: Partial<Issue>): Promise<Issue[]> {
    const where: Prisma.IssueWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.key) where.key = filter.key;
      if (filter.status) where.status = filter.status;
      if (filter.type) where.type = filter.type;
      if (filter.priority) where.priority = filter.priority;
      if (filter.reporterId) where.reporterId = filter.reporterId;
      if (filter.assigneeId !== undefined) {
        if (filter.assigneeId === null) {
          where.assigneeId = null;
        } else {
          where.assigneeId = filter.assigneeId;
        }
      }
      if (filter.cycleId !== undefined) {
        if (filter.cycleId === null) {
          where.cycleId = null;
        } else {
          where.cycleId = filter.cycleId;
        }
      }
    }

    return prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find multiple issues with pagination
   */
  async findManyPaginated(
    filter?: Partial<Issue>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Issue>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = pagination?.skip ?? (page - 1) * pageSize;
    const take = pagination?.take ?? pageSize;

    const where: Prisma.IssueWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.key) where.key = filter.key;
      if (filter.status) where.status = filter.status;
      if (filter.type) where.type = filter.type;
      if (filter.priority) where.priority = filter.priority;
      if (filter.reporterId) where.reporterId = filter.reporterId;
      if (filter.assigneeId !== undefined) {
        if (filter.assigneeId === null) {
          where.assigneeId = null;
        } else {
          where.assigneeId = filter.assigneeId;
        }
      }
      if (filter.cycleId !== undefined) {
        if (filter.cycleId === null) {
          where.cycleId = null;
        } else {
          where.cycleId = filter.cycleId;
        }
      }
    }

    const [items, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.issue.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Create a new issue with automatic key generation
   * Handles concurrent creation to prevent duplicate keys (T103)
   */
  async create(data: CreateIssueInput & { reporterId: string }): Promise<Issue> {
    // Use transaction to handle concurrent creation
    return prisma.$transaction(async (tx) => {
      // Generate key within transaction to prevent duplicates
      const key = await this.generateNextKeyWithTx(data.projectId, tx);

      return tx.issue.create({
        data: {
          key,
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          status: data.status || "Backlog",
          type: data.type || "Task",
          priority: data.priority,
          reporterId: data.reporterId,
          assigneeId: data.assigneeId,
          cycleId: data.cycleId,
          customFields: (data.customFields || {}) as Prisma.InputJsonValue,
          storyPoints: data.storyPoints,
        },
      });
    });
  }

  /**
   * Generate next key within a transaction to handle concurrency
   * Private helper for use in transactions
   */
  private async generateNextKeyWithTx(
    projectId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    // Get project to retrieve project key
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    // Find the highest issue number for this project within transaction
    const issues = await tx.issue.findMany({
      where: { projectId },
      select: { key: true },
      orderBy: { createdAt: "desc" },
    });

    // Extract numbers from keys (format: PROJECT-NUMBER)
    const projectKey = project.key;
    let maxNumber = 0;

    for (const issue of issues) {
      const match = issue.key.match(/^(.+)-(\d+)$/);
      if (match && match[1] === projectKey && match[2]) {
        const number = parseInt(match[2], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    // Generate next key
    const nextNumber = maxNumber + 1;
    return `${projectKey}-${nextNumber}`;
  }

  /**
   * Update an existing issue
   */
  async update(id: string, data: UpdateIssueInput): Promise<Issue> {
    // Check if issue exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Issue with id "${id}" not found`);
    }

    return prisma.issue.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        type: data.type,
        priority: data.priority,
        assigneeId: data.assigneeId,
        cycleId: data.cycleId,
        customFields: data.customFields !== undefined ? (data.customFields as Prisma.InputJsonValue) : undefined,
        storyPoints: data.storyPoints,
        closedAt: data.status === "Done" ? existing.closedAt || new Date() : null,
      },
    });
  }

  /**
   * Delete an issue by ID
   */
  async delete(id: string): Promise<void> {
    await prisma.issue.delete({
      where: { id },
    });
  }

  /**
   * Count issues matching optional filter
   */
  async count(filter?: Partial<Issue>): Promise<number> {
    const where: Prisma.IssueWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.key) where.key = filter.key;
      if (filter.status) where.status = filter.status;
      if (filter.type) where.type = filter.type;
      if (filter.priority) where.priority = filter.priority;
      if (filter.reporterId) where.reporterId = filter.reporterId;
      if (filter.assigneeId !== undefined) {
        if (filter.assigneeId === null) {
          where.assigneeId = null;
        } else {
          where.assigneeId = filter.assigneeId;
        }
      }
      if (filter.cycleId !== undefined) {
        if (filter.cycleId === null) {
          where.cycleId = null;
        } else {
          where.cycleId = filter.cycleId;
        }
      }
    }

    return prisma.issue.count({ where });
  }

  /**
   * Check if an issue exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.issue.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if an issue key exists in a project
   */
  async keyExists(projectId: string, key: string): Promise<boolean> {
    const issue = await prisma.issue.findFirst({
      where: {
        projectId,
        key,
      },
    });
    return issue !== null;
  }

  /**
   * Generate the next issue key for a project (PROJECT-NUMBER format)
   * This method finds the highest issue number in the project and increments it
   * 
   * @param projectId - Project ID
   * @returns Promise resolving to the next issue key (e.g., "APP-123")
   */
  async generateNextKey(projectId: string): Promise<string> {
    // Get project to retrieve project key
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    // Find the highest issue number for this project
    const issues = await prisma.issue.findMany({
      where: { projectId },
      select: { key: true },
      orderBy: { createdAt: "desc" },
    });

    // Extract numbers from keys (format: PROJECT-NUMBER)
    const projectKey = project.key;
    let maxNumber = 0;

    for (const issue of issues) {
      const match = issue.key.match(/^(.+)-(\d+)$/);
      if (match && match[1] === projectKey && match[2]) {
        const number = parseInt(match[2], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    // Generate next key
    const nextNumber = maxNumber + 1;
    return `${projectKey}-${nextNumber}`;
  }

  /**
   * Search issues by query string (searches in title, description, and key)
   * @param projectId - Project ID to search within
   * @param query - Search query string
   * @param pagination - Optional pagination options
   * @returns Promise resolving to paginated search results
   */
  async search(
    projectId: string,
    query: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Issue>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = pagination?.skip ?? (page - 1) * pageSize;
    const take = pagination?.take ?? pageSize;

    const searchTerm = query.trim();

    const where: Prisma.IssueWhereInput = {
      projectId,
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { key: { contains: searchTerm, mode: "insensitive" } },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.issue.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

// Export singleton instance
export const issueRepository = new IssueRepository();

