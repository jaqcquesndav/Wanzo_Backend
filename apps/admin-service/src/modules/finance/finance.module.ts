import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { FinanceController } from './controllers';
import { FinanceService } from './services';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to get access to JwtBlacklistGuard
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities).filter(entity => typeof entity === 'function')),
    AuthModule, // Add AuthModule to fix dependency injection error
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService]
})
export class FinanceModule {}
