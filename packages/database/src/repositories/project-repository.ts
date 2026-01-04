import { prisma } from "../connection";
import type {
  IRepository,
  PaginationOptions,
  PaginatedResult,
} from "./index";
import type { Project, Prisma } from "@prisma/client";

export interface CreateProjectInput {
  key: string;
  name: string;
  description?: string;
  configYaml: string;
  config: Prisma.JsonValue;
  configVersion?: string;
  repositoryUrl?: string;
  repositoryType?: "GitHub" | "GitLab" | "Bitbucket";
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  configYaml?: string;
  config?: Prisma.JsonValue;
  configVersion?: string;
  repositoryUrl?: string;
  repositoryType?: "GitHub" | "GitLab" | "Bitbucket";
}

export class ProjectRepository
  implements IRepository<Project, CreateProjectInput, UpdateProjectInput>
{
  /**
   * Find a project by ID
   */
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  }

  /**
   * Find a project by key
   */
  async findByKey(key: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { key },
    });
  }

  /**
   * Find multiple projects with optional filtering
   */
  async findMany(filter?: Partial<Project>): Promise<Project[]> {
    const where: Prisma.ProjectWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.key) where.key = filter.key;
      if (filter.name) where.name = { contains: filter.name, mode: "insensitive" };
      if (filter.repositoryUrl) where.repositoryUrl = filter.repositoryUrl;
    }

    return prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find multiple projects with pagination
   */
  async findManyPaginated(
    filter?: Partial<Project>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Project>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = pagination?.skip ?? (page - 1) * pageSize;
    const take = pagination?.take ?? pageSize;

    const where: Prisma.ProjectWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.key) where.key = filter.key;
      if (filter.name) where.name = { contains: filter.name, mode: "insensitive" };
      if (filter.repositoryUrl) where.repositoryUrl = filter.repositoryUrl;
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({ where }),
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
   * Create a new project
   */
  async create(data: CreateProjectInput): Promise<Project> {
    // Check if key already exists
    const existing = await this.findByKey(data.key);
    if (existing) {
      throw new Error(`Project with key "${data.key}" already exists`);
    }

    return prisma.project.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        configYaml: data.configYaml,
        config: data.config,
        configVersion: data.configVersion,
        repositoryUrl: data.repositoryUrl,
        repositoryType: data.repositoryType,
      },
    });
  }

  /**
   * Update an existing project
   */
  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    // Check if project exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Project with id "${id}" not found`);
    }

    return prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        configYaml: data.configYaml,
        config: data.config,
        configVersion: data.configVersion,
        repositoryUrl: data.repositoryUrl,
        repositoryType: data.repositoryType,
      },
    });
  }

  /**
   * Delete a project by ID
   */
  async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }

  /**
   * Count projects matching optional filter
   */
  async count(filter?: Partial<Project>): Promise<number> {
    const where: Prisma.ProjectWhereInput = {};

    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.key) where.key = filter.key;
      if (filter.name) where.name = { contains: filter.name, mode: "insensitive" };
      if (filter.repositoryUrl) where.repositoryUrl = filter.repositoryUrl;
    }

    return prisma.project.count({ where });
  }

  /**
   * Check if a project exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.project.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if a project key exists
   */
  async keyExists(key: string): Promise<boolean> {
    const count = await prisma.project.count({
      where: { key },
    });
    return count > 0;
  }

  /**
   * Update project configuration
   */
  async updateConfig(
    id: string,
    configYaml: string,
    config: Prisma.JsonValue,
    configVersion?: string,
  ): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        configYaml,
        config,
        configVersion,
      },
    });
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();

