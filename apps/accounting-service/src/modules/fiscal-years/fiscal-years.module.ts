import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalYear } from './entities/fiscal-year.entity';
import { FiscalYearsService } from './services/fiscal-years.service';
import { FiscalYearsController } from './controllers/fiscal-years.controller';
import { Journal } from '../journals/entities/journal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FiscalYear, Journal])],
  controllers: [FiscalYearsController],
  providers: [FiscalYearsService],
  exports: [FiscalYearsService],
})
export class FiscalYearsModule {}
