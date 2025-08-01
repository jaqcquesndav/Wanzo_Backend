import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationJournalService } from './operation-journal.service';
import { OperationJournalController } from './operation-journal.controller';
import { OperationJournalEntry } from './entities/operation-journal-entry.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule if JwtAuthGuard is used

@Module({
  imports: [
    TypeOrmModule.forFeature([OperationJournalEntry]),
    AuthModule, // Add AuthModule to imports if JwtAuthGuard is from there
  ],
  controllers: [OperationJournalController],
  providers: [OperationJournalService],
  exports: [OperationJournalService], // Export service if it needs to be used by other modules
})
export class OperationJournalModule {}
