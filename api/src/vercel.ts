/**
 * Vercel Serverless Handler for NestJS
 *
 * @description Entry point for Vercel serverless functions
 * Exports the NestJS app as a handler compatible with @vercel/node
 *
 * Note: Type safety is relaxed in this file due to Vercel's serverless requirements
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/explicit-module-boundary-types */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

let app: any;

async function getApp(): Promise<any> {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: false,
    });

    // Global prefix for all routes (except .well-known)
    app.setGlobalPrefix('api', {
      exclude: ['.well-known/appspecific/com.tesla.3p.public-key.pem'],
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    // CORS for frontend
    app.enableCors({
      origin: process.env.FRONTEND_URL ?? '*',
      credentials: true,
    });

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any): Promise<void> {
  const nestApp = await getApp();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  expressApp(req, res);
}
