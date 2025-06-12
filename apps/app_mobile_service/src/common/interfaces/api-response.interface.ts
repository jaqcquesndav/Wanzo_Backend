/**
 * Standard API response structure as expected by the frontend.
 * This interface ensures all API responses follow the same format.
 */
export interface ApiResponse<T> {
  /**
   * Indicates if the operation was successful
   */
  success: boolean;
  
  /**
   * Human-readable message about the result
   */
  message: string;
  
  /**
   * The actual data returned by the API (null for errors)
   */
  data: T | null;
  
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Optional error details (only present for errors)
   */
  error?: string;
}
