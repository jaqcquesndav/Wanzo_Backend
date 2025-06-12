import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CompanyService } from '../company/services/company.service'; // Corrected path
import { JournalService } from '../journals/services/journal.service'; // Corrected path
import { ChatService } from '../chat/services/chat.service'; // Corrected path
import { AccountingAIRequestDto, AccountingAIResponseDto, SingleAISuggestion } from './dtos/ai-accounting.dto'; // Corrected path
import { DataSharingPreferenceKey } from '../company/entities/company.entity'; // Corrected path
import { AccountingStandard } from '../../common/enums/accounting.enum'; // Corrected path
import { CreateJournalDto, JournalLineDto } from '../journals/dtos/journal.dto'; // Corrected path
import { JournalType } from '../journals/entities/journal.entity'; // Corrected path

@Injectable()
export class AccountingAIService {
  private readonly logger = new Logger(AccountingAIService.name);
  private readonly djangoServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly companyService: CompanyService,
    private readonly journalService: JournalService,
    private readonly chatService: ChatService,
  ) {
    const serviceUrl = this.configService.get<string>('DJANGO_AI_SERVICE_URL');
    if (!serviceUrl) {
      this.logger.error('DJANGO_AI_SERVICE_URL is not configured.');
      throw new InternalServerErrorException('AI service URL is not configured.');
    }
    this.djangoServiceUrl = serviceUrl;
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

    const company = await this.companyService.findById(companyId);
    if (!company) {
      this.logger.warn(`Company not found: ${companyId}`);
      throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }

    const accountingStandardToUse = company.metadata?.accountingStandard as AccountingStandard || AccountingStandard.SYSCOHADA;
    const fiscalYearToUse = company.currentFiscalYear;
    if (!fiscalYearToUse) {
      this.logger.warn(`Current fiscal year not set for company ${companyId}`);
      throw new InternalServerErrorException('Current fiscal year is not set for the company.');
    }

    // Initialize with attachments from controller if AI data sharing for chat is allowed
    let attachmentsForAI: Array<{ id: string; type: string; content: string; fileName: string }> = [];
    const allowChatDataForAI = await this.companyService.isDataSharingPreferenceEnabled(
      companyId,
      DataSharingPreferenceKey.ALLOW_CHAT_DATA_FOR_AI,
    );

    if (allowChatDataForAI && processedAttachmentsFromController && processedAttachmentsFromController.length > 0) {
      this.logger.log(`Including ${processedAttachmentsFromController.length} chat attachments for AI context based on company preference.`);
      attachmentsForAI = processedAttachmentsFromController;
    } else if (processedAttachmentsFromController && processedAttachmentsFromController.length > 0) {
      this.logger.log(`NOT including chat attachments for AI context. ${DataSharingPreferenceKey.ALLOW_CHAT_DATA_FOR_AI} is disabled for company ${companyId}.`);
    }

    // Placeholder for Mobile App Data Ingestion (e.g., from Kafka)
    const allowMobileDataForAI = await this.companyService.isDataSharingPreferenceEnabled(
      companyId,
      DataSharingPreferenceKey.ALLOW_MOBILE_DATA_FOR_AI,
    );

    if (allowMobileDataForAI) {
      this.logger.log(`Mobile data sharing is enabled for company ${companyId}. Placeholder for fetching/integrating mobile data.`);
      // const mobileData = await this.fetchMobileAppDataForAI(companyId, fiscalYearToUse);
      // attachmentsForAI = attachmentsForAI.concat(mobileData.attachments); 
      // Potentially merge other mobile data into context as well
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
    userId: string,
  ): Promise<any | null> { // Return type can be more specific, e.g., Journal entity type
    if (!suggestion) {
      this.logger.warn('No suggestion provided for journal creation');
      return null;
    }

    try {
      const company = await this.companyService.findById(companyId);
      if (!company) {
        this.logger.error(`Company not found: ${companyId} when trying to create journal from AI suggestion.`);
        throw new NotFoundException(`Company with ID ${companyId} not found.`);
      }
      const fiscalYearToUse = company.currentFiscalYear;
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
}
