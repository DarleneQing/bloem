// API Response and Error Types

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: ValidationError[] | ConflictDetails | Record<string, unknown>;
}

/**
 * Validation error from API
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Conflict details (e.g., overlapping markets)
 */
export interface ConflictDetails {
  overlappingMarkets?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }>;
  [key: string]: unknown;
}

/**
 * Zod validation error structure
 */
export interface ZodValidationError {
  errors: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}

/**
 * Type guard for Zod errors
 */
export function isZodError(error: unknown): error is ZodValidationError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'errors' in error &&
    Array.isArray((error as ZodValidationError).errors)
  );
}

/**
 * Type guard for API error responses
 */
export function isApiError(response: unknown): response is ApiResponse<never> {
  return (
    response !== null &&
    typeof response === 'object' &&
    'success' in response &&
    (response as ApiResponse).success === false
  );
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isZodError(error)) {
    return error.errors[0]?.message || 'Validation error';
  }
  return 'An unknown error occurred';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Common query parameters
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
