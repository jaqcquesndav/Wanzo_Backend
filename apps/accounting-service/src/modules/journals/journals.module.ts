import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journal } from './entities/journal.entity';
import { JournalLine } from './entities/journal-line.entity';
import { JournalAttachment } from './entities/journal-attachment.entity';
import { JournalService } from './services/journal.service';
import { JournalController } from './controllers/journal.controller';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, JournalLine, JournalAttachment]),
    AccountsModule,
  ],
  providers: [JournalService],
  controllers: [JournalController],
  exports: [JournalService],
})
export class JournalsModule {}
