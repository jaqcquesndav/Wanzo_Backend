import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Configure Swagger documentation for the application
 * @param app NestJS application instance
 */
export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Wanzo Portfolio Institution API')
    .setDescription(`
      API pour la gestion des portefeuilles de crédits institutionnels.
      
      Cette API permet de gérer les processus suivants:
      - Gestion des portefeuilles
      - Gestion des produits financiers
      - Traitement des demandes de financement
      - Gestion des contrats de crédit
      - Décaissements
      - Remboursements
      - Génération et suivi des échéanciers de paiement
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('portfolios', 'Opérations liées aux portefeuilles')
    .addTag('financial-products', 'Opérations liées aux produits financiers')
    .addTag('funding-requests', 'Opérations liées aux demandes de financement')
    .addTag('credit-contracts', 'Opérations liées aux contrats de crédit')
    .addTag('disbursements', 'Opérations liées aux décaissements')
    .addTag('repayments', 'Opérations liées aux remboursements')
    .addTag('payment-schedules', 'Opérations liées aux échéanciers de paiement')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}
