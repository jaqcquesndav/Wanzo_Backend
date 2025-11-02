import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AccountingIntegrationService } from './accounting-integration.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [AccountingIntegrationService],
  exports: [AccountingIntegrationService],
})
export class AccountingIntegrationModule {}