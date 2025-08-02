/**
 * Standard API Response Interface
 * Used across all endpoints for consistent response format
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
}

/**
 * API Error Interface
 */
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Paginated Response Interface
 * Used for all list endpoints that support pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/**
 * Generic List Response (for non-paginated lists)
 */
export interface ListResponse<T> {
  items: T[];
  totalCount: number;
}
