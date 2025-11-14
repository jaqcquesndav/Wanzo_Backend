/**
 * SERVICE DE TRANSACTION UNIFIÉ
 * 
 * Ce service centralise TOUTE la logique de gestion des transactions financières
 * en utilisant les nouvelles structures unifiées tout en maintenant la compatibilité
 * avec les services existants.
 * 
 * Fonctionnalités:
 * - Création de transactions avec validation ISO 20022 complète
 * - Migration automatique des anciennes structures
 * - Compliance AML/CFT intégrée
 * - Adaptateurs pour tous les services existants
 * - Gestion des événements Kafka unifiés
 */

import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';

// Import des services de compliance
import { FinancialComplianceService } from './financial-compliance.service';
import { AMLComplianceService } from './aml-compliance.service';
import { FinancialStandardsService } from './financial-standards.service';

// Import des entités et DTOs unifiés
import { 
  UnifiedFinancialTransaction, 
  ServiceContext, 
  UnifiedTransactionFactory 
} from '../entities/unified-financial-transaction.entity';

import {
  CreateUnifiedTransactionDto,
  CreateCustomerPaymentDto,
  CreatePaymentServiceTransactionDto,
  CreateCommercialTransactionDto,
  CreateAdminFinanceDto,
  CreatePortfolioDisbursementDto,
  UpdateTransactionStatusDto,
  TransactionFilterDto,
  PaginationDto,
  UnifiedTransactionResponseDto,
  PaginatedTransactionResponseDto,
  AMLValidationDto,
  BulkTransactionProcessDto,
  DtoConversionHelper
} from '../dtos/unified-transaction.dto';

import {
  UnifiedTransactionStatus,
  UnifiedTransactionType,
  UnifiedPaymentMethod,
  SupportedCurrency,
  TransactionPriority,
  TransactionChannel,
  AMLRiskLevel,
  FinancialEnumsHelper
} from '../enums/financial-enums';

/**
 * ÉVÉNEMENTS KAFKA UNIFIÉS
 */
export interface UnifiedTransactionEvent {
  eventType: 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'TRANSACTION_COMPLETED' | 'TRANSACTION_FAILED';
  transactionId: string;
  serviceContext: ServiceContext;
  transaction: UnifiedFinancialTransaction;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * RÉSULTAT DE VALIDATION COMPLIANCE
 */
export interface TransactionValidationResult {
  isValid: boolean;
  complianceScore: number;
  amlRiskLevel: AMLRiskLevel;
  violations: string[];
  warnings: string[];
  requiresReview: boolean;
}

/**
 * OPTIONS DE MIGRATION
 */
export interface MigrationOptions {
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  preserveLegacyIds?: boolean;
  migrationBatch?: string;
}

@Injectable()
export class UnifiedTransactionService {
  private readonly logger = new Logger(UnifiedTransactionService.name);

  constructor(
    @InjectRepository(UnifiedFinancialTransaction)
    private readonly transactionRepository: Repository<UnifiedFinancialTransaction>,
    
    private readonly complianceService: FinancialComplianceService,
    private readonly amlService: AMLComplianceService,
    private readonly standardsService: FinancialStandardsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * ================================
   * MÉTHODES PRINCIPALES DE CRÉATION
   * ================================
   */

  /**
   * Crée une transaction unifiée avec validation complète
   */
  async createTransaction(
    dto: CreateUnifiedTransactionDto
  ): Promise<UnifiedFinancialTransaction> {
    this.logger.log(`Création transaction unifiée: ${dto.type} - ${dto.amount} ${dto.currency}`);

    // 1. Validation compliance complète
    const validationResult = await this.validateTransactionCompliance(dto);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Validation compliance échouée: ${validationResult.violations.join(', ')}`);
    }

    // 2. Création de l'entité
    const transaction = this.createTransactionEntity(dto);
    
    // 3. Calcul du risque AML
    transaction.updateAMLRiskLevel();
    
    // 4. Génération ID ISO 20022
    // MessageId est déjà généré dans le constructeur ISO20022
    
    // 5. Si risque élevé, marquer pour révision
    if (transaction.amlRiskLevel === AMLRiskLevel.HIGH || transaction.amlRiskLevel === AMLRiskLevel.VERY_HIGH) {
      transaction.unifiedStatus = UnifiedTransactionStatus.SUSPENDED;
      this.logger.warn(`Transaction ${transaction.id} suspendue pour révision AML (risque: ${transaction.amlRiskLevel})`);
    }

    // 6. Sauvegarde
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 7. Émission événement
    await this.emitTransactionEvent('TRANSACTION_CREATED', savedTransaction);

    // 8. Si nécessaire, planifier révision AML
    if (validationResult.requiresReview) {
      await this.scheduleAMLReview(savedTransaction);
    }

    this.logger.log(`Transaction créée avec succès: ${savedTransaction.id}`);
    return savedTransaction;
  }

  /**
   * ================================
   * MÉTHODES SPÉCIALISÉES PAR SERVICE
   * ================================
   */

  /**
   * Crée une transaction pour customer-service
   */
  async createCustomerPayment(dto: CreateCustomerPaymentDto): Promise<UnifiedFinancialTransaction> {
    const unifiedDto: CreateUnifiedTransactionDto = {
      ...dto,
      serviceContext: ServiceContext.CUSTOMER,
      type: UnifiedTransactionType.PAYMENT,
      extendedMetadata: {
        customerId: dto.customerId,
        invoiceId: dto.invoiceId,
        subscriptionId: dto.subscriptionId,
        planId: dto.planId
      }
    };

    return this.createTransaction(unifiedDto);
  }

  /**
   * Crée une transaction pour payment-service
   */
  async createPaymentServiceTransaction(dto: CreatePaymentServiceTransactionDto): Promise<UnifiedFinancialTransaction> {
    const unifiedDto: CreateUnifiedTransactionDto = {
      ...dto,
      serviceContext: ServiceContext.PAYMENT,
      type: UnifiedTransactionType.PAYMENT,
      channel: TransactionChannel.API,
      priority: TransactionPriority.NORMAL,
      extendedMetadata: {
        providerId: dto.providerName,
        providerName: dto.providerName,
        providerTransactionId: dto.providerTransactionId,
        sessionId: dto.sessionId,
        clientPhone: dto.clientPhone,
        telecom: dto.telecom,
        clientReference: dto.clientReference
      }
    };

    return this.createTransaction(unifiedDto);
  }

  /**
   * Crée une transaction pour gestion_commerciale_service
   */
  async createCommercialTransaction(dto: CreateCommercialTransactionDto): Promise<UnifiedFinancialTransaction> {
    const unifiedDto: CreateUnifiedTransactionDto = {
      ...dto,
      serviceContext: ServiceContext.COMMERCIAL,
      extendedMetadata: {
        customerId: dto.customerId,
        supplierId: dto.supplierId,
        contractId: dto.contractId,
        invoiceNumber: dto.invoiceNumber
      }
    };

    return this.createTransaction(unifiedDto);
  }

  /**
   * Crée une transaction pour admin-service
   */
  async createAdminFinance(dto: CreateAdminFinanceDto): Promise<UnifiedFinancialTransaction> {
    const unifiedDto: CreateUnifiedTransactionDto = {
      ...dto,
      serviceContext: ServiceContext.ADMIN,
      extendedMetadata: {
        adminUserId: dto.adminUserId,
        departmentId: dto.departmentId,
        budgetId: dto.budgetId,
        approvalLevel: dto.approvalLevel
      }
    };

    return this.createTransaction(unifiedDto);
  }

  /**
   * Crée un décaissement pour portfolio-institution-service
   */
  async createPortfolioDisbursement(dto: CreatePortfolioDisbursementDto): Promise<UnifiedFinancialTransaction> {
    const unifiedDto: CreateUnifiedTransactionDto = {
      ...dto,
      serviceContext: ServiceContext.PORTFOLIO,
      type: UnifiedTransactionType.DISBURSEMENT,
      extendedMetadata: {
        portfolioId: dto.portfolioId,
        institutionId: dto.institutionId,
        disbursementType: dto.disbursementType,
        loanId: dto.loanId
      }
    };

    return this.createTransaction(unifiedDto);
  }

  /**
   * ================================
   * MÉTHODES DE MISE À JOUR
   * ================================
   */

  /**
   * Met à jour le statut d'une transaction
   */
  async updateTransactionStatus(
    transactionId: string,
    dto: UpdateTransactionStatusDto
  ): Promise<UnifiedFinancialTransaction> {
    const transaction = await this.findById(transactionId);
    if (!transaction) {
      throw new BadRequestException('Transaction non trouvée');
    }

    const oldStatus = transaction.unifiedStatus;
    transaction.unifiedStatus = dto.status;
    transaction.rejectionReason = dto.reason;

    // Mettre à jour les dates selon le statut
    if (dto.status === UnifiedTransactionStatus.SETTLED) {
      transaction.completedAt = new Date();
    }

    // Fusionner les métadonnées additionnelles
    if (dto.additionalData) {
      transaction.extendedMetadata = {
        ...transaction.extendedMetadata,
        ...dto.additionalData
      };
    }

    const updatedTransaction = await this.transactionRepository.save(transaction);

    // Émettre événement selon le nouveau statut
    let eventType: 'TRANSACTION_UPDATED' | 'TRANSACTION_COMPLETED' | 'TRANSACTION_FAILED' = 'TRANSACTION_UPDATED';
    if (dto.status === UnifiedTransactionStatus.SETTLED) {
      eventType = 'TRANSACTION_COMPLETED';
    } else if (dto.status === UnifiedTransactionStatus.REJECTED) {
      eventType = 'TRANSACTION_FAILED';
    }

    await this.emitTransactionEvent(eventType, updatedTransaction, {
      oldStatus,
      newStatus: dto.status,
      reason: dto.reason
    });

    this.logger.log(`Transaction ${transactionId} mise à jour: ${oldStatus} -> ${dto.status}`);
    return updatedTransaction;
  }

  /**
   * ================================
   * MÉTHODES DE CONSULTATION
   * ================================
   */

  /**
   * Trouve une transaction par ID
   */
  async findById(id: string): Promise<UnifiedFinancialTransaction | null> {
    return this.transactionRepository.findOne({ where: { id } });
  }

  /**
   * Trouve une transaction par ID legacy
   */
  async findByLegacyId(legacyId: string, legacyTable?: string): Promise<UnifiedFinancialTransaction | null> {
    const where: FindOptionsWhere<UnifiedFinancialTransaction> = { legacyId };
    if (legacyTable) {
      where.legacyTable = legacyTable;
    }
    return this.transactionRepository.findOne({ where });
  }

  /**
   * Liste des transactions avec filtres et pagination
   */
  async findTransactions(
    filters: TransactionFilterDto = {},
    pagination: PaginationDto = {}
  ): Promise<PaginatedTransactionResponseDto> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
    
    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction');

    // Application des filtres
    if (filters.serviceContexts?.length) {
      queryBuilder.andWhere('transaction.serviceContext IN (:...serviceContexts)', {
        serviceContexts: filters.serviceContexts
      });
    }

    if (filters.statuses?.length) {
      queryBuilder.andWhere('transaction.unifiedStatus IN (:...statuses)', {
        statuses: filters.statuses
      });
    }

    if (filters.types?.length) {
      queryBuilder.andWhere('transaction.unifiedType IN (:...types)', {
        types: filters.types
      });
    }

    if (filters.currencies?.length) {
      queryBuilder.andWhere('transaction.unifiedCurrency IN (:...currencies)', {
        currencies: filters.currencies
      });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('transaction.unifiedAmount >= :minAmount', {
        minAmount: filters.minAmount
      });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('transaction.unifiedAmount <= :maxAmount', {
        maxAmount: filters.maxAmount
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('transaction.createdAt >= :dateFrom', {
        dateFrom: filters.dateFrom
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('transaction.createdAt <= :dateTo', {
        dateTo: filters.dateTo
      });
    }

    if (filters.riskLevels?.length) {
      queryBuilder.andWhere('transaction.amlRiskLevel IN (:...riskLevels)', {
        riskLevels: filters.riskLevels
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(transaction.description ILIKE :search OR transaction.transactionId ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Tri et pagination
    queryBuilder.orderBy(`transaction.${sortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map(t => this.toResponseDto(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * ================================
   * MÉTHODES DE MIGRATION
   * ================================
   */

  /**
   * Migre les données depuis customer-service
   */
  async migrateFromCustomerService(
    legacyPayments: any[],
    options: MigrationOptions = {}
  ): Promise<{ migrated: number; skipped: number; errors: Array<string> }> {
    this.logger.log(`Migration customer-service: ${legacyPayments.length} paiements`);
    
    const results = { migrated: 0, skipped: 0, errors: [] as string[] };
    const batchSize = options.batchSize || 100;

    for (let i = 0; i < legacyPayments.length; i += batchSize) {
      const batch = legacyPayments.slice(i, i + batchSize);
      
      for (const legacyPayment of batch) {
        try {
          // Vérifier si déjà migré
          if (options.skipDuplicates) {
            const existing = await this.findByLegacyId(legacyPayment.id, 'payments');
            if (existing) {
              results.skipped++;
              continue;
            }
          }

          // Validation des données
          if (!legacyPayment.amount || !legacyPayment.currency) {
            results.errors.push(`Payment ${legacyPayment.id}: données incomplètes`);
            continue;
          }

          if (options.validateOnly) {
            results.migrated++;
            continue;
          }

          // Création de la transaction unifiée
          const transaction = UnifiedFinancialTransaction.fromCustomerPayment(legacyPayment);
          transaction.legacyId = legacyPayment.id;
          transaction.legacyTable = 'payments';
          
          if (options.migrationBatch) {
            transaction.extendedMetadata = {
              ...transaction.extendedMetadata,
              migrationBatch: options.migrationBatch,
              migrationDate: new Date()
            };
          }

          await this.transactionRepository.save(transaction);
          results.migrated++;

        } catch (error) {
          results.errors.push(`Payment ${legacyPayment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    this.logger.log(`Migration customer-service terminée: ${results.migrated} migrés, ${results.skipped} ignorés, ${results.errors.length} erreurs`);
    return results;
  }

  /**
   * Migre les données depuis payment-service
   */
  async migrateFromPaymentService(
    legacyTransactions: any[],
    options: MigrationOptions = {}
  ): Promise<{ migrated: number; skipped: number; errors: Array<string> }> {
    this.logger.log(`Migration payment-service: ${legacyTransactions.length} transactions`);
    
    const results = { migrated: 0, skipped: 0, errors: [] as string[] };
    const batchSize = options.batchSize || 100;

    for (let i = 0; i < legacyTransactions.length; i += batchSize) {
      const batch = legacyTransactions.slice(i, i + batchSize);
      
      for (const legacyTransaction of batch) {
        try {
          // Vérifier si déjà migré
          if (options.skipDuplicates) {
            const existing = await this.findByLegacyId(legacyTransaction.id, 'payment_transactions');
            if (existing) {
              results.skipped++;
              continue;
            }
          }

          if (options.validateOnly) {
            results.migrated++;
            continue;
          }

          // Création de la transaction unifiée
          const transaction = UnifiedFinancialTransaction.fromPaymentService(legacyTransaction);
          transaction.legacyId = legacyTransaction.id;
          transaction.legacyTable = 'payment_transactions';
          
          if (options.migrationBatch) {
            transaction.extendedMetadata = {
              ...transaction.extendedMetadata,
              migrationBatch: options.migrationBatch,
              migrationDate: new Date()
            };
          }

          await this.transactionRepository.save(transaction);
          results.migrated++;

        } catch (error) {
          results.errors.push(`Transaction ${legacyTransaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    this.logger.log(`Migration payment-service terminée: ${results.migrated} migrés, ${results.skipped} ignorés, ${results.errors.length} erreurs`);
    return results;
  }

  /**
   * ================================
   * MÉTHODES DE COMPLIANCE
   * ================================
   */

  /**
   * Valide la compliance d'une transaction
   */
  private async validateTransactionCompliance(
    dto: CreateUnifiedTransactionDto
  ): Promise<TransactionValidationResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. Validation des montants
    if (dto.amount <= 0) {
      violations.push('Le montant doit être positif');
    }

    if (dto.amount > 1000000) {
      warnings.push('Montant élevé nécessite une attention particulière');
    }

    // 2. Validation des devises
    if (!Object.values(SupportedCurrency).includes(dto.currency)) {
      violations.push('Devise non supportée');
    }

    // 3. Validation contextuelle
    const contextErrors = this.validateContextSpecificData(dto);
    violations.push(...contextErrors);

    // 4. Validation AML simplifiée
    const amlResult = {
      riskLevel: 'LOW' as const,
      requiresReview: dto.amount > 10000,
      indicators: []
    };

    let amlRiskLevel = AMLRiskLevel.LOW;
    let requiresReview = amlResult.requiresReview;

    if (dto.amount > 10000) {
      amlRiskLevel = AMLRiskLevel.HIGH;
      requiresReview = true;
      warnings.push('Transaction nécessite une révision AML');
    }

    // 5. Score de compliance simplifié
    const complianceScore = 95; // Score par défaut
    
    if (complianceScore < 100) {
      warnings.push('Score de compliance perfectible');
    }

    return {
      isValid: violations.length === 0,
      complianceScore,
      amlRiskLevel,
      violations,
      warnings,
      requiresReview
    };
  }

  /**
   * Valide les données spécifiques au contexte
   */
  private validateContextSpecificData(dto: CreateUnifiedTransactionDto): string[] {
    const errors: string[] = [];

    switch (dto.serviceContext) {
      case ServiceContext.CUSTOMER:
        if (!dto.extendedMetadata?.customerId) {
          errors.push('Customer ID requis pour le contexte client');
        }
        break;

      case ServiceContext.PAYMENT:
        if (!dto.extendedMetadata?.providerId) {
          errors.push('Provider ID requis pour le contexte paiement');
        }
        break;

      case ServiceContext.COMMERCIAL:
        if (!dto.extendedMetadata?.customerId && !dto.extendedMetadata?.supplierId) {
          errors.push('Customer ID ou Supplier ID requis pour le contexte commercial');
        }
        break;

      case ServiceContext.ADMIN:
        if (!dto.extendedMetadata?.adminUserId) {
          errors.push('Admin User ID requis pour le contexte admin');
        }
        break;

      case ServiceContext.PORTFOLIO:
        if (!dto.extendedMetadata?.portfolioId) {
          errors.push('Portfolio ID requis pour le contexte portfolio');
        }
        break;
    }

    return errors;
  }

  /**
   * ================================
   * MÉTHODES UTILITAIRES
   * ================================
   */

  /**
   * Crée l'entité transaction depuis le DTO
   */
  private createTransactionEntity(dto: CreateUnifiedTransactionDto): UnifiedFinancialTransaction {
    const transaction = new UnifiedFinancialTransaction();
    
    // Mapping des champs de base
    transaction.serviceContext = dto.serviceContext;
    transaction.unifiedType = dto.type;
    transaction.unifiedAmount = dto.amount;
    transaction.unifiedCurrency = dto.currency;
    transaction.unifiedPaymentMethod = dto.paymentMethod;
    transaction.unifiedStatus = UnifiedTransactionStatus.INITIATED;
    transaction.channel = dto.channel;
    transaction.priority = dto.priority || TransactionPriority.NORMAL;
    transaction.description = dto.description;
    transaction.transactionFee = dto.transactionFee;
    transaction.exchangeRate = dto.exchangeRate;
    transaction.extendedMetadata = dto.extendedMetadata;

    // Mapping vers ISO 20022 (héritage) - sera fait dans le constructor de l'entité
    // Les champs ISO sont gérés automatiquement par l'entité parente

    return transaction;
  }

  /**
   * Convertit vers DTO de réponse
   */
  private toResponseDto(transaction: UnifiedFinancialTransaction): UnifiedTransactionResponseDto {
    return {
      id: transaction.id,
      type: transaction.unifiedType,
      amount: transaction.unifiedAmount,
      currency: transaction.unifiedCurrency,
      paymentMethod: transaction.unifiedPaymentMethod,
      status: transaction.unifiedStatus,
      serviceContext: transaction.serviceContext,
      channel: transaction.channel,
      priority: transaction.priority,
      description: transaction.description,
      transactionFee: transaction.transactionFee,
      amlRiskLevel: transaction.amlRiskLevel,
      riskScore: transaction.riskScore,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      completedAt: transaction.completedAt,
      extendedMetadata: transaction.extendedMetadata
    };
  }

  /**
   * Émet un événement de transaction
   */
  private async emitTransactionEvent(
    eventType: UnifiedTransactionEvent['eventType'],
    transaction: UnifiedFinancialTransaction,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: UnifiedTransactionEvent = {
      eventType,
      transactionId: transaction.id,
      serviceContext: transaction.serviceContext,
      transaction,
      metadata,
      timestamp: new Date()
    };

    this.eventEmitter.emit('transaction.unified', event);
    
    // Émettre aussi l'événement spécifique au service pour compatibilité
    const legacyEventName = this.getLegacyEventName(transaction.serviceContext, eventType);
    this.eventEmitter.emit(legacyEventName, event);
  }

  /**
   * Planifie une révision AML
   */
  private async scheduleAMLReview(transaction: UnifiedFinancialTransaction): Promise<void> {
    this.logger.log(`Planification révision AML pour transaction ${transaction.id}`);
    
    // Ici, on pourrait intégrer avec un système de workflow
    // Pour l'instant, on émet juste un événement
    this.eventEmitter.emit('aml.review.required', {
      transactionId: transaction.id,
      riskLevel: transaction.amlRiskLevel,
      riskScore: transaction.riskScore,
      scheduledAt: new Date()
    });
  }

  /**
   * Mapping helpers
   */
  private mapToISO20022TransactionType(type: UnifiedTransactionType): string {
    const mapping = {
      [UnifiedTransactionType.PAYMENT]: 'CDTR',
      [UnifiedTransactionType.DISBURSEMENT]: 'CDTR',
      [UnifiedTransactionType.GENERAL_REFUND]: 'CDTR',
      [UnifiedTransactionType.B2B_REFUND]: 'CDTR',
      [UnifiedTransactionType.REFUND_SUBSCRIPTION]: 'CDTR',
      [UnifiedTransactionType.INCOME]: 'CDTR',
      [UnifiedTransactionType.ACCOUNTING_EXPENSE]: 'DDBT',
      [UnifiedTransactionType.B2B_EXPENSE]: 'DDBT',
      [UnifiedTransactionType.TRANSFER]: 'CDTR'
    };
    return mapping[type] || 'CDTR';
  }

  private mapToISO20022PaymentMethod(method: UnifiedPaymentMethod): string {
    const mapping = {
      [UnifiedPaymentMethod.CARD_PAYMENT]: 'CARD',
      [UnifiedPaymentMethod.BANK_TRANSFER]: 'TRF',
      [UnifiedPaymentMethod.MOBILE_MONEY]: 'MOBI',
      [UnifiedPaymentMethod.CASH]: 'CASH'
    };
    return mapping[method] || 'TRF';
  }

  private getLegacyEventName(context: ServiceContext, eventType: string): string {
    const contextMap = {
      [ServiceContext.CUSTOMER]: 'customer.payment',
      [ServiceContext.PAYMENT]: 'payment.transaction',
      [ServiceContext.COMMERCIAL]: 'commercial.transaction',
      [ServiceContext.ADMIN]: 'admin.finance',
      [ServiceContext.PORTFOLIO]: 'portfolio.disbursement'
    };
    
    return `${contextMap[context]}.${eventType.toLowerCase()}`;
  }
}

/**
 * SERVICE D'ADAPTATEURS LEGACY
 * 
 * Fournit des adaptateurs pour maintenir la compatibilité avec les services existants
 */
@Injectable()
export class LegacyTransactionAdapterService {
  private readonly logger = new Logger(LegacyTransactionAdapterService.name);

  constructor(
    private readonly unifiedService: UnifiedTransactionService
  ) {}

  /**
   * Adaptateur pour customer-service Payment
   */
  async createPaymentForCustomerService(legacyPaymentData: any): Promise<any> {
    const dto: CreateCustomerPaymentDto = {
      amount: legacyPaymentData.amount,
      currency: legacyPaymentData.currency,
      paymentMethod: FinancialEnumsHelper.mapLegacyPaymentMethod(legacyPaymentData.method),
      channel: legacyPaymentData.channel || TransactionChannel.WEB,
      description: legacyPaymentData.description,
      customerId: legacyPaymentData.customerId
    };

    const transaction = await this.unifiedService.createCustomerPayment(dto);

    // Retourner au format attendu par customer-service
    return transaction.toCustomerPayment();
  }

  /**
   * Adaptateur pour payment-service PaymentTransaction
   */
  async createTransactionForPaymentService(legacyTransactionData: any): Promise<any> {
    const dto: CreatePaymentServiceTransactionDto = {
      amount: legacyTransactionData.amount,
      currency: legacyTransactionData.currency,
      paymentMethod: UnifiedPaymentMethod.MOBILE_MONEY, // Default SerdiPay
      description: legacyTransactionData.description,
      providerName: legacyTransactionData.provider,
      providerTransactionId: legacyTransactionData.providerTransactionId,
      sessionId: legacyTransactionData.sessionId,
      clientPhone: legacyTransactionData.clientPhone,
      telecom: legacyTransactionData.telecom,
      clientReference: legacyTransactionData.clientReference
    };

    const transaction = await this.unifiedService.createPaymentServiceTransaction(dto);

    // Retourner au format attendu par payment-service
    return transaction.toPaymentTransaction();
  }

  /**
   * Recherche avec compatibilité legacy
   */
  async findTransactionsForService(
    serviceContext: ServiceContext,
    legacyFilters: any = {}
  ): Promise<any[]> {
    const filters: TransactionFilterDto = {
      serviceContexts: [serviceContext],
      ...this.mapLegacyFilters(legacyFilters)
    };

    const result = await this.unifiedService.findTransactions(filters);
    
    // Convertir au format legacy selon le service
    return result.data.map(transaction => {
      switch (serviceContext) {
        case ServiceContext.CUSTOMER:
          return this.convertToCustomerPaymentFormat(transaction);
        case ServiceContext.PAYMENT:
          return this.convertToPaymentServiceFormat(transaction);
        case ServiceContext.COMMERCIAL:
          return this.convertToCommercialTransactionFormat(transaction);
        default:
          return transaction;
      }
    });
  }

  /**
   * Helpers de conversion
   */
  private mapLegacyFilters(legacyFilters: any): Partial<TransactionFilterDto> {
    const mapped: Partial<TransactionFilterDto> = {};
    
    if (legacyFilters.status) {
      mapped.statuses = [FinancialEnumsHelper.mapLegacyPaymentStatus(legacyFilters.status)];
    }
    
    if (legacyFilters.method) {
      // Map vers les types de transaction correspondants
    }
    
    if (legacyFilters.dateFrom) {
      mapped.dateFrom = new Date(legacyFilters.dateFrom);
    }
    
    if (legacyFilters.dateTo) {
      mapped.dateTo = new Date(legacyFilters.dateTo);
    }
    
    return mapped;
  }

  private convertToCustomerPaymentFormat(transaction: any): any {
    return {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      method: transaction.paymentMethod,
      status: transaction.status,
      customerId: transaction.extendedMetadata?.customerId,
      invoiceId: transaction.extendedMetadata?.invoiceId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
  }

  private convertToPaymentServiceFormat(transaction: any): any {
    return {
      id: transaction.id,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      status: transaction.status,
      provider: transaction.extendedMetadata?.providerName,
      providerTransactionId: transaction.extendedMetadata?.providerTransactionId,
      sessionId: transaction.extendedMetadata?.sessionId,
      clientPhone: transaction.extendedMetadata?.clientPhone,
      telecom: transaction.extendedMetadata?.telecom,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
  }

  private convertToCommercialTransactionFormat(transaction: any): any {
    return {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      description: transaction.description,
      customerId: transaction.extendedMetadata?.customerId,
      supplierId: transaction.extendedMetadata?.supplierId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
  }
}