
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensController } from './controllers/tokens.controller';
import { TokensService } from './services/tokens.service';
import { TokenPackage, TokenBalance, TokenTransaction, TokenUsage } from './entities/token.entity';
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenPackage, TokenBalance, TokenTransaction, TokenUsage]),
    // AuthModule,
  ],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}
