import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { TokenUsage, TokenServiceType } from '../entities/token-usage.entity';
import { TokenPurchase } from '../entities/token-purchase.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { PurchaseTokenDto } from '../dto/purchase-token.dto';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';

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
  async getTokenBalanceByAuth0Id(auth0Id: string): Promise<{ balance: number, totalPurchased: number }> {
    // Trouver l'utilisateur par son Auth0 ID
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const totalPurchased = await this.getTotalPurchasedTokens(user.customerId);
    const totalUsage = await this.getTotalTokenUsage(user.customerId);
    const balance = totalPurchased - totalUsage;

    return {
      balance,
      totalPurchased
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
}
