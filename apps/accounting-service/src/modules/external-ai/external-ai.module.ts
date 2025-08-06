// External AI Service Communication Module
// This module handles communication between the accounting-service and the external Django AI service
// for processing accounting-related AI queries and generating accounting transactions.

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountingAIService } from './accounting-ai.service';
import { ChatModule } from '../chat/chat.module';
import { JournalsModule } from '../journals/journals.module';
import { FilesModule } from '../files/files.module'; // Now file exists
import { OrganizationModule } from '../organization/organization.module'; // Using OrganizationModule instead of CompanyModule

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get('DJANGO_AI_SERVICE_URL'),
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': configService.get('DJANGO_AI_SERVICE_API_KEY'),
        },
      }),
      inject: [ConfigService],
    }),
    ChatModule,
    JournalsModule,
    FilesModule,
    OrganizationModule // Using OrganizationModule instead of CompanyModule
  ],
  providers: [AccountingAIService],
  exports: [AccountingAIService],
})
export class ExternalAIModule {}
