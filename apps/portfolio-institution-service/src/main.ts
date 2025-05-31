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

  // 1) Crée une seule application Nest à partir d'AppModule
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
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
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

  // 6) Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Kiota Portfolio Institution Service API')
    .setDescription('The Kiota Portfolio Institution Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('institution', 'Institution profile management')
    .addTag('prospection', 'Company prospection and analysis')
    .addTag('portfolios', 'Portfolio management')
    .addTag('operations', 'Operations management')
    .addTag('reports', 'Reports and analytics')
    .addTag('messages', 'Messaging system')
    .addTag('notifications', 'Notifications management')
    .addTag('settings', 'System settings')
    .addTag('health', 'System health and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 7) Lance le service sur le port 3005
  await app.listen(3005);
  logger.log(`Portfolio Institution Service is running on port 3005`);
}
bootstrap();
