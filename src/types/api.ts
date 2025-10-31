/**
 * API Error Response Types
 *
 * Standardized error response structure for API endpoints
 */

export interface ApiErrorResponse {
  message: string;
  error?: string;
  details?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Parse API error response and extract user-friendly message
 * @param errorData - The error data from the API response
 * @param fallbackMessage - Fallback message if no specific error found
 * @returns User-friendly error message
 */
export function getApiErrorMessage(
  errorData: Partial<ApiErrorResponse>,
  fallbackMessage: string = 'An error occurred'
): string {
  return errorData.details || errorData.error || errorData.message || fallbackMessage;
}

/**
 * Check if an error is an API error response
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'error' in error || 'details' in error)
  );
}
