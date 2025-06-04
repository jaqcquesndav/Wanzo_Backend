import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting Auth Service...');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Enable Helmet
  app.use(helmet());
  
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
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les propriétés qui n'ont pas de décorateurs
    forbidNonWhitelisted: true, // Génère une erreur si des propriétés non déclarées sont fournies
    transform: true, // Transforme automatiquement les payloads en instances de DTO
  }));

  // Définir un préfixe global pour toutes les routes
  app.setGlobalPrefix('api');
  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Wanzo Auth Service API')
    .setDescription(`
      Documentation complète des API du service d'authentification et d'autorisation Wanzo.
      
      Ce service gère l'authentification des utilisateurs, l'autorisation, la gestion des tokens JWT,
      et l'intégration avec les fournisseurs d'identité externes comme Auth0 et OpenID Connect.
      
      ## Fonctionnalités principales
      - Authentification utilisateur (login, register, refresh token)
      - Authentification à deux facteurs (2FA)
      - Gestion des utilisateurs et de leurs profils
      - Gestion des entreprises et de leurs paramètres
      - Intégration OAuth2/OIDC pour SSO
      - Gestion des sessions utilisateur
      - Vérification de l'état de santé du service
    `)
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Serveur de développement local')
    .addServer('https://api.wanzo.com/auth', 'Serveur de production')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        description: 'Entrez votre JWT token ici. Le token peut être obtenu via les endpoints /auth/login ou /auth/refresh'
      },
      'JWT-auth', // Ceci sert de clé pour référencer ce schéma de sécurité
    )
    .addTag('auth', 'Endpoints d\'authentification (login, register, refresh-token, 2FA)')
    .addTag('token', 'Gestion des tokens JWT (validation, blacklist)')
    .addTag('oauth', 'Endpoints OAuth2/OIDC pour l\'intégration avec des services tiers')
    .addTag('users', 'Gestion des utilisateurs et de leurs profils')
    .addTag('clients', 'Gestion des clients OIDC pour l\'intégration d\'applications tierces')
    .addTag('sessions', 'Gestion des sessions utilisateur et déconnexion')
    .addTag('companies', 'Gestion des entreprises et de leurs paramètres')
    .addTag('dashboard', 'Métriques et statistiques pour le tableau de bord')
    .addTag('health', 'Endpoint de vérification de santé du service')
    .setContact('Équipe Wanzo', 'https://wanzo.com', 'support@wanzo.com')
    .setLicense('Propriétaire', 'https://wanzo.com/terms')
    .setExternalDoc('Documentation supplémentaire', 'https://docs.wanzo.com')
    .setTermsOfService('https://wanzo.com/terms-of-service')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
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
    customSiteTitle: 'Wanzo Auth Service API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: 'https://wanzo.com/favicon.ico'
  };
  
  SwaggerModule.setup('api', app, document, customOptions);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Auth Service is running on port ${port}`);
}
bootstrap();