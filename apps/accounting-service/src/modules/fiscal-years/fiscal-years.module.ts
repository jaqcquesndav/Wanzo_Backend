import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalYear } from './entities/fiscal-year.entity';
import { FiscalYearsService } from './services/fiscal-years.service';
import { FiscalYearsController } from './controllers/fiscal-years.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FiscalYear])],
  controllers: [FiscalYearsController],
  providers: [FiscalYearsService],
  exports: [FiscalYearsService],
})
export class FiscalYearsModule {}
