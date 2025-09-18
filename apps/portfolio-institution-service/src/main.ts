// Ensure environment variables are loaded first, before any other imports
import './env-loader';
// Then other imports
// Temporarily disable tracing to debug startup issues
// import './tracing';
console.log('OpenTelemetry tracing disabled temporarily for debugging');
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
// Use local Kafka config instead of shared module to avoid dependency issues
// import { getKafkaConfig } from '@wanzobe/shared/events/kafka-config';
import { getLocalKafkaConfig } from './config/kafka-config';
import { setupSwagger } from './swagger.config';

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
  const configService = app.get(ConfigService);

  // Kafka microservice connection - try but don't block startup if it fails
  try {
    const kafkaConfig = getLocalKafkaConfig(configService);
    app.connectMicroservice(kafkaConfig);
    logger.log('Connected Kafka microservice');
  } catch (error: any) {
    logger.warn('Failed to connect to Kafka, continuing without it: ' + (error.message || 'Unknown error'));
  }
  
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
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-request-time'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // 4.5) Set global prefix for API versioning (to match frontend expectations)
  // app.setGlobalPrefix('api/v1', {
  //   exclude: ['/health', '/health/simple', '/metrics'], // Exclude health and monitoring endpoints
  // });
  
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
  setupSwagger(app);

  // Start all microservices
  await app.startAllMicroservices();

  // 7) Lance le service sur le port 3005
  await app.listen(configService.get<number>('PORTFOLIO_INSTITUTION_SERVICE_PORT', 3005));
  logger.log(`Portfolio Institution Service is running on: ${await app.getUrl()}`);
}
bootstrap();
