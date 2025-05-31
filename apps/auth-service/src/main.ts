import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting Auth Service...');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Configuration CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Frontend
      'http://localhost:3001',  // Admin Service
      'http://localhost:3002',  // Analytics Service
      'http://localhost:4000',  // Autre service potentiel
      'http://localhost:5173',  // Frontend Vite dev server
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Kiota Auth Service API')
    .setDescription('The Kiota Authentication and Authorization Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('oauth', 'OAuth2/OIDC endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('clients', 'OIDC client management endpoints')
    .addTag('sessions', 'Session management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Auth Service is running on port ${port}`);
}
bootstrap();