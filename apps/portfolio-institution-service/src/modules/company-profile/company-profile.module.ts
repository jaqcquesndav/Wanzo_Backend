import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CompanyProfile } from './entities/company-profile.entity';
import { CompanySyncService } from './services/company-sync.service';
import { CompanyEventsConsumer } from './consumers/company-events.consumer';
import { CompanyProfileController } from './controllers/company-profile.controller';
import { AccountingIntegrationModule } from '../integration/accounting-integration.module';

/**
 * Module gérant les profils complets des companies (PME/SME)
 * 
 * RESPONSABILITÉS:
 * - Cache local des profils company avec données enrichies
 * - Synchronisation hybride: accounting-service (HTTP) + customer-service (Kafka)
 * - Résolution de conflits avec priorité accounting-service
 * - Exposition d'API REST pour accès aux profils
 * 
 * DÉPENDANCES:
 * - AccountingIntegrationModule: Accès à AccountingIntegrationService
 * - TypeOrmModule: Persistance CompanyProfile entity
 * - HttpModule: Requêtes HTTP vers accounting-service
 * - Kafka (via @nestjs/microservices): Consumer des événements customer-service
 */
@Module({
  imports: [
    // TypeORM pour la persistance
    TypeOrmModule.forFeature([CompanyProfile]),
    
    // HTTP client pour appels vers accounting-service
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    
    // Module d'intégration pour AccountingIntegrationService
    AccountingIntegrationModule,
  ],
  
  providers: [
    // Service principal de synchronisation
    CompanySyncService,
    
    // Consumer Kafka pour événements customer-service
    CompanyEventsConsumer,
  ],
  
  controllers: [
    // API REST pour accès aux profils
    CompanyProfileController,
  ],
  
  exports: [
    // Exporter le service pour utilisation par autres modules
    CompanySyncService,
  ],
})
export class CompanyProfileModule {}
