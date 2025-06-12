// External AI Service Communication Module
// This module handles communication between the accounting-service and the external Django AI service
// for processing accounting-related AI queries and generating accounting transactions.

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountingAIService } from './accounting-ai.service';
import { ChatModule } from '../chat/chat.module';
import { JournalsModule } from '../journals/journals.module';
// import { FilesModule } from '../files/files.module'; // Commented out as file does not exist
import { CompanyModule } from '../company/company.module'; // Added CompanyModule import

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
    // FilesModule, // Commented out
    CompanyModule, // Added CompanyModule to imports
  ],
  providers: [AccountingAIService],
  exports: [AccountingAIService],
})
export class ExternalAIModule {}
