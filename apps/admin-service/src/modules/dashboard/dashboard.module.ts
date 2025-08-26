import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as entities from './entities';
import { DashboardController } from './controllers';
import { DashboardService } from './services';
import { AdminOrchestrationService } from './services/admin-orchestration.service';
import { AdminCalculatorService } from './calculators/admin-calculator.service';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ...Object.values(entities),
      User,
      Customer,
    ]),
    ScheduleModule.forRoot(),
    AuthModule, // Import AuthModule to get access to JwtBlacklistGuard
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    AdminOrchestrationService,
    AdminCalculatorService,
  ],
  exports: [
    DashboardService,
    AdminOrchestrationService,
    AdminCalculatorService,
  ]
})
export class DashboardModule {}
