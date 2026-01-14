/**
 * Tesla Service
 *
 * @description HTTP client wrapper for Tesla Fleet API
 * @see docs/TESLA_API.md for API reference
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  TESLA_API_BASE_URLS,
  TESLA_AUTH_URLS,
  TESLA_API_ENDPOINTS,
  DEFAULT_REGION,
  REQUEST_TIMEOUT_MS,
} from './tesla.constants';
import {
  TokenPair,
  TeslaResponse,
  TeslaVehicle,
  VehicleData,
  EnergySite,
  SiteStatus,
  LiveEnergyData,
  EnergyHistory,
  EnergyHistoryPeriod,
  TeslaApiError,
} from './tesla.types';

@Injectable()
export class TeslaService {
  private readonly logger = new Logger(TeslaService.name);
  private readonly apiClient: AxiosInstance;
  private readonly authClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Determine region from env or use default
    const region = this.configService.get<string>('TESLA_REGION') ?? DEFAULT_REGION;
    this.baseUrl = TESLA_API_BASE_URLS[region as keyof typeof TESLA_API_BASE_URLS];

    // Create API client for Fleet API
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Create auth client for OAuth endpoints
    this.authClient = axios.create({
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error: unknown) => this.handleApiError(error as AxiosError<TeslaApiError>)
    );
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenPair> {
    const clientId = this.configService.get<string>('TESLA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TESLA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Tesla API credentials not configured');
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('code', code);
      params.append('redirect_uri', redirectUri);

      const response = await this.authClient.post<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
      }>(TESLA_AUTH_URLS.TOKEN, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      this.logger.error('Failed to exchange authorization code', error);
      throw new HttpException('Failed to exchange authorization code', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Exchange refresh token for new access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const clientId = this.configService.get<string>('TESLA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TESLA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Tesla API credentials not configured');
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('refresh_token', refreshToken);

      const response = await this.authClient.post<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
      }>(TESLA_AUTH_URLS.TOKEN, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      this.logger.error('Failed to refresh access token', error);
      throw new HttpException('Failed to refresh Tesla access token', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Get list of vehicles
   */
  async getVehicles(accessToken: string): Promise<TeslaVehicle[]> {
    try {
      const response = await this.apiClient.get<TeslaResponse<TeslaVehicle[]>>(
        TESLA_API_ENDPOINTS.VEHICLES,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.response;
    } catch (error) {
      this.logger.error('Failed to get vehicles', error);
      throw error;
    }
  }

  /**
   * Get vehicle data with specific endpoints
   */
  async getVehicleData(
    accessToken: string,
    vehicleId: string,
    endpoints?: string[]
  ): Promise<VehicleData> {
    try {
      const params = endpoints ? { endpoints: endpoints.join(',') } : {};

      const response = await this.apiClient.get<TeslaResponse<VehicleData>>(
        TESLA_API_ENDPOINTS.VEHICLE_DATA(vehicleId),
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        }
      );

      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to get vehicle data for ${vehicleId}`, error);
      throw error;
    }
  }

  /**
   * Wake up a vehicle
   * Note: This uses battery - use sparingly
   */
  async wakeVehicle(accessToken: string, vehicleId: string): Promise<TeslaVehicle> {
    try {
      const response = await this.apiClient.post<TeslaResponse<TeslaVehicle>>(
        TESLA_API_ENDPOINTS.WAKE_VEHICLE(vehicleId),
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to wake vehicle ${vehicleId}`, error);
      throw error;
    }
  }

  /**
   * Get list of energy sites (Powerwall/Solar)
   */
  async getEnergySites(accessToken: string): Promise<EnergySite[]> {
    try {
      const response = await this.apiClient.get<TeslaResponse<Array<EnergySite | TeslaVehicle>>>(
        TESLA_API_ENDPOINTS.PRODUCTS,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Filter for energy sites only
      return response.data.response.filter(
        (product): product is EnergySite => 'energy_site_id' in product
      );
    } catch (error) {
      this.logger.error('Failed to get energy sites', error);
      throw error;
    }
  }

  /**
   * Get site status
   */
  async getSiteStatus(accessToken: string, siteId: string): Promise<SiteStatus> {
    try {
      const response = await this.apiClient.get<TeslaResponse<SiteStatus>>(
        TESLA_API_ENDPOINTS.SITE_STATUS(siteId),
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to get site status for ${siteId}`, error);
      throw error;
    }
  }

  /**
   * Get live energy data
   */
  async getSiteLiveData(accessToken: string, siteId: string): Promise<LiveEnergyData> {
    try {
      const response = await this.apiClient.get<TeslaResponse<LiveEnergyData>>(
        TESLA_API_ENDPOINTS.SITE_LIVE_DATA(siteId),
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to get live data for site ${siteId}`, error);
      throw error;
    }
  }

  /**
   * Get site energy history
   */
  async getSiteHistory(
    accessToken: string,
    siteId: string,
    period: EnergyHistoryPeriod = 'day'
  ): Promise<EnergyHistory> {
    try {
      const response = await this.apiClient.get<TeslaResponse<EnergyHistory>>(
        TESLA_API_ENDPOINTS.SITE_HISTORY(siteId),
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { kind: 'energy', period },
        }
      );

      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to get history for site ${siteId}`, error);
      throw error;
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: AxiosError<TeslaApiError>): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      this.logger.error(
        `Tesla API error: ${status} - ${data?.error || 'Unknown error'}`,
        error.response.data
      );

      switch (status) {
        case 401:
          throw new HttpException('Tesla API authentication failed', HttpStatus.UNAUTHORIZED);
        case 404:
          throw new HttpException('Tesla resource not found', HttpStatus.NOT_FOUND);
        case 408:
          throw new HttpException('Vehicle is asleep or offline', HttpStatus.REQUEST_TIMEOUT);
        case 429:
          throw new HttpException('Tesla API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
        default:
          throw new HttpException(data?.error || 'Tesla API request failed', status);
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new HttpException('Tesla API request timeout', HttpStatus.REQUEST_TIMEOUT);
    }

    throw new HttpException('Failed to communicate with Tesla API', HttpStatus.SERVICE_UNAVAILABLE);
  }
}
