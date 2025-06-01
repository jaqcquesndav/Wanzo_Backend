import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  TokenPackage,
  TokenTransaction,
  TokenBalance,
  TokenConsumptionLog,
  TokenTransactionType,
  TokenTransactionStatus
} from '../entities';
import {
  TokenBalanceDto,
  TokenPackageDto,
  TokenPackagesResponseDto,
  CreateTokenPackageDto,
  UpdateTokenPackageDto,
  TokenPackageQueryDto,
  TokenTransactionDto,
  TransactionResponseDto,
  CreateTokenTransactionDto,
  UpdateTokenTransactionDto,
  TokenTransactionQueryDto,
  TokenTransactionsResponseDto,
  PurchaseTokensDto,
  TokenConsumptionLogDto,
  CreateTokenConsumptionLogDto,
  TokenConsumptionQueryDto,
  TokenConsumptionLogsResponseDto,
  TokenAnalyticsDto,
  TokenAnalyticsQueryDto,
  TokenUsageByFeatureDto,
  TokenUsageByDayDto
} from '../dtos';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(TokenPackage)
    private tokenPackageRepository: Repository<TokenPackage>,
    @InjectRepository(TokenTransaction)
    private tokenTransactionRepository: Repository<TokenTransaction>,
    @InjectRepository(TokenBalance)
    private tokenBalanceRepository: Repository<TokenBalance>,
    @InjectRepository(TokenConsumptionLog)
    private tokenConsumptionLogRepository: Repository<TokenConsumptionLog>
  ) {}

  // Token Balance Methods
  async getTokenBalance(userId: string, customerAccountId?: string): Promise<TokenBalanceDto> {
    const where: FindOptionsWhere<TokenBalance> = { userId };
    if (customerAccountId) {
      where.customerAccountId = customerAccountId;
    }

    let balance = await this.tokenBalanceRepository.findOne({ where });

    if (!balance) {
      // Create a new balance record if none exists
      balance = this.tokenBalanceRepository.create({
        userId,
        customerAccountId,
        available: 0,
        allocated: 0,
        used: 0
      });
      await this.tokenBalanceRepository.save(balance);
    }

    return {
      available: balance.available,
      allocated: balance.allocated,
      used: balance.used,
      lastUpdated: balance.updatedAt
    };
  }

  async updateTokenBalance(
    userId: string, 
    changes: { available?: number; allocated?: number; used?: number },
    customerAccountId?: string
  ): Promise<TokenBalanceDto> {
    const where: FindOptionsWhere<TokenBalance> = { userId };
    if (customerAccountId) {
      where.customerAccountId = customerAccountId;
    }

    let balance = await this.tokenBalanceRepository.findOne({ where });

    if (!balance) {
      // Create a new balance record if none exists
      balance = this.tokenBalanceRepository.create({
        userId,
        customerAccountId,
        available: changes.available || 0,
        allocated: changes.allocated || 0,
        used: changes.used || 0
      });
    } else {
      // Update existing balance
      if (changes.available !== undefined) {
        balance.available = changes.available;
      }
      if (changes.allocated !== undefined) {
        balance.allocated = changes.allocated;
      }
      if (changes.used !== undefined) {
        balance.used = changes.used;
      }
    }

    await this.tokenBalanceRepository.save(balance);

    return {
      available: balance.available,
      allocated: balance.allocated,
      used: balance.used,
      lastUpdated: balance.updatedAt
    };
  }

  // Token Package Methods
  async getTokenPackages(queryDto: TokenPackageQueryDto): Promise<TokenPackagesResponseDto> {
    const { isActive, page = 1, limit = 20 } = queryDto;
    const where: FindOptionsWhere<TokenPackage> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [packages, total] = await this.tokenPackageRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { price: 'ASC' }
    });

    return {
      packages
    };
  }

  async getTokenPackageById(id: string): Promise<TokenPackageDto> {
    const tokenPackage = await this.tokenPackageRepository.findOne({
      where: { id }
    });

    if (!tokenPackage) {
      throw new NotFoundException(`Token package with ID ${id} not found`);
    }

    return tokenPackage;
  }

  async createTokenPackage(createDto: CreateTokenPackageDto): Promise<TokenPackageDto> {
    // Check if package with same name exists
    const existingPackage = await this.tokenPackageRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingPackage) {
      throw new ConflictException(`Token package with name "${createDto.name}" already exists`);
    }

    const tokenPackage = this.tokenPackageRepository.create(createDto);
    return this.tokenPackageRepository.save(tokenPackage);
  }

  async updateTokenPackage(id: string, updateDto: UpdateTokenPackageDto): Promise<TokenPackageDto> {
    const tokenPackage = await this.getTokenPackageById(id);

    // Check name uniqueness if changing name
    if (updateDto.name && updateDto.name !== tokenPackage.name) {
      const existingPackage = await this.tokenPackageRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingPackage) {
        throw new ConflictException(`Token package with name "${updateDto.name}" already exists`);
      }
    }

    // Update the package with new values
    Object.assign(tokenPackage, updateDto);
    return this.tokenPackageRepository.save(tokenPackage);
  }
  async deleteTokenPackage(id: string): Promise<void> {
    const tokenPackage = await this.getTokenPackageById(id);
    
    // Fetch the actual entity from the repository, not just the DTO
    const tokenPackageEntity = await this.tokenPackageRepository.findOne({
      where: { id }
    });
    
    if (!tokenPackageEntity) {
      throw new NotFoundException(`Token package with ID ${id} not found`);
    }
    
    // Check if there are any transactions using this package
    const transactionCount = await this.tokenTransactionRepository.count({
      where: { packageId: id }
    });

    if (transactionCount > 0) {
      // Instead of deleting, just mark as inactive
      tokenPackageEntity.isActive = false;
      await this.tokenPackageRepository.save(tokenPackageEntity);
    } else {
      await this.tokenPackageRepository.remove(tokenPackageEntity);
    }
  }

  // Token Transaction Methods
  async getTokenTransactions(queryDto: TokenTransactionQueryDto): Promise<TokenTransactionsResponseDto> {
    const { 
      userId, 
      customerAccountId,
      type, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = queryDto;

    const where: FindOptionsWhere<TokenTransaction> = {};

    if (userId) where.userId = userId;
    if (customerAccountId) where.customerAccountId = customerAccountId;
    if (type) where.type = type;
    if (status) where.status = status;    // Date range filtering
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getTokenTransactionById(id: string): Promise<TokenTransactionDto> {
    const transaction = await this.tokenTransactionRepository.findOne({
      where: { id }
    });

    if (!transaction) {
      throw new NotFoundException(`Token transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async createTokenTransaction(createDto: CreateTokenTransactionDto): Promise<TokenTransactionDto> {
    const transaction = this.tokenTransactionRepository.create(createDto);
    
    const savedTransaction = await this.tokenTransactionRepository.save(transaction);

    // Update token balance if transaction is completed
    if (savedTransaction.status === TokenTransactionStatus.COMPLETED) {
      await this.updateBalanceFromTransaction(savedTransaction);
    }

    return savedTransaction;
  }

  async updateTokenTransaction(id: string, updateDto: UpdateTokenTransactionDto): Promise<TransactionResponseDto> {
    const transaction = await this.getTokenTransactionById(id);
    const oldStatus = transaction.status;

    // Update the transaction with new values
    Object.assign(transaction, updateDto);
    const updatedTransaction = await this.tokenTransactionRepository.save(transaction);

    let newBalance = null;

    // If status changed to COMPLETED, update token balance
    if (oldStatus !== TokenTransactionStatus.COMPLETED && 
        updatedTransaction.status === TokenTransactionStatus.COMPLETED) {
      newBalance = await this.updateBalanceFromTransaction(updatedTransaction);
    }

    return {
      transaction: updatedTransaction,
      newBalance
    };
  }

  // Helper method to update balance based on transaction
  private async updateBalanceFromTransaction(transaction: TokenTransaction): Promise<TokenBalanceDto | null> {
    if (transaction.status !== TokenTransactionStatus.COMPLETED) {
      return null;
    }

    const { userId, customerAccountId, type, tokenAmount } = transaction;
    const currentBalance = await this.getTokenBalance(userId, customerAccountId);
    
    let updatedBalance;

    switch (type) {
      case TokenTransactionType.PURCHASE:
      case TokenTransactionType.BONUS:
        // Add tokens to available balance
        updatedBalance = await this.updateTokenBalance(
          userId,
          { 
            available: currentBalance.available + tokenAmount,
            allocated: currentBalance.allocated + tokenAmount
          },
          customerAccountId
        );
        break;
      
      case TokenTransactionType.CONSUMPTION:
        // Reduce available balance and increase used
        if (currentBalance.available < tokenAmount) {
          throw new BadRequestException('Insufficient token balance');
        }
        updatedBalance = await this.updateTokenBalance(
          userId,
          { 
            available: currentBalance.available - tokenAmount,
            used: currentBalance.used + tokenAmount
          },
          customerAccountId
        );
        break;
      
      case TokenTransactionType.REFUND:
        // Return tokens to available balance
        updatedBalance = await this.updateTokenBalance(
          userId,
          { 
            available: currentBalance.available + tokenAmount,
            used: Math.max(0, currentBalance.used - tokenAmount)
          },
          customerAccountId
        );
        break;
      
      case TokenTransactionType.ADJUSTMENT:
        // Direct adjustment, could be positive or negative
        updatedBalance = await this.updateTokenBalance(
          userId,
          { 
            available: currentBalance.available + tokenAmount,
            allocated: currentBalance.allocated + (tokenAmount > 0 ? tokenAmount : 0)
          },
          customerAccountId
        );
        break;
    }

    return updatedBalance;
  }

  // Token Purchase Methods
  async purchaseTokens(purchaseDto: PurchaseTokensDto): Promise<TransactionResponseDto> {
    const { 
      packageId, 
      paymentMethod, 
      transactionReference, 
      proofDocumentUrl,
      userId,
      customerAccountId
    } = purchaseDto;

    // Verify the package exists
    const tokenPackage = await this.getTokenPackageById(packageId);
    if (!tokenPackage.isActive) {
      throw new BadRequestException('Token package is not active');
    }

    // Calculate total tokens including any bonus
    let totalTokens = tokenPackage.tokens;
    if (tokenPackage.bonusPercentage) {
      const bonusTokens = Math.floor(tokenPackage.tokens * (tokenPackage.bonusPercentage / 100));
      totalTokens += bonusTokens;
    }

    // Determine transaction status based on payment method
    let status = TokenTransactionStatus.COMPLETED;
    if (paymentMethod === 'bank_transfer' && !proofDocumentUrl) {
      status = TokenTransactionStatus.PENDING_VERIFICATION;
    }

    // Create the transaction
    const createTransactionDto: CreateTokenTransactionDto = {
      userId,
      customerAccountId,
      type: TokenTransactionType.PURCHASE,
      tokenAmount: totalTokens,
      amount: tokenPackage.price,
      currency: tokenPackage.currency,
      packageId,
      paymentMethod,
      status,
      transactionReference,
      proofDocumentUrl,
      notes: `Purchase of ${tokenPackage.name} package`
    };

    const transaction = await this.createTokenTransaction(createTransactionDto);

    // If transaction is completed, update balance and return it
    let newBalance = null;
    if (transaction.status === TokenTransactionStatus.COMPLETED) {
      newBalance = await this.getTokenBalance(userId, customerAccountId);
    }

    return {
      transaction,
      newBalance
    };
  }

  // Token Consumption Methods
  async logTokenConsumption(createDto: CreateTokenConsumptionLogDto): Promise<TokenConsumptionLogDto> {
    const { userId, customerAccountId, tokensConsumed, featureUsed } = createDto;

    // Verify user has enough tokens
    const balance = await this.getTokenBalance(userId, customerAccountId);
    if (balance.available < tokensConsumed) {
      throw new BadRequestException('Insufficient token balance');
    }

    // Create consumption log
    const consumptionLog = this.tokenConsumptionLogRepository.create(createDto);
    const savedLog = await this.tokenConsumptionLogRepository.save(consumptionLog);

    // Create a consumption transaction
    await this.createTokenTransaction({
      userId,
      customerAccountId,
      type: TokenTransactionType.CONSUMPTION,
      tokenAmount: tokensConsumed,
      amount: 0, // No monetary value for consumption
      currency: 'USD', // Default currency
      status: TokenTransactionStatus.COMPLETED,
      notes: `Consumed ${tokensConsumed} tokens for ${featureUsed}`
    });

    return savedLog;
  }

  async getTokenConsumptionLogs(queryDto: TokenConsumptionQueryDto): Promise<TokenConsumptionLogsResponseDto> {
    const { 
      userId, 
      customerAccountId,
      featureUsed, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = queryDto;

    const where: FindOptionsWhere<TokenConsumptionLog> = {};

    if (userId) where.userId = userId;
    if (customerAccountId) where.customerAccountId = customerAccountId;
    if (featureUsed) where.featureUsed = featureUsed;

    // Date range filtering    // Date range filtering
    if (startDate && endDate) {
      where.timestamp = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.timestamp = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.timestamp = LessThanOrEqual(new Date(endDate));
    }

    const [logs, total] = await this.tokenConsumptionLogRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { timestamp: 'DESC' }
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Token Analytics Methods
  async getTokenAnalytics(queryDto: TokenAnalyticsQueryDto): Promise<TokenAnalyticsDto> {
    const { userId, customerAccountId, startDate, endDate } = queryDto;
    
    // Set default date range to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    start.setDate(start.getDate() - 30);

    // Base query conditions
    const baseWhere: any = {
      userId,
      timestamp: Between(start, end)
    };
    if (customerAccountId) {
      baseWhere.customerAccountId = customerAccountId;
    }

    // Get total tokens purchased
    const purchaseTransactions = await this.tokenTransactionRepository.find({
      where: {
        userId,
        type: TokenTransactionType.PURCHASE,
        status: TokenTransactionStatus.COMPLETED,
        createdAt: Between(start, end),
        ...(customerAccountId && { customerAccountId })
      }
    });
    const totalTokensPurchased = purchaseTransactions.reduce(
      (sum, transaction) => sum + transaction.tokenAmount, 
      0
    );

    // Get token consumption logs
    const consumptionLogs = await this.tokenConsumptionLogRepository.find({
      where: baseWhere
    });
    const totalTokensConsumed = consumptionLogs.reduce(
      (sum, log) => sum + log.tokensConsumed, 
      0
    );

    // Calculate consumption rate
    const consumptionRate = totalTokensPurchased > 0 
      ? (totalTokensConsumed / totalTokensPurchased) * 100 
      : 0;

    // Group consumption by feature
    const featureMap = new Map<string, number>();
    for (const log of consumptionLogs) {
      const current = featureMap.get(log.featureUsed) || 0;
      featureMap.set(log.featureUsed, current + log.tokensConsumed);
    }

    const usageByFeature: TokenUsageByFeatureDto[] = Array.from(featureMap.entries())
      .map(([featureUsed, tokensConsumed]) => ({
        featureUsed,
        tokensConsumed,
        percentage: totalTokensConsumed > 0 
          ? (tokensConsumed / totalTokensConsumed) * 100 
          : 0
      }))
      .sort((a, b) => b.tokensConsumed - a.tokensConsumed);

    // Group consumption by day
    const dayMap = new Map<string, number>();
    for (const log of consumptionLogs) {
      const dateStr = log.timestamp.toISOString().split('T')[0];
      const current = dayMap.get(dateStr) || 0;
      dayMap.set(dateStr, current + log.tokensConsumed);
    }

    const usageByDay: TokenUsageByDayDto[] = Array.from(dayMap.entries())
      .map(([date, tokensConsumed]) => ({
        date,
        tokensConsumed
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTokensPurchased,
      totalTokensConsumed,
      consumptionRate,
      usageByFeature,
      usageByDay
    };
  }
}
