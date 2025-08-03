import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { RiskCalculationModule } from '../risk-calculation/risk-calculation.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';
import { GeographicAnalysisModule } from '../geographic-analysis/geographic-analysis.module';

@Module({
  imports: [
    RiskCalculationModule,
    FraudDetectionModule,
    GeographicAnalysisModule,
  ],
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaConsumerModule {}
