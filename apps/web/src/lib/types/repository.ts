/**
 * Repository information from git providers
 */
export interface RepositoryInfo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
  isConnected?: boolean;
}

/**
 * Pagination information for repository listing
 */
export interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
