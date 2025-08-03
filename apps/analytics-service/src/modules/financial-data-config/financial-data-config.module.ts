import { Module, Global } from '@nestjs/common';
import { FinancialDataConfigService } from '../../services/financial-data-config.service';
import { FinancialDataConfigController } from './financial-data-config.controller';

/**
 * Module global pour la configuration des données financières RDC
 * Ce module centralise l'accès aux données de référence
 */
@Global()
@Module({
  providers: [FinancialDataConfigService],
  controllers: [FinancialDataConfigController],
  exports: [FinancialDataConfigService],
})
export class FinancialDataConfigModule {}
