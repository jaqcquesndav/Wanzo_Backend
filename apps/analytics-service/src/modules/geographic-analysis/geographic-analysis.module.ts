import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeographicEntity } from './entities/geographic-entity.entity';
import { GeographicAnalysisService } from './services/geographic-analysis.service';
import { GeographicAnalysisController } from './controllers/geographic-analysis.controller';
import { RiskProfile } from '../risk-analysis/entities/risk-profile.entity';
import { FraudAlert } from '../fraud-detection/entities/fraud-alert.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeographicEntity, RiskProfile, FraudAlert])
  ],
  controllers: [GeographicAnalysisController],
  providers: [GeographicAnalysisService],
  exports: [GeographicAnalysisService],
})
export class GeographicAnalysisModule {}
