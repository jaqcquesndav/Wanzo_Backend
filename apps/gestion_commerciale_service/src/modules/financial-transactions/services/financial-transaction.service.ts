import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, Like, In, FindOptionsWhere } from 'typeorm';
import { FinancialTransaction, TransactionType, TransactionStatus } from '../entities/financial-transaction.entity';
import { TransactionCategory } from '../entities/transaction-category.entity';
import { CreateFinancialTransactionDto, UpdateFinancialTransactionDto } from '../dtos/financial-transaction.dto';
import { FilterTransactionsDto, TransactionSummaryDto } from '../dtos/filter-transactions.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinancialTransactionService {
  private readonly logger = new Logger(FinancialTransactionService.name);

  constructor(
    @InjectRepository(FinancialTransaction)
    private transactionRepository: Repository<FinancialTransaction>,
    @InjectRepository(TransactionCategory)
    private categoryRepository: Repository<TransactionCategory>,
    private dataSource: DataSource,
  ) {}

  /**
   * Génère un numéro de référence pour une nouvelle transaction
   */
  private async generateReferenceNumber(companyId: string, transactionType: TransactionType): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Préfixe basé sur le type de transaction
    let prefix: string;
    
    switch(transactionType) {
      case TransactionType.SALE:
        prefix = 'SLE';
        break;
      case TransactionType.PURCHASE:
        prefix = 'PUR';
        break;
      case TransactionType.CUSTOMER_PAYMENT:
        prefix = 'CPN';
        break;
      case TransactionType.SUPPLIER_PAYMENT:
        prefix = 'SPN';
        break;
      case TransactionType.REFUND:
        prefix = 'RFD';
        break;
      case TransactionType.EXPENSE:
        prefix = 'EXP';
        break;
      case TransactionType.PAYROLL:
        prefix = 'PAY';
        break;
      case TransactionType.TAX_PAYMENT:
        prefix = 'TAX';
        break;
      case TransactionType.TRANSFER:
        prefix = 'TRF';
        break;
      default:
        prefix = 'TRX';
    }

    // Trouver le dernier numéro utilisé pour ce type de transaction ce mois-ci
    const lastTransaction = await this.transactionRepository.findOne({
      where: { 
        companyId,
        referenceNumber: Like(`${prefix}-${year}${month}-%`) 
      },
      order: { referenceNumber: 'DESC' }
    });

    let sequenceNumber = 1;
    if (lastTransaction) {
      const parts = lastTransaction.referenceNumber.split('-');
      if (parts.length === 3) {
        sequenceNumber = parseInt(parts[2], 10) + 1;
      }
    }

    // Formater le numéro de séquence avec des zéros non significatifs
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    return `${prefix}-${year}${month}-${formattedSequence}`;
  }

  /**
   * Crée une nouvelle transaction financière
   */
  async create(
    companyId: string, 
    userId: string, 
    createTransactionDto: CreateFinancialTransactionDto
  ): Promise<FinancialTransaction> {
    this.logger.log(`Création d'une nouvelle transaction financière pour la société ${companyId}`);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Générer un numéro de référence pour la transaction
      const referenceNumber = await this.generateReferenceNumber(
        companyId, 
        createTransactionDto.transactionType
      );

      // Créer la transaction
      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        companyId,
        createdById: userId,
        referenceNumber,
      });

      // Si des catégories sont spécifiées, vérifier leur existence
      if (createTransactionDto.categoryIds && createTransactionDto.categoryIds.length > 0) {
        const categories = await this.categoryRepository.findBy({
          id: In(createTransactionDto.categoryIds),
          companyId,
        });

        if (categories.length !== createTransactionDto.categoryIds.length) {
          throw new BadRequestException('Une ou plusieurs catégories spécifiées sont invalides');
        }

        // Les catégories seront associées via une table de jointure ultérieurement
      }

      // Sauvegarder la transaction
      const savedTransaction = await queryRunner.manager.save(transaction);
      
      // Faire le commit de la transaction
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error: unknown) {
      // En cas d'erreur, annuler la transaction
      await queryRunner.rollbackTransaction();
      
      if (error instanceof Error) {
        this.logger.error(`Erreur lors de la création d'une transaction: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Erreur lors de la création d'une transaction: ${error}`);
      }
      throw error;
    } finally {
      // Libérer la connexion dans tous les cas
      await queryRunner.release();
    }
  }

  /**
   * Récupère toutes les transactions avec filtres et pagination
   */
  async findAll(companyId: string, filterDto: FilterTransactionsDto) {
    this.logger.log(`Récupération des transactions pour la société ${companyId} avec filtres`);
    
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'transactionDate', 
      sortOrder = 'DESC',
      transactionTypes,
      statuses,
      paymentMethods,
      customerId,
      supplierId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      currency,
      searchTerm,
      categoryIds,
      relatedDocumentType,
      relatedDocumentId,
      relatedDocumentNumber,
    } = filterDto;
    
    const skip = (page - 1) * limit;
    
    // Construire les conditions where
    const where: FindOptionsWhere<FinancialTransaction> = { companyId };
    
    if (transactionTypes && transactionTypes.length > 0) {
      where.transactionType = In(transactionTypes);
    }
    
    if (statuses && statuses.length > 0) {
      where.status = In(statuses);
    }
    
    if (paymentMethods && paymentMethods.length > 0) {
      where.paymentMethod = In(paymentMethods);
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (supplierId) {
      where.supplierId = supplierId;
    }
    
    if (startDate && endDate) {
      where.transactionDate = Between(startDate, endDate);
    } else if (startDate) {
      where.transactionDate = Between(startDate, new Date());
    } else if (endDate) {
      where.transactionDate = Between(new Date(0), endDate);
    }
    
    if (minAmount !== undefined && maxAmount !== undefined) {
      where.amount = Between(minAmount, maxAmount);
    } else if (minAmount !== undefined) {
      where.amount = Between(minAmount, 999999999);
    } else if (maxAmount !== undefined) {
      where.amount = Between(0, maxAmount);
    }
    
    if (currency) {
      where.currency = currency;
    }
    
    if (searchTerm) {
      where.description = Like(`%${searchTerm}%`);
    }
    
    if (relatedDocumentType) {
      where.relatedDocumentType = relatedDocumentType;
    }
    
    if (relatedDocumentId) {
      where.relatedDocumentId = relatedDocumentId;
    }
    
    if (relatedDocumentNumber) {
      where.relatedDocumentNumber = Like(`%${relatedDocumentNumber}%`);
    }
    
    // Exécuter la requête
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      relations: ['customer', 'supplier', 'createdBy', 'approvedBy']
    });
    
    // Calculer des statistiques si demandées
    let summary: TransactionSummaryDto | undefined;
    if (filterDto.includeSubcategories) {
      summary = await this.getTransactionsSummary(companyId, filterDto);
    }
    
    return {
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      summary
    };
  }

  /**
   * Récupère une transaction par son ID
   */
  async findOne(companyId: string, id: string): Promise<FinancialTransaction> {
    this.logger.log(`Récupération de la transaction ${id} pour la société ${companyId}`);
    
    const transaction = await this.transactionRepository.findOne({
      where: { id, companyId },
      relations: ['customer', 'supplier', 'createdBy', 'approvedBy']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction avec l'ID ${id} non trouvée`);
    }
    
    return transaction;
  }

  /**
   * Met à jour une transaction existante
   */
  async update(
    companyId: string, 
    id: string, 
    updateTransactionDto: UpdateFinancialTransactionDto
  ): Promise<FinancialTransaction> {
    this.logger.log(`Mise à jour de la transaction ${id} pour la société ${companyId}`);
    
    const transaction = await this.findOne(companyId, id);
    
    // Vérifier si la transaction peut être modifiée (selon son statut)
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Une transaction complétée ne peut pas être modifiée');
    }
    
    // Mettre à jour les propriétés
    Object.assign(transaction, updateTransactionDto);
    
    return await this.transactionRepository.save(transaction);
  }

  /**
   * Supprime une transaction
   */
  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Suppression de la transaction ${id} pour la société ${companyId}`);
    
    const transaction = await this.findOne(companyId, id);
    
    // Vérifier si la transaction peut être supprimée (selon son statut)
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Une transaction complétée ne peut pas être supprimée');
    }
    
    await this.transactionRepository.remove(transaction);
  }

  /**
   * Change le statut d'une transaction
   */
  async updateStatus(
    companyId: string, 
    id: string, 
    status: TransactionStatus, 
    approvedById?: string
  ): Promise<FinancialTransaction> {
    this.logger.log(`Mise à jour du statut de la transaction ${id} vers ${status}`);
    
    const transaction = await this.findOne(companyId, id);
    
    transaction.status = status;
    
    // Si la transaction est approuvée, enregistrer l'utilisateur qui l'a approuvée
    if (status === TransactionStatus.COMPLETED && approvedById) {
      transaction.approvedById = approvedById;
      transaction.approvalDate = new Date();
    }
    
    return await this.transactionRepository.save(transaction);
  }

  /**
   * Calcule un résumé des transactions avec des statistiques
   */
  async getTransactionsSummary(companyId: string, filterDto: FilterTransactionsDto): Promise<TransactionSummaryDto> {
    this.logger.log(`Calcul du résumé des transactions pour la société ${companyId}`);
    
    const { 
      transactionTypes,
      statuses,
      startDate,
      endDate,
      customerId,
      supplierId,
      categoryIds,
    } = filterDto;
    
    // Construire les conditions where
    const where: FindOptionsWhere<FinancialTransaction> = { companyId };
    
    if (transactionTypes && transactionTypes.length > 0) {
      where.transactionType = In(transactionTypes);
    }
    
    if (statuses && statuses.length > 0) {
      where.status = In(statuses);
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (supplierId) {
      where.supplierId = supplierId;
    }
    
    if (startDate && endDate) {
      where.transactionDate = Between(startDate, endDate);
    } else if (startDate) {
      where.transactionDate = Between(startDate, new Date());
    } else if (endDate) {
      where.transactionDate = Between(new Date(0), endDate);
    }
    
    // Récupérer toutes les transactions
    const transactions = await this.transactionRepository.find({
      where,
      select: ['id', 'amount', 'transactionType', 'status']
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    let totalCount = transactions.length;
    
    const transactionTypeSummary: Record<string, number> = {};
    
    // Calculer les totaux par type de transaction
    for (const transaction of transactions) {
      // Déterminer si c'est une entrée ou une sortie d'argent
      switch (transaction.transactionType) {
        case TransactionType.SALE:
        case TransactionType.CUSTOMER_PAYMENT:
          totalIncome += Number(transaction.amount);
          break;
        case TransactionType.PURCHASE:
        case TransactionType.SUPPLIER_PAYMENT:
        case TransactionType.EXPENSE:
        case TransactionType.PAYROLL:
        case TransactionType.TAX_PAYMENT:
          totalExpense += Number(transaction.amount);
          break;
        case TransactionType.REFUND:
          totalExpense += Number(transaction.amount); // Les remboursements sont des sorties d'argent
          break;
        // Les transferts ne sont ni des entrées ni des sorties d'argent globales
      }
      
      // Agréger par type de transaction
      if (!transactionTypeSummary[transaction.transactionType]) {
        transactionTypeSummary[transaction.transactionType] = 0;
      }
      
      // Pour les dépenses, stocker le montant en négatif pour une meilleure représentation
      if ([
        TransactionType.PURCHASE, 
        TransactionType.SUPPLIER_PAYMENT, 
        TransactionType.EXPENSE, 
        TransactionType.PAYROLL, 
        TransactionType.TAX_PAYMENT, 
        TransactionType.REFUND
      ].includes(transaction.transactionType)) {
        transactionTypeSummary[transaction.transactionType] -= Number(transaction.amount);
      } else {
        transactionTypeSummary[transaction.transactionType] += Number(transaction.amount);
      }
    }
    
    // Préparer le résumé
    const summary: TransactionSummaryDto = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalCount,
      transactionTypeSummary,
      categorySummary: {} // À implémenter ultérieurement avec les catégories
    };
    
    return summary;
  }
}
