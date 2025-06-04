import './tracing'; // Tracing setup runs on import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // Commented out
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
// import { TracingInterceptor } from './common/interceptors/tracing.interceptor'; // Commented out
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';

async function bootstrap() {
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
    .addTag('auth', 'Authentification et autorisation')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('company', 'Gestion des entreprises')
    .addTag('customers', 'Gestion des clients')
    .addTag('documents', 'Gestion des documents')
    .addTag('settings', 'Paramètres du système')
    .addTag('dashboard', 'Tableau de bord et statistiques')
    .addTag('finance', 'Gestion financière')
    .addTag('system', 'Opérations système')
    .addTag('tokens', 'Gestion des tokens')
    .addTag('chat', 'Service de messagerie')
    .setContact('Équipe Wanzo', 'https://wanzo.com', 'support@wanzo.com')
    .setLicense('Propriétaire', 'https://wanzo.com/terms')
    .setExternalDoc('Documentation supplémentaire', 'https://docs.wanzo.com')
    .setTermsOfService('https://wanzo.com/terms-of-service')
    .build();
    
  // Options avancées pour Swagger UI
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
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
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
