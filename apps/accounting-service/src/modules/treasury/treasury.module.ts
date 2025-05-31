import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreasuryTransaction } from './entities/treasury-transaction.entity';
import { TreasuryAccount } from './entities/treasury-account.entity';
import { TreasuryService } from './services/treasury.service';
import { TreasuryController } from './controllers/treasury.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreasuryTransaction, TreasuryAccount]),
    AccountsModule,
    JournalsModule,
  ],
  providers: [TreasuryService],
  controllers: [TreasuryController],
  exports: [TreasuryService],
})
export class TreasuryModule {}