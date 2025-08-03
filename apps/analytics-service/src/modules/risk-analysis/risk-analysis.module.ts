import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskProfile } from './entities/risk-profile.entity';
import { RiskCalculationService } from './services/risk-calculation.service';
import { RiskAnalysisController } from './controllers/risk-analysis.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskProfile])
  ],
  controllers: [RiskAnalysisController],
  providers: [RiskCalculationService],
  exports: [RiskCalculationService],
})
export class RiskAnalysisModule {}
