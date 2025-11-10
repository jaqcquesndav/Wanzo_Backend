import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesController } from './controllers/companies.controller';
import { SMEIntegrationController } from './controllers/sme-integration.controller';
import { CompanyService } from './services/company.service';
import { ProspectionCreditScoreConsumerService } from './services/credit-score-consumer.service';
import { AccountingIntegrationModule } from '../integration/accounting-integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
    ]),
    AccountingIntegrationModule,
  ],
  providers: [
    CompanyService,
    ProspectionCreditScoreConsumerService,
  ],
  controllers: [
    CompaniesController,
    SMEIntegrationController,
  ],
  exports: [
    CompanyService,
  ],
})
export class ProspectionModule {}
