import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AccountingAIService } from '../external-ai/accounting-ai.service';
import { CompanyService } from '../company/services/company.service';
import { DataSharingPreferenceKey } from '../company/entities/company.entity';

// Define a DTO for the expected mobile transaction data structure
export interface MobileTransactionPayloadDto {
  companyId: string;
  transactionId: string;
  userId: string; // User who initiated the transaction on mobile
  amount: number;
  currency: string;
  description: string;
  transactionDate: string; // ISO 8601 date string
  category?: string;
  attachments?: MobileTransactionAttachmentDto[]; // Optional attachments
  metadata?: Record<string, any>; // Other relevant data
}

export interface MobileTransactionAttachmentDto {
  id: string; // Could be an ID from a mobile-side file storage or a temporary ID
  fileName: string;
  mimeType: string;
  base64Content?: string; // If content is sent directly
  url?: string; // If content needs to be fetched
}


@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private readonly accountingAIService: AccountingAIService,
    private readonly companyService: CompanyService,
  ) {}

  @EventPattern('mobile.transaction.created') // Listen to this Kafka topic
  async handleMobileTransactionCreated(@Payload() data: MobileTransactionPayloadDto) {
    this.logger.log(`Received mobile transaction: ${JSON.stringify(data)}`);

    // 1. Check company's data sharing preferences
    const canUseMobileDataForAI = await this.companyService.isDataSharingPreferenceEnabled(
      data.companyId,
      DataSharingPreferenceKey.ALLOW_MOBILE_DATA_FOR_AI,
    );

    if (!canUseMobileDataForAI) {
      this.logger.warn(
        `Company ${data.companyId} has not allowed mobile data for AI. Transaction ${data.transactionId} will not be processed for AI suggestions.`,
      );
      // Optionally, save the transaction data somewhere for record-keeping or manual processing
      return; // Stop processing for AI
    }

    this.logger.log(
      `Company ${data.companyId} allows mobile data for AI. Processing transaction ${data.transactionId}.`,
    );

    // 2. Prepare data for AccountingAIService
    // This might involve transforming the DTO, fetching attachment content if only URLs are provided, etc.
    // For now, we assume the payload is mostly usable as is or AccountingAIService can handle it.

    // TODO: If attachments have URLs, fetch their content and convert to base64 if needed.
    // This would likely involve a call to FileService or a similar utility if attachments are stored centrally.
    // For this example, we'll assume attachments might come with base64Content directly or AccountingAIService can handle URLs.

    const attachmentsToPass: MobileTransactionAttachmentDto[] = data.attachments?.map(att => ({
      id: att.id,
      fileName: att.fileName,
      mimeType: att.mimeType,
      base64Content: att.base64Content,
      url: att.url,
    })) || [];

    // 3. Call AccountingAIService to process this data for AI suggestions
    try {
      // The processMobileTransactionForAISuggestions method in AccountingAIService
      // expects the first argument to be a full MobileTransactionPayloadDto (which includes companyId)
      // and the second argument to be companyId again for clarity or specific use in that method.
      await this.accountingAIService.processMobileTransactionForAISuggestions(
        {
          companyId: data.companyId, // Ensure companyId is part of the first payload object
          userId: data.userId,
          transactionId: data.transactionId,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          transactionDate: data.transactionDate,
          category: data.category,
          attachments: attachmentsToPass,
          metadata: data.metadata,
        },
        data.companyId, // Pass companyId as the second argument as well
      );
      this.logger.log(`Successfully queued mobile transaction ${data.transactionId} for AI processing.`);
    } catch (error: any) { 
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process mobile transaction ${data.transactionId} for AI: ${errorMessage}`,
        error.stack, 
      );
    }
  }

  // Add more handlers for other topics as needed
  // @EventPattern('mobile.user.action.topic')
  // async handleMobileUserAction(@Payload() data: any) {
  //   this.logger.log(`Received mobile user action: ${JSON.stringify(data)}`);
  //   // Process this event
  // }
}
