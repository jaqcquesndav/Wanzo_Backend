import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountService } from './services/account.service';
import { AccountController } from './controllers/account.controller';
import { FiscalYearsModule } from '../fiscal-years/fiscal-years.module'; // Import FiscalYearsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    FiscalYearsModule, // Add FiscalYearsModule to imports
  ],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountsModule {}