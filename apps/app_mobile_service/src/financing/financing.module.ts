import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancingService } from './financing.service';
import { FinancingController } from './financing.controller';
import { FinancingRecord } from './entities/financing-record.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for JWTGuard and CurrentUser decorator dependencies

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancingRecord]),
    AuthModule, // Add AuthModule to imports
  ],
  controllers: [FinancingController],
  providers: [FinancingService],
})
export class FinancingModule {}
