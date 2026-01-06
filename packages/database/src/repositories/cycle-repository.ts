import { prisma } from "../connection";
import type {
  IRepository,
  PaginationOptions,
  PaginatedResult,
} from "./index";
import type { Cycle, Prisma } from "@prisma/client";
import type {
  CreateCycleInput,
  UpdateCycleInput,
} from "@stride/types";

/**
 * Cycle repository implementing CRUD operations for cycles
 */
export class CycleRepository
  implements IRepository<Cycle, CreateCycleInput, UpdateCycleInput>
{
  /**
   * Find a cycle by ID
   */
  async findById(id: string): Promise<Cycle | null> {
    return prisma.cycle.findUnique({
      where: { id },
      include: {
        issues: true,
      },
    });
  }

  /**
   * Find a cycle by project ID and name
   */
  async findByName(
    projectId: string,
    name: string,
  ): Promise<Cycle | null> {
    return prisma.cycle.findFirst({
      where: {
        projectId,
        name,
      },
    });
  }

  /**
   * Find multiple cycles with optional filtering
   */
  async findMany(filter?: Partial<Cycle>): Promise<Cycle[]> {
    const where: Prisma.CycleWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.name) where.name = { contains: filter.name, mode: "insensitive" };
    }

    return prisma.cycle.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        issues: true,
      },
    });
  }

  /**
   * Find multiple cycles with pagination
   */
  async findManyPaginated(
    filter?: Partial<Cycle>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Cycle>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = pagination?.skip ?? (page - 1) * pageSize;
    const take = pagination?.take ?? pageSize;

    const where: Prisma.CycleWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.name) where.name = { contains: filter.name, mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      prisma.cycle.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: "desc" },
        include: {
          issues: true,
        },
      }),
      prisma.cycle.count({ where }),
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
   * Create a new cycle
   */
  async create(data: CreateCycleInput): Promise<Cycle> {
    // Validate that endDate is after startDate
    if (data.endDate < data.startDate) {
      throw new Error("End date must be after start date");
    }

    // Check if name already exists for this project
    const existing = await this.findByName(data.projectId, data.name);
    if (existing) {
      throw new Error(`Cycle with name "${data.name}" already exists in this project`);
    }

    return prisma.cycle.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        goal: data.goal,
      },
      include: {
        issues: true,
      },
    });
  }

  /**
   * Update an existing cycle
   */
  async update(id: string, data: UpdateCycleInput): Promise<Cycle> {
    // Check if cycle exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Cycle with id "${id}" not found`);
    }

    // Validate date range if both dates are being updated
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      throw new Error("End date must be after start date");
    }

    // Validate date range if only one date is being updated
    if (data.startDate && !data.endDate && existing.endDate < data.startDate) {
      throw new Error("End date must be after start date");
    }

    if (data.endDate && !data.startDate && data.endDate < existing.startDate) {
      throw new Error("End date must be after start date");
    }

    // If name is being updated, check for conflicts
    if (data.name && data.name !== existing.name) {
      const nameConflict = await this.findByName(existing.projectId, data.name);
      if (nameConflict) {
        throw new Error(`Cycle with name "${data.name}" already exists in this project`);
      }
    }

    return prisma.cycle.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        goal: data.goal,
      },
      include: {
        issues: true,
      },
    });
  }

  /**
   * Delete a cycle by ID
   */
  async delete(id: string): Promise<void> {
    await prisma.cycle.delete({
      where: { id },
    });
  }

  /**
   * Count cycles matching optional filter
   */
  async count(filter?: Partial<Cycle>): Promise<number> {
    const where: Prisma.CycleWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.name) where.name = { contains: filter.name, mode: "insensitive" };
    }

    return prisma.cycle.count({ where });
  }

  /**
   * Check if a cycle exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.cycle.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Get all issues assigned to a cycle
   */
  async getIssues(cycleId: string) {
    return prisma.issue.findMany({
      where: {
        cycleId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Assign an issue to a cycle
   */
  async assignIssue(cycleId: string, issueId: string): Promise<void> {
    // Verify cycle exists
    const cycle = await this.findById(cycleId);
    if (!cycle) {
      throw new Error(`Cycle with id "${cycleId}" not found`);
    }

    // Update issue
    await prisma.issue.update({
      where: { id: issueId },
      data: { cycleId },
    });
  }

  /**
   * Unassign an issue from a cycle
   */
  async unassignIssue(issueId: string): Promise<void> {
    await prisma.issue.update({
      where: { id: issueId },
      data: { cycleId: null },
    });
  }

  /**
   * Assign multiple issues to a cycle
   */
  async assignIssues(cycleId: string, issueIds: string[]): Promise<void> {
    // Verify cycle exists
    const cycle = await this.findById(cycleId);
    if (!cycle) {
      throw new Error(`Cycle with id "${cycleId}" not found`);
    }

    // Update all issues in a transaction
    await prisma.$transaction(
      issueIds.map((issueId) =>
        prisma.issue.update({
          where: { id: issueId },
          data: { cycleId },
        }),
      ),
    );
  }
}

// Export singleton instance
export const cycleRepository = new CycleRepository();

