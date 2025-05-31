import { Module } from '@nestjs/common';
import { DataImportService } from './services/data-import.service';
import { DataImportController } from './controllers/data-import.controller';
import { JournalsModule } from '../journals/journals.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [JournalsModule, AccountsModule],
  providers: [DataImportService],
  controllers: [DataImportController],
  exports: [DataImportService],
})
export class DataImportModule {}