/**
 * Tessie Stats API - Entry Point
 *
 * @description NestJS application entry point for Tesla & Powerwall dashboard
 * @see PROJECT.md for project documentation
 * @see ARCHITECTURE.md for technical specifications
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 Tessie Stats API running on port ${port}`);
}

void bootstrap();
