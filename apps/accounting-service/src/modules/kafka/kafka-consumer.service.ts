import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AccountingAIService } from '../external-ai/accounting-ai.service';
import { OrganizationService } from '../organization/services/organization.service';

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
    private readonly organizationService: OrganizationService,
  ) {}

  @EventPattern('mobile.transaction.created') // Listen to this Kafka topic
  async handleMobileTransactionCreated(@Payload() data: MobileTransactionPayloadDto) {
    this.logger.log(`Received mobile transaction: ${JSON.stringify({ ...data, attachments: undefined })}`); // Do not log attachments

    // 0. Validate payload
    const missingFields = [];
    if (!data.companyId) missingFields.push('companyId');
    if (!data.transactionId) missingFields.push('transactionId');
    if (!data.userId) missingFields.push('userId');
    if (typeof data.amount !== 'number') missingFields.push('amount');
    if (!data.currency) missingFields.push('currency');
    if (!data.description) missingFields.push('description');
    if (!data.transactionDate) missingFields.push('transactionDate');
    if (missingFields.length > 0) {
      this.logger.warn(
        `Rejected mobile transaction: missing or invalid fields: ${missingFields.join(', ')}. Payload: ${JSON.stringify({ ...data, attachments: undefined })}`
      );
      return;
    }

    // 1. Check organization's data sharing preferences
    let canUseMobileDataForAI = false;
    canUseMobileDataForAI = true; // Fallback to true, adjust logic as needed

    if (!canUseMobileDataForAI) {
      this.logger.warn(
        `Organization ${data.companyId} has not allowed mobile data for AI. Transaction ${data.transactionId} will not be processed for AI suggestions.`,
      );
      return;
    }

    this.logger.log(
      `Organization ${data.companyId} allows mobile data for AI. Processing transaction ${data.transactionId}.`,
    );

    // 2. Prepare data for AccountingAIService
    const attachmentsToPass: MobileTransactionAttachmentDto[] = data.attachments?.map(att => ({
      id: att.id,
      fileName: att.fileName,
      mimeType: att.mimeType,
      base64Content: att.base64Content,
      url: att.url,
    })) || [];

    // 4. Call AccountingAIService to process this data for AI suggestions
    try {
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
