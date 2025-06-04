import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Helmet
  app.use(helmet());

  app.setGlobalPrefix('api'); // As per API documentation base URL
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip away properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
    transform: true, // Automatically transform payloads to DTO instances
  }));
  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Wanzo App Mobile Service API')
    .setDescription(`
      Documentation complète des API du service mobile Wanzo.
      
      Ce service gère les fonctionnalités principales de l'application mobile, y compris:
      - Gestion des produits et du stock
      - Enregistrement des ventes et factures
      - Gestion des clients et fournisseurs
      - Abonnements et paiements
      - Gestion des documents
      - Authentification et sécurité
      
      ## Guide d'utilisation
      Toutes les requêtes authentifiées nécessitent un token JWT valide dans l'en-tête Authorization:
      \`\`\`
      Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      \`\`\`
    `)
    .setVersion('1.0')
    .addServer('http://localhost:3006', 'Serveur de développement local')
    .addServer('https://api.wanzo.com/mobile', 'Serveur de production')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        description: 'Entrez votre JWT token ici. Le token peut être obtenu via les endpoints auth/login ou auth/refresh'
      },
      'JWT-auth'
    )
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('products', 'Gestion des produits et du stock')
    .addTag('sales', 'Gestion des ventes et factures')
    .addTag('customers', 'Gestion des clients')
    .addTag('suppliers', 'Gestion des fournisseurs')
    .addTag('company', 'Gestion de l\'entreprise')
    .addTag('documents', 'Gestion des documents et fichiers')
    .addTag('subscriptions', 'Gestion des abonnements et paiements')
    .addTag('expenses', 'Gestion des dépenses')
    .addTag('financing', 'Options de financement')
    .addTag('notifications', 'Gestion des notifications')
    .addTag('settings', 'Paramètres utilisateur et application')
    .addTag('operations', 'Journal des opérations')
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
    customSiteTitle: 'Wanzo App Mobile API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: 'https://wanzo.com/favicon.ico'
  };
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, customOptions);
  // Add other global configurations: CORS, etc.
  const port = process.env.PORT || 3006; // Port unique pour app_mobile_service
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
