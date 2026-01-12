import { prisma } from "../connection";
import type { GlobalInfrastructureConfig, Prisma } from "@prisma/client";

export interface UpdateGlobalInfrastructureConfigInput {
  gitConfig?: Prisma.InputJsonValue;
  aiConfig?: Prisma.InputJsonValue;
  updatedBy?: string | null;
}

/**
 * Global infrastructure configuration repository
 * Implements singleton pattern - only one global config record exists
 */
export class GlobalInfrastructureConfigRepository {
  /**
   * Get the global infrastructure configuration, creating it if it doesn't exist
   * Singleton pattern: only one record should exist
   */
  async getOrCreate(): Promise<GlobalInfrastructureConfig> {
    // Try to find existing config (singleton table - only one record exists)
    const existing = await prisma.globalInfrastructureConfig.findFirst();

    if (existing) {
      return existing;
    }

    // Create new config if none exists
    return prisma.globalInfrastructureConfig.create({
      data: {
        gitConfig: {},
        aiConfig: {},
      },
    });
  }

  /**
   * Get the global infrastructure configuration
   * Returns null if no config exists (gracefully handles first-time setup)
   * 
   * Note: The updatedByUser relation is optional for audit trail.
   * If Prisma client is out of sync, this will work without the relation.
   */
  async get(): Promise<GlobalInfrastructureConfig | null> {
    // Query without relation include - relation is optional (just for audit trail display)
    // Using findFirst without orderBy to avoid potential Prisma client issues
    // Since this is a singleton table, orderBy isn't necessary
    const config = await prisma.globalInfrastructureConfig.findFirst();
    
    // If no config exists, return null (expected for first-time setup)
    if (!config) {
      return null;
    }
    
    // Return config without user relation (relation can be added back later if needed)
    return config;
  }

  /**
   * Update the global infrastructure configuration
   * Uses upsert pattern to ensure only one record exists
   */
  async update(
    data: UpdateGlobalInfrastructureConfigInput,
  ): Promise<GlobalInfrastructureConfig> {
    // Get or create config first
    const existing = await this.getOrCreate();

    // Update the existing record
    // Only include fields that are explicitly provided
    // Prisma will leave fields unchanged if they're not included
    return prisma.globalInfrastructureConfig.update({
      where: { id: existing.id },
      data: {
        ...(data.gitConfig !== undefined && { gitConfig: data.gitConfig }),
        ...(data.aiConfig !== undefined && { aiConfig: data.aiConfig }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      },
    });
  }

  /**
   * Find by ID (convenience method)
   */
  async findById(id: string): Promise<GlobalInfrastructureConfig | null> {
    // Query without relation include for now (relation is optional for audit trail)
    // TODO: Add relation include back after Prisma client is properly regenerated
    return prisma.globalInfrastructureConfig.findUnique({
      where: { id },
    });
  }
}

// Export singleton instance
export const globalInfrastructureConfigRepository =
  new GlobalInfrastructureConfigRepository();
