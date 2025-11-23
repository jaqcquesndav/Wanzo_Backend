import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyProfile } from '../company-profile/entities/company-profile.entity';
import { Company } from './entities/company.entity';
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { CompaniesController } from './controllers/companies.controller';
import { SMEIntegrationController } from './controllers/sme-integration.controller';
import { ProspectionService } from './services/prospection.service';
import { CompanyService } from './services/company.service';
import { ProspectionCreditScoreConsumerService } from './services/credit-score-consumer.service';
import { AccountingIntegrationModule } from '../integration/accounting-integration.module';

/**
 * Module de Prospection - Refactorisé pour utiliser CompanyProfile
 * 
 * CHANGEMENTS MAJEURS:
 * - Suppression de l'entité Company (dupliquée)
 * - Utilisation de CompanyProfileModule comme source unique de vérité
 * - ProspectionService pour logique métier prospection
 * - Synchronisation Kafka automatique via CompanyEventsConsumer (CompanyProfileModule)
 * - Support des coordonnées géographiques (lat, lng)
 * 
 * RESPONSABILITÉS:
 * - Consultation des prospects (companies) avec filtres métier prospection
 * - Recherche géographique par proximité
 * - Statistiques de prospection
 * - Mise à jour des scores de crédit via Kafka
 */
@Module({
  imports: [
    // Import CompanyProfile pour le consumer Kafka de scores
    TypeOrmModule.forFeature([
      CompanyProfile,
      Company,
    ]),
    // Import du module CompanyProfile (cache hybride)
    CompanyProfileModule,
    // Module d'intégration accounting (pour endpoints sync manuels)
    AccountingIntegrationModule,
  ],
  providers: [
    // Service de logique métier prospection
    ProspectionService,
    CompanyService,
    // Consumer Kafka pour scores de crédit
    ProspectionCreditScoreConsumerService,
  ],
  controllers: [
    // API de prospection (consultation prospects)
    CompaniesController,
    // API d'intégration SME (sync manuel)
    SMEIntegrationController,
  ],
  exports: [
    ProspectionService,
    CompanyService,
  ],
})
export class ProspectionModule {}
