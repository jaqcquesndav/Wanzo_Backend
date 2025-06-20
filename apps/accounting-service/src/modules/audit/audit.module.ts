import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogService } from './services/audit-log.service';
import { AuditLog } from './entities/audit-log.entity';
import { FiscalYearsModule } from '../fiscal-years/fiscal-years.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    FiscalYearsModule
  ],
  controllers: [AuditController, AuditLogController],
  providers: [AuditService, AuditLogService],
  exports: [AuditService, AuditLogService],
})
export class AuditModule {}
