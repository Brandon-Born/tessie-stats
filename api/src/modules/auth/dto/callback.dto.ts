/**
 * OAuth Callback DTOs
 *
 * @description Data transfer objects for Tesla OAuth callback
 */

import { IsString, IsOptional } from 'class-validator';

/**
 * Query parameters from Tesla OAuth callback
 */
export class CallbackQueryDto {
  @IsString()
  code!: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  issuer?: string;
}

/**
 * Response DTO for authorization URL
 */
export interface AuthUrlResponse {
  url: string;
}
