/**
 * Tesla API Constants
 *
 * @description Base URLs, endpoints, and configuration for Tesla Fleet API
 * @see docs/TESLA_API.md for API reference
 */

/**
 * Tesla Fleet API base URLs by region
 */
export const TESLA_API_BASE_URLS = {
  NORTH_AMERICA: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  EUROPE: 'https://fleet-api.prd.eu.vn.cloud.tesla.com',
  CHINA: 'https://fleet-api.prd.cn.vn.cloud.tesla.cn',
} as const;

/**
 * Default region (can be overridden via env var)
 */
export const DEFAULT_REGION = 'NORTH_AMERICA';

/**
 * Tesla Auth URLs
 */
export const TESLA_AUTH_URLS = {
  AUTHORIZE: 'https://auth.tesla.com/oauth2/v3/authorize',
  TOKEN: 'https://auth.tesla.com/oauth2/v3/token',
} as const;

/**
 * Required OAuth scopes
 */
export const TESLA_SCOPES = [
  'openid',
  'offline_access',
  'vehicle_device_data',
  'vehicle_cmds',
  'energy_device_data',
] as const;

/**
 * API endpoints
 */
export const TESLA_API_ENDPOINTS = {
  // Vehicle endpoints
  VEHICLES: '/api/1/vehicles',
  VEHICLE_DATA: (id: string) => `/api/1/vehicles/${id}/vehicle_data`,
  WAKE_VEHICLE: (id: string) => `/api/1/vehicles/${id}/wake_up`,

  // Energy endpoints
  PRODUCTS: '/api/1/products',
  SITE_STATUS: (siteId: string) => `/api/1/energy_sites/${siteId}/site_status`,
  SITE_LIVE_DATA: (siteId: string) => `/api/1/energy_sites/${siteId}/live_status`,
  SITE_HISTORY: (siteId: string) => `/api/1/energy_sites/${siteId}/calendar_history`,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 200,
  RETRY_AFTER_MS: 60000, // 1 minute
  MAX_RETRIES: 3,
} as const;

/**
 * Request timeout (30 seconds)
 */
export const REQUEST_TIMEOUT_MS = 30000;
