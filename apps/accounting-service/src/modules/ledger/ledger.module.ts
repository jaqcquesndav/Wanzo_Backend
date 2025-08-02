import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './controllers/ledger.controller';
import { LedgerService } from './services/ledger.service';
import { Account } from '../accounts/entities/account.entity';
import { Journal } from '../journals/entities/journal.entity';
import { JournalLine } from '../journals/entities/journal-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Journal, JournalLine]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
