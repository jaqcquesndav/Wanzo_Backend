import './tracing'; // Tracing setup runs on import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // Commented out
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
// import { TracingInterceptor } from './common/interceptors/tracing.interceptor'; // Commented out
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { initDatabase } from './database-init';

async function bootstrap() {
  // Initialize database with required enum types first
  try {
    await initDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Continue anyway, the DatabaseCheckService will provide more detailed information
  }

  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            return `${info.timestamp} [${info.level}]: ${info.message}`;
          }),
        ),
      }),
      // ... file transports ...
    ],
  });

  // **On ne crée qu'une seule application** basée sur AppModule
  const app = await NestFactory.create(AppModule, { logger });
  const configService = app.get(ConfigService);

  // Connect to Kafka as a client for producing messages
  // This setup allows the admin-service to send messages to Kafka.
  // If admin-service also needs to consume messages, a similar setup for a consumer group would be needed.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get<string>('KAFKA_CLIENT_ID', 'admin-service-producer'), // Unique client ID
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
        // Add SSL/SASL options here if needed, configured via environment variables
        // ssl: configService.get<string>('KAFKA_SSL_ENABLED') === 'true' ? {} : false,
        // sasl: configService.get<string>('KAFKA_SASL_MECHANISM') ? { mechanism: ..., username: ..., password: ...} : undefined,
      },
      // producer: { // Optional: Add producer-specific configurations if needed
      //   allowAutoTopicCreation: configService.get<boolean>('KAFKA_PRODUCER_ALLOW_AUTO_TOPIC_CREATION', true),
      // },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'admin-service-consumer-group'),
        allowAutoTopicCreation: true,
      },
    },
  }, { inheritAppConfig: true }); // inheritAppConfig allows sharing HTTP configurations if needed
  // Start all microservices (including the Kafka client connection) with error handling
  try {
    await app.startAllMicroservices();
    logger.log('Successfully connected to all microservices, including Kafka');
  } catch (error) {
    logger.warn('Failed to connect to some microservices. Application will continue without them.');
    logger.error(`Microservice connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // L'application continue de fonctionner même si Kafka n'est pas disponible
  }

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Security middleware
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:4000',  
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false },
  }));

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());
  // Global Interceptors
  app.useGlobalInterceptors(
    // new LoggingInterceptor(), // Commented out
    new TimeoutInterceptor(),
    // new TracingInterceptor(), // Commented out
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Wanzo Admin Service API')
    .setDescription(`
      Documentation complète des API du service d'administration Wanzo.
      
      Ce service gère les fonctionnalités d'administration du système, y compris la gestion des utilisateurs, 
      des entreprises, des finances, des paramètres système, et des documents.
      
      ## Fonctionnalités principales
      - Gestion des utilisateurs et de leurs rôles
      - Gestion des entreprises clientes
      - Gestion des documents administratifs
      - Paramètres et configuration du système
      - Tableaux de bord et métriques
      - Intégration avec le service d'authentification
    `)
    .setVersion('1.0')
    .addServer('http://localhost:3001', 'Serveur de développement local')
    .addServer('https://api.wanzo.com/admin', 'Serveur de production')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        description: 'Entrez votre JWT token ici. Le token peut être obtenu via les endpoints auth/login ou auth/refresh'
      },
      'JWT-auth'
    )
    // Suppression des tags manuels pour éviter la redondance avec les @ApiTags des contrôleurs
    .setContact('Équipe Wanzo', 'https://wanzo.com', 'support@wanzo.com')
    .setLicense('Propriétaire', 'https://wanzo.com/terms')
    .setExternalDoc('Documentation supplémentaire', 'https://docs.wanzo.com')
    .setTermsOfService('https://wanzo.com/terms-of-service')
    .build();
    
  // Options avancées pour Swagger UI
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',  // Changé de 'none' à 'list' pour montrer les tags développés mais les opérations fermées
      filter: true,
      displayRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      },
    },
    customSiteTitle: 'Wanzo Admin Service API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: 'https://wanzo.com/favicon.ico'
  };
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, customOptions);

  const port = configService.get<number>('PORT', 3001); // Port par défaut 3001 pour admin-service
  await app.listen(configService.get<number>('ADMIN_PORT', 3001)); // Use config for port
  logger.log(`Admin Service is running on port ${configService.get<number>('ADMIN_PORT', 3001)}`);
}
bootstrap();
