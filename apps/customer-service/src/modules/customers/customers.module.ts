import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Modules spécialisés
import { SharedCustomerModule } from './shared/shared-customer.module';
import { CompanyModule } from './company/company.module';
import { FinancialInstitutionModule } from './financial-institution/financial-institution.module';

// Controllers principaux
import { CustomerController } from './controllers/customer.controller';

// Services principaux (orchestrateurs)
import { CustomerService } from './services/customer.service';

// Services legacy (migration terminée)

// Entities principales
import { Customer } from './entities/customer.entity';
import { CustomerUser } from './entities/customer-user.entity';
import { CustomerDocument } from './entities/customer-document.entity';

// Les entities Sme et Institution sont maintenant dans leurs sous-modules respectifs
// CompanyCoreEntity dans /company/entities/
// InstitutionCoreEntity dans /financial-institution/entities/

// External dependencies
import { User } from '../system-users/entities/user.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { CloudinaryModule } from '../cloudinary';

/**
 * Module principal des clients avec architecture modulaire
 * 
 * Structure:
 * - SharedCustomerModule: Services partagés (lifecycle, registry, ownership, events)
 * - CompanyModule: Gestion spécialisée des entreprises (SME)  
 * - FinancialInstitutionModule: Gestion spécialisée des institutions financières
 * - CustomerService: Orchestrateur principal qui délègue aux modules spécialisés
 */
@Module({
  imports: [
    // ===== MODULES SPÉCIALISÉS (Architecture modulaire) =====
    SharedCustomerModule,        // Services partagés pour tous types de clients
    CompanyModule,              // Module spécialisé pour les entreprises 
    FinancialInstitutionModule, // Module spécialisé pour les institutions financières

    // ===== ENTITIES PRINCIPALES ET LEGACY =====
    TypeOrmModule.forFeature([
      // Entities principales (communes à tous les types de clients)
      Customer,
      CustomerUser,
      CustomerDocument,
      
      // External entities
      User,
      
      // Note: Sme et Institution sont maintenant dans leurs sous-modules:
      // - CompanyCoreEntity dans CompanyModule
      // - InstitutionCoreEntity dans FinancialInstitutionModule
    ]),
    
    // ===== MODULES EXTERNES =====
    forwardRef(() => KafkaModule),
    CloudinaryModule,
    EventEmitterModule.forRoot(),
  ],
  
  controllers: [
    // Controllers principaux (orchestrateurs)
    CustomerController,
    // Note: CompanyController et FinancialInstitutionController sont dans leurs modules respectifs
  ],
  
  providers: [
    // Service principal (orchestrateur)
    CustomerService,
  ],
  
  exports: [
    // Services principaux
    CustomerService,
    
    // Modules spécialisés
    SharedCustomerModule,
    CompanyModule,
    FinancialInstitutionModule,
    
    // Modules externes (pour accès aux providers Kafka)
    KafkaModule,
    
    // Services legacy - tous migrés vers architecture modulaire
    
    // TypeORM pour autres modules
    TypeOrmModule,
  ],
})
export class CustomersModule {}
