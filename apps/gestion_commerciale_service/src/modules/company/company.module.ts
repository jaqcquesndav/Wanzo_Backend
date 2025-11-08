import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './controllers/company.controller';
import { CompanyPaymentInfoController } from './controllers/company-payment-info.controller';
import { CompanyService } from './services/company.service';
import { CompanyPaymentInfoService } from './services/company-payment-info.service';
import { Company } from './entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
  ],
  controllers: [CompanyController, CompanyPaymentInfoController],
  providers: [CompanyService, CompanyPaymentInfoService],
  exports: [CompanyService, CompanyPaymentInfoService],
})
export class CompanyModule {}
