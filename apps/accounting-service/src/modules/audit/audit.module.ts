import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { FiscalYearsModule } from '../fiscal-years/fiscal-years.module';

@Module({
  imports: [FiscalYearsModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
