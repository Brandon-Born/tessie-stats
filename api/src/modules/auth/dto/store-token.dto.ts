/**
 * Auth DTOs
 *
 * @description Data transfer objects for authentication endpoints
 */

/**
 * Response DTO for auth status
 */
export interface AuthStatusDto {
  authenticated: boolean;
  hasToken: boolean;
  message?: string;
}

/**
 * Response DTO for token operations
 */
export interface StoreTokenResponseDto {
  success: boolean;
  message: string;
}
