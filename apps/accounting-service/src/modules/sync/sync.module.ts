import { Module } from '@nestjs/common';
import { SyncController } from './controllers/sync.controller';
import { SyncService } from './services/sync.service';
import { AccountsModule } from '../accounts/accounts.module';
import { JournalsModule } from '../journals/journals.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [AccountsModule, JournalsModule, OrganizationModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
