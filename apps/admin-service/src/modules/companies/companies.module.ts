import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService } from './services/company.service';
import { CompanyController } from './controllers/company.controller';
import { ActivitiesModule } from '../activities/activities.module';



@Module({
  imports: [TypeOrmModule.forFeature([Company]),
  ActivitiesModule,
],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompaniesModule {}