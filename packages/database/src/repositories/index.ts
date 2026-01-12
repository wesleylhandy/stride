/**
 * Repository pattern interfaces for database access
 * Implementations will be added in later phases
 */

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  skip?: number;
  take?: number;
}

/**
 * Paginated result containing items and metadata
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Base repository interface with common CRUD operations
 * @template T - Entity type
 * @template CreateInput - Input type for creating entities
 * @template UpdateInput - Input type for updating entities
 */
export interface IRepository<T, CreateInput, UpdateInput> {
  /**
   * Find a single entity by ID
   * @param id - Entity identifier
   * @returns Promise resolving to entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find multiple entities with optional filtering
   * @param filter - Optional filter criteria
   * @returns Promise resolving to array of entities
   */
  findMany(filter?: Partial<T>): Promise<T[]>;

  /**
   * Find multiple entities with pagination
   * @param filter - Optional filter criteria
   * @param pagination - Pagination options
   * @returns Promise resolving to paginated result
   */
  findManyPaginated(
    filter?: Partial<T>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<T>>;

  /**
   * Create a new entity
   * @param data - Entity creation data
   * @returns Promise resolving to created entity
   */
  create(data: CreateInput): Promise<T>;

  /**
   * Update an existing entity
   * @param id - Entity identifier
   * @param data - Entity update data
   * @returns Promise resolving to updated entity
   */
  update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Delete an entity by ID
   * @param id - Entity identifier
   * @returns Promise that resolves when deletion is complete
   */
  delete(id: string): Promise<void>;

  /**
   * Count entities matching optional filter
   * @param filter - Optional filter criteria
   * @returns Promise resolving to count of matching entities
   */
  count(filter?: Partial<T>): Promise<number>;

  /**
   * Check if an entity exists by ID
   * @param id - Entity identifier
   * @returns Promise resolving to true if entity exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}

// Export repository implementations
export * from "./project-repository";
export * from "./issue-repository";
export * from "./issue-branch-repository";
export * from "./cycle-repository";
export * from "./invitation-repository";
export * from "./global-infrastructure-config-repository";

