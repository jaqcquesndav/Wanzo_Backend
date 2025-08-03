import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudAlert } from './entities/fraud-alert.entity';
import { FraudDetectionService } from './services/fraud-detection.service';
import { FraudDetectionController } from './controllers/fraud-detection.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FraudAlert])
  ],
  controllers: [FraudDetectionController],
  providers: [FraudDetectionService],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
