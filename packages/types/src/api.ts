export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    name?: string;
    role: string;
    avatarUrl?: string;
  };
  token: string;
}

// Link preview type
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  siteName?: string;
}

