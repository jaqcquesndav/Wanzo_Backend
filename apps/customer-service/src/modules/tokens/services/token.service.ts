import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { TokenUsage, TokenServiceType } from '../entities/token-usage.entity';
import { TokenPurchase } from '../entities/token-purchase.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { PurchaseTokenDto } from '../dto/purchase-token.dto';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../system-users/entities/user.entity';

interface RecordTokenUsageDto {
  customerId: string;
  userId?: string;
  amount: number;
  serviceType: TokenServiceType | string;
  requestId?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenUsage)
    private readonly tokenUsageRepository: Repository<TokenUsage>,
    @InjectRepository(TokenPurchase)
    private readonly tokenPurchaseRepository: Repository<TokenPurchase>,
    private readonly customerEventsProducer: CustomerEventsProducer,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async purchaseTokens(purchaseDto: PurchaseTokenDto): Promise<TokenPurchase> {
    const customer = await this.customerRepository.findOne({ where: { id: purchaseDto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${purchaseDto.customerId} not found`);
    }

    const newPurchase = this.tokenPurchaseRepository.create(purchaseDto);
    const savedPurchase = await this.tokenPurchaseRepository.save(newPurchase);

    this.customerEventsProducer.emitTokenPurchased(savedPurchase);

    return savedPurchase;
  }

  async recordTokenPurchase(purchaseDto: PurchaseTokenDto): Promise<TokenPurchase> {
    const { customerId, amount, transactionId, currency, paymentMethod } = purchaseDto;

    const newPurchase = this.tokenPurchaseRepository.create({
      customerId,
      amount,
      transactionId,
      currency: currency || 'USD',
      metadata: {
        paymentMethod,
      },
    });

    const savedPurchase = await this.tokenPurchaseRepository.save(newPurchase);

    this.customerEventsProducer.emitTokenPurchased(savedPurchase);

    return savedPurchase;
  }

  async getTotalPurchasedTokens(customerId: string): Promise<number> {
    const result = await this.tokenPurchaseRepository
      .createQueryBuilder('token_purchase')
      .select('SUM(token_purchase.amount)', 'total')
      .where('token_purchase.customerId = :customerId', { customerId })
      .getRawOne();

    return result ? Number(result.total) || 0 : 0;
  }

  /**
   * Enregistre l'utilisation de tokens
   */
  async recordTokenUsage(usageDto: RecordTokenUsageDto): Promise<TokenUsage> {
    const tokenUsage = this.tokenUsageRepository.create({
      customerId: usageDto.customerId,
      userId: usageDto.userId,
      amount: usageDto.amount,
      serviceType: usageDto.serviceType as TokenServiceType,
      requestId: usageDto.requestId,
      context: usageDto.context || {},
      metadata: usageDto.metadata || {},
      timestamp: new Date(),
    });

    const savedUsage = await this.tokenUsageRepository.save(tokenUsage);
    
    // Nous pourrions envoyer un événement Kafka ici si nécessaire
    // par exemple pour notifier d'un seuil d'utilisation dépassé
    
    return savedUsage;
  }

  /**
   * Récupère l'historique d'utilisation des tokens pour un client
   */
  async getTokenUsageHistory(
    customerId: string,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 20
  ): Promise<[TokenUsage[], number]> {
    const query = this.tokenUsageRepository.createQueryBuilder('tokenUsage')
      .where('tokenUsage.customerId = :customerId', { customerId });
    
    if (startDate) {
      query.andWhere('tokenUsage.timestamp >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('tokenUsage.timestamp <= :endDate', { endDate });
    }
    
    return query
      .orderBy('tokenUsage.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  /**
   * Récupère la somme des tokens utilisés par un client
   */
  async getTotalTokenUsage(
    customerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const query = this.tokenUsageRepository.createQueryBuilder('tokenUsage')
      .select('SUM(tokenUsage.amount)', 'total')
      .where('tokenUsage.customerId = :customerId', { customerId });
    
    if (startDate) {
      query.andWhere('tokenUsage.timestamp >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('tokenUsage.timestamp <= :endDate', { endDate });
    }
    
    const result = await query.getRawOne();
    return result ? Number(result.total) || 0 : 0;
  }

  /**
   * Calcule le solde de tokens restants pour un client
   * NOTE: La logique d'achat/attribution de tokens n'est pas implémentée.
   *       Cette méthode simule un solde en soustrayant l'utilisation d'un crédit fixe.
   */
  async getTokenBalance(customerId: string): Promise<number> {
    const totalPurchased = await this.getTotalPurchasedTokens(customerId);
    const totalUsage = await this.getTotalTokenUsage(customerId);
    return totalPurchased - totalUsage;
  }

  /**
   * Récupère l'utilisation des tokens par service
   */
  async getTokenUsageByService(
    customerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ serviceType: TokenServiceType, total: number }[]> {
    const query = this.tokenUsageRepository.createQueryBuilder('tokenUsage')
      .select('tokenUsage.serviceType', 'serviceType')
      .addSelect('SUM(tokenUsage.amount)', 'total')
      .where('tokenUsage.customerId = :customerId', { customerId })
      .groupBy('tokenUsage.serviceType');
    
    if (startDate) {
      query.andWhere('tokenUsage.timestamp >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('tokenUsage.timestamp <= :endDate', { endDate });
    }
    
    const result = await query.getRawMany();
    return result.map(row => ({
      serviceType: row.serviceType as TokenServiceType,
      total: Number(row.total) || 0
    }));
  }

  /**
   * Récupère le solde de tokens d'un utilisateur par son Auth0 ID
   */
  async getTokenBalanceByAuth0Id(auth0Id: string): Promise<any> {
    // Trouver l'utilisateur par son Auth0 ID
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const totalPurchased = await this.getTotalPurchasedTokens(user.customerId);
    const totalUsage = await this.getTotalTokenUsage(user.customerId);
    const balance = totalPurchased - totalUsage;
    
    // Période courante (mois en cours)
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Renvoyer un format compatible avec le frontend
    return {
      id: user.customerId, // Utiliser l'ID client comme identifiant unique
      customerId: user.customerId,
      totalTokens: totalPurchased,
      usedTokens: totalUsage,
      remainingTokens: balance,
      monthlyAllocation: 0, // À définir selon votre logique d'allocation mensuelle
      rolledOverTokens: 0,  // À définir selon votre logique de report
      purchasedTokens: totalPurchased,
      bonusTokens: 0,       // À définir selon votre logique de bonus
      currentPeriod: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      periodStartDate: currentPeriodStart,
      periodEndDate: currentPeriodEnd,
      balance: balance,     // Pour la compatibilité avec le code existant
      totalPurchased: totalPurchased // Pour la compatibilité avec le code existant
    };
  }

  /**
   * Récupère les transactions de tokens d'un utilisateur par son Auth0 ID
   */
  async getTokenTransactionsByAuth0Id(
    auth0Id: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ 
    transactions: Array<{
      id: string;
      type: 'purchase' | 'usage';
      amount: number;
      price?: number;
      currency?: string;
      status: string;
      paymentMethod?: string;
      feature?: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    // Trouver l'utilisateur par son Auth0 ID
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer les achats de tokens
    const [purchases, purchaseCount] = await this.tokenPurchaseRepository.findAndCount({
      where: { customerId: user.customerId },
      order: { purchaseDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Récupérer les utilisations de tokens
    const [usages, usageCount] = await this.tokenUsageRepository.findAndCount({
      where: { customerId: user.customerId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Combiner et formater les transactions
    const transactions = [
      ...purchases.map(purchase => ({
        id: purchase.id,
        type: 'purchase' as const,
        amount: purchase.amount,
        price: purchase.price,
        currency: purchase.currency,
        status: 'completed', // Statut par défaut pour les achats
        paymentMethod: purchase.metadata?.paymentMethod || 'unknown',
        createdAt: purchase.purchaseDate.toISOString(),
      })),
      ...usages.map(usage => ({
        id: usage.id,
        type: 'usage' as const,
        amount: -usage.amount, // Négatif pour l'utilisation
        status: 'completed',
        feature: usage.serviceType,
        createdAt: usage.timestamp.toISOString(),
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      transactions: transactions.slice(0, limit),
      total: purchaseCount + usageCount,
      page,
      limit
    };
  }

  /**
   * Get current user usage history with filtering by service type and date range
   */
  async getCurrentUserUsageHistory(
    auth0Id: string,
    startDate?: string,
    endDate?: string,
    serviceType?: string,
    page = 1,
    limit = 20
  ) {
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const whereConditions: any = { customerId: user.customerId };

    // Ajouter filtre de date si fourni
    if (startDate || endDate) {
      whereConditions.timestamp = {};
      if (startDate) {
        whereConditions.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        whereConditions.timestamp.lte = new Date(endDate);
      }
    }

    // Ajouter filtre de type de service si fourni
    if (serviceType) {
      whereConditions.serviceType = serviceType;
    }

    const [usages, total] = await this.tokenUsageRepository.findAndCount({
      where: whereConditions,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: {
        items: usages.map(usage => ({
          id: usage.id,
          amount: usage.amount,
          serviceType: usage.serviceType,
          timestamp: usage.timestamp.toISOString(),
          requestId: usage.requestId,
          context: usage.context,
          metadata: usage.metadata
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get current user usage summary
   */
  async getCurrentUserUsageSummary(auth0Id: string) {
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Total des tokens utilisés
    const totalUsageResult = await this.tokenUsageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId: user.customerId })
      .getRawOne();

    const totalUsed = totalUsageResult?.total || 0;

    // Utilisation par service
    const usageByService = await this.tokenUsageRepository
      .createQueryBuilder('usage')
      .select('usage.serviceType', 'serviceType')
      .addSelect('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId: user.customerId })
      .groupBy('usage.serviceType')
      .getRawMany();

    // Utilisation des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysUsage = await this.tokenUsageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId: user.customerId })
      .andWhere('usage.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    // Solde actuel
    const balance = await this.getTokenBalance(user.customerId);

    return {
      success: true,
      data: {
        currentBalance: balance,
        totalUsed: Number(totalUsed),
        last30DaysUsage: Number(last30DaysUsage?.total || 0),
        usageByService: usageByService.map(item => ({
          serviceType: item.serviceType,
          total: Number(item.total)
        })),
        summary: {
          period: '30 days',
          generatedAt: new Date().toISOString()
        }
      }
    };
  }
}
