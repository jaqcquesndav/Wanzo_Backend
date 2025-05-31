import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
          }),
        ),
      }),
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  // 1) Crée l'application principale à partir d'AppModule
  const app = await NestFactory.create(AppModule, { logger });
  
  // 2) Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 3) Security middleware
  app.use(helmet());
  
  // 4) CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Frontend
      'http://localhost:3001',  // Admin Service
      'http://localhost:3002',  // Analytics Service
      'http://localhost:3003',  // Accounting Service
      'http://localhost:3004',  // Portfolio SME Service
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600,
  });
  
  // 5) Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    }),
  );

  // 6) Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Kiota Portfolio SME Service API')
    .setDescription('The Kiota Portfolio SME Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('operations', 'Operations management')
    .addTag('portfolios', 'Portfolio management')
    .addTag('assets', 'Asset management')
    .addTag('health', 'System health and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ❌ Supprimé: NestFactory.create(PrometheusController)

  // 7) Lance l'app sur le port 3004
  await app.listen(3004);
  logger.log(`Portfolio SME Service is running on port 3004`);
}
bootstrap();
