import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { RiskAnalysisModule } from '../risk-analysis/risk-analysis.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';
import { GeographicAnalysisModule } from '../geographic-analysis/geographic-analysis.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    RiskAnalysisModule,
    FraudDetectionModule,
    GeographicAnalysisModule,
    IntegrationModule,
  ],
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaConsumerModule {}
