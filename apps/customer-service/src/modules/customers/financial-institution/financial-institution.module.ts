import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import du module shared
import { SharedCustomerModule } from '../shared/shared-customer.module';

// Entities spécifiques aux institutions financières
import { InstitutionCoreEntity } from './entities/institution-core.entity';
import { InstitutionBranchEntity } from './entities/institution-branch.entity';
import { InstitutionLeadershipEntity } from './entities/institution-leadership.entity';
import { InstitutionRegulatoryEntity } from './entities/institution-regulatory.entity';
import { InstitutionServicesEntity } from './entities/institution-services.entity';

// Entities communes nécessaires
import { Customer } from '../entities/customer.entity';

// Services Institution
import { InstitutionService } from './services/institution.service';

// Controllers
// import { InstitutionController } from './controllers/institution.controller'; // TODO: Create InstitutionController

/**
 * Module pour la gestion des clients de type Financial Institution
 * Utilise les services partagés du SharedCustomerModule
 */
@Module({
  imports: [
    // Import du module shared pour accéder aux services partagés
    SharedCustomerModule,
    
    // Entities spécifiques aux institutions financières
    TypeOrmModule.forFeature([
      InstitutionCoreEntity,
      InstitutionBranchEntity,
      InstitutionLeadershipEntity,
      InstitutionRegulatoryEntity,
      InstitutionServicesEntity,
      Customer, // Nécessaire pour les relations
    ]),
  ],
  providers: [
    InstitutionService,
  ],
  controllers: [
    // InstitutionController, // TODO: Create InstitutionController
  ],
  exports: [
    InstitutionService,
    TypeOrmModule,
  ],
})
export class FinancialInstitutionModule {}