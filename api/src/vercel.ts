/**
 * Vercel Serverless Handler for NestJS
 *
 * @description Entry point for Vercel serverless functions
 * Exports the NestJS app as a handler compatible with @vercel/node
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any;

async function getApp(): Promise<any> {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: false,
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api');

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  const nestApp = await getApp();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  expressApp(req, res);
}
