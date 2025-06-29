import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensController } from './controllers/tokens.controller';
import { TokensService } from './services/tokens.service';
import { TokenPackage, TokenBalance, TokenTransaction, TokenUsage } from './entities/token.entity';
import { EventsModule } from '../events/events.module';
import { TokenUsageConsumerController } from './controllers/token-usage-consumer.controller';
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenPackage, TokenBalance, TokenTransaction, TokenUsage]),
    EventsModule,
    // AuthModule,
  ],
  controllers: [TokensController, TokenUsageConsumerController],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}
