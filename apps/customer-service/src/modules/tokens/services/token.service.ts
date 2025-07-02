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
}
