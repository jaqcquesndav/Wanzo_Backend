import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import du module shared
import { SharedCustomerModule } from '../shared/shared-customer.module';
import { KafkaModule } from '../../kafka/kafka.module';

// Entities spécifiques aux entreprises
import { CompanyCoreEntity } from './entities/company-core.entity';
import { CompanyAssetsEntity } from './entities/company-assets.entity';
import { CompanyStocksEntity } from './entities/company-stocks.entity';

// Entities communes nécessaires
import { Customer } from '../entities/customer.entity';

// Services Company
import { CompanyService } from './services/company.service';
import { CompanyAssetsService } from './services/company-assets.service';
import { CompanyCoreService } from './services/company-core.service';

// Controllers
import { CompanyCoreController } from './controllers/company-core.controller';
// import { CompanyController } from './controllers/company.controller'; // TODO: Create CompanyController

/**
 * Module pour la gestion des clients de type Company (SME)
 * Utilise les services partagés du SharedCustomerModule
 */
@Module({
  imports: [
    // Import du module shared pour accéder aux services partagés
    SharedCustomerModule,
    forwardRef(() => KafkaModule),
    
    // Entities spécifiques aux companies
    TypeOrmModule.forFeature([
      CompanyCoreEntity,
      CompanyAssetsEntity,
      CompanyStocksEntity,
      Customer, // Nécessaire pour les relations
    ]),
  ],
  providers: [
    CompanyService,
    CompanyAssetsService,
    CompanyCoreService,
  ],
  controllers: [
    CompanyCoreController,
    // CompanyController, // TODO: Create CompanyController
  ],
  exports: [
    CompanyService,
    CompanyAssetsService,
    CompanyCoreService,
    TypeOrmModule,
  ],
})
export class CompanyModule {}