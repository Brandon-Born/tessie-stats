/**
 * Login DTOs
 *
 * @description Data transfer objects for user authentication
 */

import { IsString, MinLength } from 'class-validator';

/**
 * Login request body
 */
export class LoginDto {
  @IsString()
  @MinLength(1)
  password!: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  message: string;
}
