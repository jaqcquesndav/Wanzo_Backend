import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService } from './services/company.service';
// Import CompanyController if you create one for managing companies via API
// import { CompanyController } from './controllers/company.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
  ],
  providers: [CompanyService],
  // controllers: [CompanyController], // Uncomment if you add a controller for company CRUD
  exports: [CompanyService], // Export CompanyService so other modules (like AccountingAIService) can use it
})
export class CompanyModule {}
