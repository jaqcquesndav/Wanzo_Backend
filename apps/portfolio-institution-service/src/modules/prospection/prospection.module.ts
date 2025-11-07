import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { ContactHistory } from './entities/contact-history.entity';
import { Meeting } from './entities/meeting.entity';
import { SecurityOpportunity } from './entities/security-opportunity.entity';
import { CompaniesController } from './controllers/companies.controller';
import { ProspectionController } from './controllers/prospection.controller';
import { SMEIntegrationController } from './controllers/sme-integration.controller';
import { CompanyService } from './services/company.service';
import { ProspectionService } from './services/prospection.service';
import { ProspectionCreditScoreConsumerService } from './services/credit-score-consumer.service';
import { AccountingIntegrationModule } from '../integration/accounting-integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      ContactHistory,
      Meeting,
      SecurityOpportunity,
    ]),
    AccountingIntegrationModule,
  ],
  providers: [
    CompanyService,
    ProspectionService,
    ProspectionCreditScoreConsumerService,
  ],
  controllers: [
    CompaniesController,
    ProspectionController,
    SMEIntegrationController,
  ],
  exports: [
    CompanyService,
    ProspectionService,
  ],
})
export class ProspectionModule {}
