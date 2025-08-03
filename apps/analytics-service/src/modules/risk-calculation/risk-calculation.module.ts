import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskProfile } from '../risk-analysis/entities/risk-profile.entity';
import { RiskCalculationService } from '../risk-analysis/services/risk-calculation.service';
import { RiskAnalysisController } from '../risk-analysis/controllers/risk-analysis.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskProfile])
  ],
  controllers: [RiskAnalysisController],
  providers: [RiskCalculationService],
  exports: [RiskCalculationService],
})
export class RiskCalculationModule {}
