import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AccountingAIService } from '../external-ai/accounting-ai.service';
import { OrganizationService } from '../organization/services/organization.service';
import { JournalService } from '../journals/services/journal.service';
import { SettingsService } from '../settings/services/settings.service';
import { JournalType } from '../journals/entities/journal.entity';
import { KafkaProducerService } from './kafka-producer.service';

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

// Interface pour les événements d'écritures comptables générées par ADHA AI
export interface AccountingJournalEntryDto {
  id: string;
  sourceId: string;
  sourceType: string;
  clientId: string;
  companyId: string;
  date: string;                        // Format ISO 8601
  description: string;
  amount: number;
  currency: string;                    // CDF, USD, EUR
  createdAt: string;                   // Format ISO 8601
  createdBy: string;
  status: string;                      // pending, validated, posted, cancelled, error
  journalType: string;                 // sales, purchases, financial, inventory, etc.
  lines: AccountingJournalLineDto[];   // Minimum 2 lignes
  metadata?: Record<string, any>;
}

export interface AccountingJournalLineDto {
  accountCode: string;                 // Code compte SYSCOHADA
  description: string;                 // Standardisé sur 'description' au lieu de 'label'
  debit: number;                       // Montant débit (obligatoire, 0 si pas de débit)
  credit: number;                      // Montant crédit (obligatoire, 0 si pas de crédit)
}


@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private readonly accountingAIService: AccountingAIService,
    private readonly organizationService: OrganizationService,
    private readonly journalService: JournalService,
    private readonly settingsService: SettingsService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  /**
   * Valide une écriture comptable avec validation stricte
   */
  private validateJournalEntry(data: AccountingJournalEntryDto): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation des champs obligatoires
    if (!data.id) errors.push('ID is required');
    if (!data.sourceId) errors.push('Source ID is required');
    if (!data.clientId) errors.push('Client ID is required');
    if (!data.companyId) errors.push('Company ID is required');
    if (!data.date) errors.push('Date is required');
    if (!data.description) errors.push('Description is required');
    if (!data.lines || data.lines.length < 2) {
      errors.push('At least 2 journal lines are required');
    }

    // Validation des lignes et calcul des totaux
    const totalDebit = data.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0;
    const totalCredit = data.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0;
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // Tolérance de 1 centime

    if (!isBalanced) {
      errors.push(`Journal entry is not balanced. Difference: ${difference.toFixed(2)}`);
    }

    // Validation des lignes individuelles
    data.lines?.forEach((line, index) => {
      if (!line.accountCode) {
        errors.push(`Line ${index + 1}: Account code is required`);
      }
      if (!line.description) {
        errors.push(`Line ${index + 1}: Description is required`);
      }
      if (line.debit < 0 || line.credit < 0) {
        errors.push(`Line ${index + 1}: Debit and credit must be positive`);
      }
      if (line.debit > 0 && line.credit > 0) {
        warnings.push(`Line ${index + 1}: Both debit and credit are positive`);
      }
      if (line.debit === 0 && line.credit === 0) {
        errors.push(`Line ${index + 1}: Either debit or credit must be positive`);
      }
    });

    // Validation de la devise
    if (!data.currency || !['CDF', 'USD', 'EUR'].includes(data.currency)) {
      warnings.push(`Unsupported or missing currency: ${data.currency}`);
    }

    // Validation du montant total
    if (data.amount && Math.abs(data.amount - Math.max(totalDebit, totalCredit)) > 0.01) {
      warnings.push(`Amount mismatch: stated ${data.amount} vs calculated ${Math.max(totalDebit, totalCredit)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isBalanced,
      totalDebit,
      totalCredit,
      difference,
    };
  }

  @EventPattern('mobile.transaction.created') // Listen to this Kafka topic
  async handleMobileTransactionCreated(@Payload() data: MobileTransactionPayloadDto) {
    this.logger.log(`Received mobile transaction: ${JSON.stringify({ ...data, attachments: undefined })}`); // Do not log attachments

    // 0. Validate payload
    const missingFields: string[] = [];
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

  // Gestionnaire pour les écritures comptables générées par ADHA AI
  @EventPattern('accounting.journal.entry')
  async handleAccountingJournalEntry(@Payload() data: AccountingJournalEntryDto) {
    const startTime = Date.now();
    const processingTimeout = 30000; // 30 secondes
    let timeoutId: NodeJS.Timeout | null = null;
    
    this.logger.log(`Received accounting journal entry: ${JSON.stringify({
      id: data.id,
      sourceId: data.sourceId,
      sourceType: data.sourceType,
      clientId: data.clientId,
      companyId: data.companyId,
      amount: data.amount,
      journalType: data.journalType,
    })}`);

    // Configurer le timeout de traitement
    timeoutId = setTimeout(() => {
      this.logger.warn(`Processing timeout (${processingTimeout}ms) exceeded for journal entry ${data.id}`);
      // Envoyer une notification d'échec pour timeout
      this.kafkaProducerService.sendJournalEntryProcessingStatus(
        data.id,
        data.sourceId,
        false,
        `Processing timeout exceeded (${processingTimeout}ms)`
      ).catch(err => {
        this.logger.error(`Failed to send timeout notification for ${data.id}: ${err.message}`);
      });
    }, processingTimeout);

    // Validation stricte des données reçues
    const validationResult = this.validateJournalEntry(data);
    if (!validationResult.isValid) {
      this.logger.warn(
        `Rejected accounting journal entry ${data.id}: ${validationResult.errors.join(', ')}`
      );
      
      // Envoyer notification d'échec de validation
      try {
        await this.kafkaProducerService.sendJournalEntryProcessingStatus(
          data.id,
          data.sourceId,
          false,
          `Validation failed: ${validationResult.errors.join(', ')}`
        );
      } catch (notifyError: any) {
        this.logger.error(`Failed to send validation error notification for ${data.id}: ${notifyError.message}`);
      }
      
      if (timeoutId) clearTimeout(timeoutId);
      return;
    }
    
    // Log des avertissements de validation
    if (validationResult.warnings.length > 0) {
      this.logger.warn(
        `Journal entry ${data.id} validation warnings: ${validationResult.warnings.join(', ')}`
      );
    }

    try {
      // 1. Vérifier si la source de données "Gestion Commerciale" est activée
      const isCommerceDataSourceEnabled = await this.settingsService.isDataSourceEnabled(
        data.companyId,
        'commerce_operations'
      );

      if (!isCommerceDataSourceEnabled) {
        this.logger.warn(
          `Company ${data.companyId} has not enabled commerce operations as a data source. Journal entry ${data.id} will not be processed.`
        );
        return;
      }

      this.logger.log(
        `Company ${data.companyId} has enabled commerce operations as a data source. Processing journal entry ${data.id}.`
      );

      // 2. Créer l'écriture comptable
      // Convertir la chaîne de type journal en enum JournalType
      let journalTypeEnum: JournalType;
      switch (data.journalType.toLowerCase()) {
        case 'general':
          journalTypeEnum = JournalType.GENERAL;
          break;
        case 'sales':
          journalTypeEnum = JournalType.SALES;
          break;
        case 'purchases':
          journalTypeEnum = JournalType.PURCHASES;
          break;
        case 'bank':
          journalTypeEnum = JournalType.BANK;
          break;
        case 'cash':
          journalTypeEnum = JournalType.CASH;
          break;
        default:
          // Par défaut, utiliser GENERAL
          this.logger.warn(`Journal type inconnu: ${data.journalType}, utilisation de GENERAL par défaut`);
          journalTypeEnum = JournalType.GENERAL;
      }
      
      const journalEntry = await this.journalService.createJournalEntryFromExternalSource({
        externalId: data.sourceId,
        externalSource: data.sourceType,
        companyId: data.companyId,
        date: new Date(data.date),
        description: data.description,
        journalType: journalTypeEnum,
        amount: data.lines.reduce((sum, line) => sum + (line.debit || line.credit), 0), // Calculer le montant total
        currency: data.currency,
        lines: data.lines.map(line => ({
          accountCode: line.accountCode,
          description: line.description || '',  // Corrigé: utilise 'description' au lieu de 'label'
          debit: line.debit,
          credit: line.credit
        }))
      });

      this.logger.log(
        `Successfully created journal entry from external source: ${journalEntry.id} for company ${data.companyId}`
      );
      
      // Calculer le temps de traitement
      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully created journal entry from external source: ${journalEntry.id} for company ${data.companyId} in ${processingTime}ms`
      );
      
      // Envoyer une confirmation de succès
      try {
        await this.kafkaProducerService.sendJournalEntryProcessingStatus(
          data.id,
          data.sourceId,
          true,
          `Successfully created journal entry: ${journalEntry.id} (processed in ${processingTime}ms)`
        );
      } catch (confirmError: any) {
        this.logger.warn(
          `Failed to send confirmation for journal entry ${data.id}: ${confirmError.message || 'Unknown error'}`
        );
      }
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process accounting journal entry ${data.id}: ${errorMessage} (failed after ${processingTime}ms)`,
        error.stack,
      );
      
      // Envoyer une notification d'échec
      try {
        await this.kafkaProducerService.sendJournalEntryProcessingStatus(
          data.id,
          data.sourceId,
          false,
          `Failed to process: ${errorMessage} (failed after ${processingTime}ms)`
        );
      } catch (confirmError: any) {
        this.logger.warn(
          `Failed to send error notification for journal entry ${data.id}: ${confirmError.message || 'Unknown error'}`
        );
      }
    } finally {
      // Nettoyer le timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
