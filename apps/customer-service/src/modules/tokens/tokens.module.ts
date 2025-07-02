import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from './services/token.service';
import { TokenController } from './controllers/token.controller';
import { TokenUsage } from './entities/token-usage.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { TokenPurchase } from './entities/token-purchase.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenUsage, TokenPurchase]),
    KafkaModule,
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
