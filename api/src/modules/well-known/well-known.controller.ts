/**
 * Well-Known Controller
 *
 * @description Serves .well-known resources for Tesla Fleet API
 */

import { Controller, Get, Res, HttpStatus, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('.well-known/appspecific')
export class WellKnownController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * GET /.well-known/appspecific/com.tesla.3p.public-key.pem
   * Serves the Tesla Fleet API public key
   *
   * Tesla requires this endpoint to validate vehicle commands
   * The public key must be PEM-encoded EC key using secp256r1 curve
   */
  @Get('com.tesla.3p.public-key.pem')
  getTeslaPublicKey(@Res() res: Response): void {
    const publicKey = this.configService.get<string>('TESLA_PUBLIC_KEY');

    if (!publicKey) {
      throw new HttpException(
        'Tesla public key not configured. Set TESLA_PUBLIC_KEY environment variable.',
        HttpStatus.NOT_FOUND
      );
    }

    // Tesla expects the key in PEM format
    res.type('application/x-pem-file');
    res.send(publicKey);
  }
}
