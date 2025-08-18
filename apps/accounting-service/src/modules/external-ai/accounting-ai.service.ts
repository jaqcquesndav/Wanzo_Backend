import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrganizationService } from '../organization/services/organization.service';
import { JournalService } from '../journals/services/journal.service';
import { ChatService } from '../chat/services/chat.service';
import { AccountingAIRequestDto, AccountingAIResponseDto, SingleAISuggestion, AIContextDataDto, MobileTransactionContextDto } from './dtos/ai-accounting.dto';
import { AccountingMode } from '../organization/entities/organization.entity';
import { AccountingStandard } from '../../common/enums/accounting.enum';
import { CreateJournalDto, JournalLineDto } from '../journals/dtos/journal.dto';
import { JournalType } from '../journals/entities/journal.entity';
import { MobileTransactionPayloadDto, MobileTransactionAttachmentDto } from '../kafka/kafka-consumer.service';

@Injectable()
export class AccountingAIService {
  private readonly logger = new Logger(AccountingAIService.name);
  private readonly djangoServiceUrl: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly organizationService: OrganizationService,
    private readonly journalService: JournalService,
    private readonly chatService: ChatService,
  ) {
    const serviceUrl = this.configService.get<string>('DJANGO_AI_SERVICE_URL');
    if (!serviceUrl) {
      this.logger.warn('DJANGO_AI_SERVICE_URL is not configured. AI features will be unavailable.');
      // this.djangoServiceUrl will remain undefined
    } else {
      this.djangoServiceUrl = serviceUrl;
    }
  }

  /**
   * Process an accounting query using the external Django AI service
   */
  async processAccountingQuery(
    chatId: string,
    message: string,
    companyId: string,
    userId: string,
    // attachments is now expected to be the processed structure
    processedAttachmentsFromController?: Array<{ id: string; type: string; content: string; fileName: string }>,
  ): Promise<AccountingAIResponseDto> {
    this.logger.log(`Processing accounting query for company ${companyId}, chat ${chatId}`);

    if (!this.djangoServiceUrl) {
      this.logger.warn('DJANGO_AI_SERVICE_URL is not configured. AI processing is unavailable.');
      return {
        reply: 'Les fonctionnalités d\'IA ne sont pas disponibles actuellement en raison d\'un problème de configuration. Veuillez contacter l\'administrateur.',
        confidence: 0,
        needsReview: true,
        error: {
          message: 'DJANGO_AI_SERVICE_URL is not configured. AI features are unavailable.',
          service: 'ConfigurationError',
        }
      };
    }

    const company = await this.organizationService.findById(companyId);
    if (!company) {
      this.logger.warn(`Company not found: ${companyId}`);
      throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }

    // Preferences and fiscal year/standard should come from config/settings, not legacy properties
    // TODO: If per-organization preferences are needed, add a 'preferences' JSON field to Organization and read from there
    const accountingStandardToUse = this.configService.get<AccountingStandard>('ACCOUNTING_STANDARD') || AccountingStandard.SYSCOHADA;
    const fiscalYearToUse = this.configService.get<string>('CURRENT_FISCAL_YEAR');
    if (!fiscalYearToUse) {
      this.logger.warn(`Current fiscal year is not set in config for company ${companyId}`);
      throw new InternalServerErrorException('Current fiscal year is not set for the company.');
    }

    // Préférence de partage de données IA (chat)
    const allowChatDataForAI = this.configService.get<boolean>('ALLOW_CHAT_DATA_FOR_AI') ?? false;
    let attachmentsForAI: Array<{ id: string; type: string; content: string; fileName: string }> = [];
    if (allowChatDataForAI && processedAttachmentsFromController && processedAttachmentsFromController.length > 0) {
      this.logger.log(`Including ${processedAttachmentsFromController.length} chat attachments for AI context based on config preference.`);
      attachmentsForAI = processedAttachmentsFromController;
    } else if (processedAttachmentsFromController && processedAttachmentsFromController.length > 0) {
      this.logger.log(`NOT including chat attachments for AI context. ALLOW_CHAT_DATA_FOR_AI is disabled in config for company ${companyId}.`);
    }

    // Préférence de partage de données IA (mobile)
    const allowMobileDataForAI = this.configService.get<boolean>('ALLOW_MOBILE_DATA_FOR_AI') ?? false;
    if (allowMobileDataForAI) {
      this.logger.log(`Mobile data sharing is enabled in config for company ${companyId}. Placeholder for fetching/integrating mobile data.`);
      // const mobileData = await this.fetchMobileAppDataForAI(companyId, fiscalYearToUse);
      // attachmentsForAI = attachmentsForAI.concat(mobileData.attachments);
    }

    // Get accounting context (accounts, recent journals)
    // TODO: Ensure getAccountingContext is efficient and fetches relevant data for the fiscal year and standard.
    const accountingContext = await this.chatService.getAccountingContext(companyId, fiscalYearToUse, accountingStandardToUse);

    const aiRequest: AccountingAIRequestDto = {
      message,
      contextData: {
        companyId,
        fiscalYear: fiscalYearToUse,
        accountingStandard: accountingStandardToUse,
        userId,
        accounts: accountingContext.accounts.map((acc: { code: string; name: string; type: string }) => ({ code: acc.code, name: acc.name, type: acc.type })),
        recentJournals: accountingContext.recentJournals.map((j: { journalType: JournalType; description: string; lines: Array<{debit: number; credit: number}> }) => ({ 
          type: j.journalType.toString(), // Ensure journalType is a string if that's what AI expects
          description: j.description, 
          // Ensure amount calculation is correct and what AI expects
          amount: j.lines.reduce((sum: number, line: { debit: number; credit: number; }) => sum + line.debit - line.credit, 0) 
        })),
        attachments: attachmentsForAI.length > 0 ? attachmentsForAI : undefined,
      },
    };

    try {
      this.logger.debug(`Sending AI Request to ${this.djangoServiceUrl}: ${JSON.stringify(aiRequest).substring(0, 500)}...`); // Log snippet
      const response = await firstValueFrom(
        this.httpService.post<AccountingAIResponseDto>(
          `${this.djangoServiceUrl}/api/accounting/process`,
          aiRequest,
        ),
      );
      this.logger.log(`Received AI response for company ${companyId}, chat ${chatId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error communicating with Django AI service for company ${companyId}: ${error.message}`, error.stack);
      return {
        reply: 'Je suis désolé, une erreur technique empêche le traitement de votre demande comptable. Veuillez réessayer plus tard.',
        confidence: 0,
        needsReview: true,
        error: {
          message: error.message || 'Unknown AI service communication error',
          service: 'ExternalAICommunicationError',
        }
      };
    }
  }

  /**
   * Create a journal entry from an AI suggestion
   */
  async createJournalFromAISuggestion(
    suggestion: SingleAISuggestion,
    companyId: string,
    userId: string, // Added userId for auditing, assuming it's relevant for AI-created journals too
  ): Promise<any | null> { // Return type can be more specific, e.g., Journal entity type
    if (!this.djangoServiceUrl) {
      this.logger.warn('DJANGO_AI_SERVICE_URL is not configured. Cannot create journal from AI suggestion.');
      // Potentially throw an error or return a specific response indicating AI is disabled
      throw new InternalServerErrorException('AI features are unavailable due to configuration issues.');
    }

    if (!suggestion) {
      this.logger.warn('No suggestion provided for journal creation');
      return null;
    }

    try {
      const company = await this.organizationService.findById(companyId);
      if (!company) {
        this.logger.error(`Company not found: ${companyId} when trying to create journal from AI suggestion.`);
        throw new NotFoundException(`Company with ID ${companyId} not found.`);
      }
      // const fiscalYearToUse = company.currentFiscalYear; // Removed: not present on Organization
      const fiscalYearToUse = this.configService.get<string>('CURRENT_FISCAL_YEAR');
      if (!fiscalYearToUse) {
        this.logger.error(`Current fiscal year not set for company ${companyId} when creating journal from AI.`);
        throw new InternalServerErrorException('Current fiscal year is not set for the company.');
      }

      const journalTypeMap: Record<string, JournalType> = {
        'general': JournalType.GENERAL,
        'sales': JournalType.SALES,
        'purchases': JournalType.PURCHASES,
        'bank': JournalType.BANK,
        'cash': JournalType.CASH,
      };
      const mappedJournalType = journalTypeMap[suggestion.journalType.toLowerCase()] || JournalType.GENERAL;

      const journalLines: JournalLineDto[] = [];
      for (const line of suggestion.lines) {
        // TODO: Implement robust accountCode to accountId resolution
        // This is a critical step. For now, we'll log a warning and skip lines without a resolved ID.
        const account = await this.journalService.findAccountByCode(line.accountCode, companyId);
        if (!account) {
          this.logger.warn(`Could not find accountId for accountCode: ${line.accountCode} in company ${companyId}. Skipping this line.`);
          continue; // Or handle as an error, preventing journal creation
        }
        journalLines.push({
          accountId: account.id, // Use the resolved account.id (UUID)
          description: line.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
        });
      }

      if (journalLines.length === 0 && suggestion.lines.length > 0) {
        this.logger.error('No valid journal lines could be created from AI suggestion due to account code resolution issues.');
        return null; // Or throw an error
      }
      if (journalLines.length !== suggestion.lines.length) {
        this.logger.warn('Some AI suggested journal lines were skipped due to account code resolution issues.');
      }

      const journalDto: CreateJournalDto = {
        date: new Date(suggestion.date),
        description: suggestion.description,
        type: mappedJournalType,
        journalType: mappedJournalType, // Ajout pour compatibilité
        fiscalYear: fiscalYearToUse,
        companyId,
        reference: `AI-SUGGEST-${Date.now()}`,
        lines: journalLines,
      };

      const totalDebit = journalDto.lines.reduce((sum: number, l: JournalLineDto) => sum + (l.debit || 0), 0);
      const totalCredit = journalDto.lines.reduce((sum: number, l: JournalLineDto) => sum + (l.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) { // Tolerance for floating point
        this.logger.warn(`AI suggested journal for company ${companyId} is not balanced: Debit=${totalDebit}, Credit=${totalCredit}. Description: ${suggestion.description}`);
        // Depending on policy, either reject, or save as draft for review
        // For now, we will prevent creation of unbalanced journals from AI.
        // throw new InternalServerErrorException('AI suggested journal is not balanced.');
        return null; 
      }
      
      this.logger.log(`Creating journal from AI suggestion for company ${companyId}. Journal Type: ${mappedJournalType}, Lines: ${journalLines.length}`);
      return await this.journalService.create(journalDto, userId);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating journal from AI suggestion';
      this.logger.error(`Error creating journal from AI suggestion for company ${companyId}: ${errorMessage}`, error.stack);
      // Optionally, rethrow or return a more specific error DTO to the controller
      return null;
    }
  }

  /**
   * Process mobile transaction data for AI suggestions.
   * This method will be called by the Kafka consumer when a new mobile transaction is received.
   */
  async processMobileTransactionForAISuggestions(
    payload: MobileTransactionPayloadDto,
    companyId: string, // companyId is part of the payload but passed for clarity
  ): Promise<AccountingAIResponseDto | null> {
    this.logger.log(`Processing mobile transaction for AI suggestions for company ${companyId}, transaction ID: ${payload.transactionId}`);

    if (!this.djangoServiceUrl) {
      this.logger.warn('DJANGO_AI_SERVICE_URL is not configured. AI processing for mobile transactions is unavailable.');
      return {
        reply: 'Les fonctionnalités d\'IA ne sont pas disponibles actuellement en raison d\'un problème de configuration. Veuillez contacter l\'administrateur.',
        confidence: 0,
        needsReview: true,
        error: {
          message: 'DJANGO_AI_SERVICE_URL is not configured. AI features for mobile transactions are unavailable.',
          service: 'ConfigurationError',
        }
      };
    }

    const company = await this.organizationService.findById(companyId);
    if (!company) {
      this.logger.warn(`Company not found: ${companyId} while processing mobile transaction ${payload.transactionId}`);
      return null;
    }

    // Préférence de partage de données IA (mobile)
    const allowMobileDataForAI = this.configService.get<boolean>('ALLOW_MOBILE_DATA_FOR_AI') ?? false;
    if (!allowMobileDataForAI) {
      this.logger.warn(`Data sharing for mobile data (ALLOW_MOBILE_DATA_FOR_AI) was disabled for company ${companyId} before processing transaction ${payload.transactionId}. Aborting.`);
      return null;
    }

    const accountingStandardToUse = this.configService.get<AccountingStandard>('ACCOUNTING_STANDARD') || AccountingStandard.SYSCOHADA;
    const fiscalYearToUse = this.configService.get<string>('CURRENT_FISCAL_YEAR');
    if (!fiscalYearToUse) {
      this.logger.warn(`Current fiscal year is not set in config for company ${companyId} while processing mobile transaction ${payload.transactionId}`);
      return null; 
    }

    let attachmentsForAI: Array<{ id: string; type: string; content: string; fileName: string }> = [];
    if (payload.attachments && payload.attachments.length > 0) {
      this.logger.log(`Processing ${payload.attachments.length} attachments for mobile transaction ${payload.transactionId}`);
      for (const attachment of payload.attachments) {
        let content = attachment.base64Content;
        const fileType = attachment.mimeType || 'application/octet-stream';
        const fileName = attachment.fileName || `mobile-attachment-${Date.now()}`;

        if (!content && attachment.url) {
          this.logger.log(`Attachment ${fileName} has a URL (${attachment.url}). Fetching content...`);
          try {
            const response = await firstValueFrom(
              this.httpService.get(attachment.url, { responseType: 'arraybuffer' }),
            );
            content = Buffer.from(response.data).toString('base64');
            this.logger.log(`Successfully fetched and encoded content for ${fileName} from URL.`);
          } catch (fetchError: any) {
            this.logger.error(`Failed to fetch attachment from URL ${attachment.url} for transaction ${payload.transactionId}: ${fetchError.message}`);
            continue; 
          }
        }

        if (!content) {
            this.logger.warn(`Attachment ${fileName} for transaction ${payload.transactionId} has no content (and no URL or fetching failed). Skipping.`);
            continue;
        }
        
        attachmentsForAI.push({
          id: attachment.id || `mobile-attach-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          type: fileType,
          content: content,
          fileName: fileName,
        });
      }
    }

    const accountingContext = await this.chatService.getAccountingContext(companyId, fiscalYearToUse, accountingStandardToUse);
    const aiMessage = `Transaction mobile: ${payload.description || 'N/A'}. Montant: ${payload.amount} ${payload.currency}. Date: ${payload.transactionDate}. Type: ${payload.category || 'Non spécifié'}.`;

    const transactionDetailsContext: MobileTransactionContextDto = {
        transactionId: payload.transactionId,
        userId: payload.userId, // Ensured userId is present
        amount: payload.amount,
        currency: payload.currency,
        date: payload.transactionDate,
        category: payload.category,
        type: payload.metadata?.type, 
        merchant: payload.metadata?.merchant,
        notes: payload.metadata?.notes,
    };

    const aiContextData: AIContextDataDto = {
        companyId,
        fiscalYear: fiscalYearToUse,
        accountingStandard: accountingStandardToUse,
        userId: payload.userId, // Ensured userId is present
        accounts: accountingContext.accounts.map((acc: { code: string; name: string; type: string }) => ({ code: acc.code, name: acc.name, type: acc.type })),
        recentJournals: accountingContext.recentJournals.map((j: { journalType: JournalType; description: string; lines: Array<{debit: number; credit: number}> }) => ({
          type: j.journalType.toString(),
          description: j.description,
          amount: j.lines.reduce((sum: number, line: { debit: number; credit: number; }) => sum + line.debit - line.credit, 0)
        })),
        attachments: attachmentsForAI.length > 0 ? attachmentsForAI : undefined,
        source: 'mobile_transaction',
        transactionDetails: transactionDetailsContext,
    };

    const aiRequest: AccountingAIRequestDto = {
      message: aiMessage,
      contextData: aiContextData,
    };

    try {
      this.logger.debug(`Sending AI Request for mobile transaction ${payload.transactionId} to ${this.djangoServiceUrl}: ${JSON.stringify(aiRequest).substring(0, 500)}...`);
      const response = await firstValueFrom(
        this.httpService.post<AccountingAIResponseDto>(
          `${this.djangoServiceUrl}/api/accounting/process`,
          aiRequest,
        ),
      );
      this.logger.log(`Received AI response for mobile transaction ${payload.transactionId} for company ${companyId}`);
      
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        this.logger.log(`AI provided ${response.data.suggestions.length} suggestions for mobile transaction ${payload.transactionId}.`);
        
        // Préférence auto création journal mobile AI
        let autoCreatePreference = this.configService.get<{ enabled: boolean; minConfidence: number }>('AUTO_CREATE_JOURNAL_FROM_MOBILE_AI');
        if (autoCreatePreference?.enabled) {
          this.logger.log(`Auto-creation of journal from mobile AI suggestion is ENABLED for company ${companyId}. Min confidence: ${autoCreatePreference.minConfidence}`);
          for (const suggestion of response.data.suggestions) {
            const overallConfidence = response.data.confidence || 0;
            const suggestionConfidence = suggestion.confidenceScore || overallConfidence; 

            if (suggestionConfidence >= autoCreatePreference.minConfidence) {
              this.logger.log(`Suggestion confidence (${suggestionConfidence}) meets threshold (${autoCreatePreference.minConfidence}). Attempting to create journal.`);
              try {
                const createdJournal = await this.createJournalFromAISuggestion(suggestion, companyId, payload.userId);
                if (!createdJournal) {
                  this.logger.warn(`Journal creation from AI suggestion returned null for suggestion: ${JSON.stringify(suggestion)}`);
                } else {
                  this.logger.log(`Successfully created journal from AI suggestion for transaction ${payload.transactionId}. Journal ID: ${createdJournal.id}`);
                }
              } catch (creationError) {
                const errMsg = creationError instanceof Error ? creationError.message : JSON.stringify(creationError);
                this.logger.error(`Error creating journal from AI suggestion for transaction ${payload.transactionId}: ${errMsg}`);
              }
            } else {
              this.logger.log(`Suggestion confidence (${suggestionConfidence}) does not meet the minimum threshold (${autoCreatePreference.minConfidence}). Skipping journal creation for this suggestion.`);
            }
          }
        } else {
          this.logger.log(`Auto-creation of journal from mobile AI suggestion is DISABLED for company ${companyId}.`);
        }
      } else {
        this.logger.log(`No AI suggestions found for mobile transaction ${payload.transactionId}.`);
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(`Error communicating with Django AI service for mobile transaction ${payload.transactionId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Placeholder for fetching mobile app data for AI processing.
   * In a real implementation, this would fetch and return relevant data from the mobile app's transaction Kafka topic or other sources.
   */
  private async fetchMobileAppDataForAI(companyId: string, fiscalYear: number) {
    // TODO: Implement data fetching logic
    return {
      attachments: [], // Array of processed attachments for AI
      // other context data as needed
    };
  }
}