import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { DashboardController } from './controllers';
import { DashboardService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities))
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}
