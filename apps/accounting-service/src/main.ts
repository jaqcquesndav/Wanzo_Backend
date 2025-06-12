// main.ts
import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

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

  // 1) Crée l'application à partir de AppModule
  const app = await NestFactory.create(AppModule, { logger });

  // Get ConfigService to access environment variables for Kafka
  const configService = app.get(ConfigService);

  // Kafka Microservice Connection
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get<string>('KAFKA_CLIENT_ID', 'accounting-service-client'),
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
        // Add SSL/SASL options here if needed, configured via environment variables
        // ssl: configService.get<string>(\'KAFKA_SSL_ENABLED\') === \'true\' ? {} : false,
        // sasl: configService.get<string>(\'KAFKA_SASL_MECHANISM\') ? { mechanism: ..., username: ..., password: ...} : undefined,
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_CONSUMER_GROUP_ID', 'accounting-consumer-group'),
      },
    },
  });

  // Start all microservices
  await app.startAllMicroservices();
  
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
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600,
  });
  
  // 5) Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false },
  }));

  // 6) Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Kiota Accounting Service API')
    .setDescription('The Kiota Accounting Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('accounts')
    .addTag('journals')
    .addTag('reports')
    .addTag('treasury')
    .addTag('taxes')
    .addTag('chat')
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 7) Démarre l'app sur le port 3003
  await app.listen(3003);

  // ➜ TON endpoint `/metrics` se trouvera sur http://localhost:3003/metrics
  //    Parce que dans AppModule -> MonitoringModule -> PrometheusController
}
bootstrap();
