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
          winston.format.json()
        ),
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      }),
    ],
  });

  // 1) Création d'une seule app Nest avec AppModule
  const app = await NestFactory.create(AppModule, { logger });
  
  // 2) Remove versioning - it's interfering with our proxy routing
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   prefix: 'v',
  //   defaultVersion: '1',
  // });

  // 3) Security middleware
  app.use(helmet());
  
  // 4) CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000', // Frontend classique
      'http://localhost:5173', // Frontend Vite dev server
      'http://localhost:5175', // Frontend Accounting
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-request-time', 'x-client-version', 'x-accounting-client', 'x-customer-client'],
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
    .setTitle('Kiota API Gateway')
    .setDescription('The Kiota API Gateway documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('proxy', 'API Gateway proxy endpoints')
    .addTag('health', 'System health and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 7) Démarrage sur le port 8000
  await app.listen(8000);
  logger.log(`API Gateway is running on port 8000`);
}
bootstrap();
