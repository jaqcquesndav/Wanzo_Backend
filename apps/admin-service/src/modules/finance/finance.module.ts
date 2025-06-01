import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { FinanceController } from './controllers';
import { FinanceService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities).filter(entity => typeof entity === 'function'))
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService]
})
export class FinanceModule {}
