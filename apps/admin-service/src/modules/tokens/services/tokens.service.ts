import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPackage, TokenBalance, TokenTransaction, TokenUsage, CustomerType, TokenTransactionType, AppType } from '../entities/token.entity';
import { 
    TokenBalanceDto, 
    TokenPackagesResponseDto, 
    PurchaseTokensDto, 
    PurchaseTokensResponseDto, 
    TokenUsageResponseDto, 
    GetTokenUsageQueryDto, 
    TokenHistoryResponseDto, 
    GetTokenHistoryQueryDto, 
    TokenStatisticsDto, 
    AllocateTokensDto, 
    AllocateTokensResponseDto, 
    TokenTransactionDto
} from '../dtos/token.dto';
import { EventsService } from '../../events/events.service';
import { TokenEventTopics, TokenPurchaseEvent, TokenAllocatedEvent } from '@wanzo/shared/events/kafka-config';

@Injectable()
export class TokensService {
    constructor(
        @InjectRepository(TokenPackage) private readonly tokenPackageRepository: Repository<TokenPackage>,
        @InjectRepository(TokenBalance) private readonly tokenBalanceRepository: Repository<TokenBalance>,
        @InjectRepository(TokenTransaction) private readonly tokenTransactionRepository: Repository<TokenTransaction>,
        @InjectRepository(TokenUsage) private readonly tokenUsageRepository: Repository<TokenUsage>,
        private readonly eventsService: EventsService,
    ) {}

    async getTokenBalance(customerId: string): Promise<TokenBalanceDto> {
        // This is a simplified mock. A real implementation would aggregate different token types (purchased, bonus, etc.)
        const transactions = await this.tokenTransactionRepository.find({ where: { customerId } });
        const allocated = transactions.filter(t => t.type === 'purchase' || t.type === 'bonus' || t.type === 'adjustment').reduce((sum, t) => sum + t.amount, 0);
        const used = transactions.filter(t => t.type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const available = allocated - used;

        return {
            available,
            allocated,
            used,
            lastUpdated: new Date().toISOString(),
        };
    }

    async getAvailableTokenPackages(): Promise<TokenPackagesResponseDto> {
        const packages = await this.tokenPackageRepository.find();
        return { packages };
    }

    async purchaseTokens(customerId: string, purchaseTokensDto: PurchaseTokensDto, proofDocument?: Express.Multer.File): Promise<PurchaseTokensResponseDto> {
        const tokenPackage = await this.tokenPackageRepository.findOne({ where: { id: purchaseTokensDto.packageId } });
        if (!tokenPackage) {
            throw new NotFoundException('Package not found');
        }

        // let proofDocumentUrl = null;
        // if (proofDocument) {
        //     const uploadResult = await this.cloudinaryService.uploadFile(proofDocument);
        //     proofDocumentUrl = uploadResult.secure_url;
        // }

        // Mock transaction creation
        const transaction = {
            id: `trans_${Math.random().toString(36).substr(2, 9)}`,
            customerId,
            packageId: tokenPackage.id,
            type: TokenTransactionType.PURCHASE,
            amount: tokenPackage.tokenAmount, // Simplified, could include bonus tokens
            balance: 0, // This would be calculated based on previous balance
            description: `Purchase of ${tokenPackage.name}`,
            timestamp: new Date().toISOString(),
            expiryDate: new Date(Date.now() + tokenPackage.validityDays * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { paymentId: `pay_${Math.random().toString(36).substr(2, 9)}` },
        };

        const newBalance = await this.getTokenBalance(customerId);
        newBalance.allocated += transaction.amount;
        newBalance.available += transaction.amount;

        // In a real app, you would save the transaction and update the balance here
        // await this.tokenTransactionRepository.save(transaction);

        const eventPayload: TokenPurchaseEvent = {
            purchaseId: transaction.id,
            customerId,
            packageId: tokenPackage.id,
            tokensPurchased: transaction.amount,
            amountPaid: tokenPackage.priceUSD, 
            currency: tokenPackage.localCurrency, 
            timestamp: new Date().toISOString(),
        };
        this.eventsService.publishTokenPurchase(eventPayload);

        return { transaction, newBalance };
    }

    async getTokenUsageHistory(customerId: string, query: GetTokenUsageQueryDto): Promise<TokenUsageResponseDto> {
        const { page = 1, limit = 20, appType, feature, startDate, endDate } = query;
        
        const queryBuilder = this.tokenUsageRepository.createQueryBuilder('usage')
            .where('usage.customerId = :customerId', { customerId });

        if (appType) {
            queryBuilder.andWhere('usage.appType = :appType', { appType });
        }
        if (feature) {
            queryBuilder.andWhere('usage.feature = :feature', { feature });
        }
        if (startDate) {
            queryBuilder.andWhere('usage.date >= :startDate', { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere('usage.date <= :endDate', { endDate });
        }

        const [usages, totalCount] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const totalTokensUsed = usages.reduce((sum, u) => sum + u.tokensUsed, 0);
        
        const dtos = usages.map(u => ({
            id: u.id,
            customerId: u.customerId,
            userId: u.userId,
            appType: u.appType,
            tokensUsed: u.tokensUsed,
            date: u.date.toISOString(),
            feature: u.feature,
            prompt: u.prompt,
            responseTokens: u.responseTokens,
            requestTokens: u.requestTokens,
            cost: u.cost,
        }));

        return { usages: dtos, totalCount, totalTokensUsed };
    }

    async getTokenTransactionHistory(customerId: string, query: GetTokenHistoryQueryDto): Promise<TokenHistoryResponseDto> {
        const { page = 1, limit = 20, status, startDate, endDate } = query;
        
        const queryBuilder = this.tokenTransactionRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.customer', 'customer')
            .where('transaction.customerId = :customerId', { customerId });

        if (status) {
            queryBuilder.andWhere('transaction.type = :type', { type: status });
        }
        if (startDate) {
            queryBuilder.andWhere('transaction.timestamp >= :startDate', { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere('transaction.timestamp <= :endDate', { endDate });
        }

        const [transactions, totalCount] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('transaction.timestamp', 'DESC')
            .getManyAndCount();

        const dtos = transactions.map(t => ({
            id: t.id,
            customerId: t.customerId,
            customerName: t.customer?.name,
            subscriptionId: t.subscriptionId,
            packageId: t.packageId,
            type: t.type,
            amount: t.amount,
            balance: t.balance,
            description: t.description,
            timestamp: t.timestamp.toISOString(),
            expiryDate: t.expiryDate?.toISOString(),
            metadata: t.metadata,
        }));

        return { transactions: dtos, totalCount };
    }

    async getTokenUsageStats(customerId: string, period: string): Promise<any> {
        // Mock implementation
        return {
            '2024-05': 12500,
            '2024-04': 10750,
        };
    }

    async getTokenUsageByFeature(customerId: string): Promise<any> {
        // Mock implementation
        return {
            'text-generation': 18500,
            'image-generation': 12000,
        };
    }

    async getTokenUsageByApp(customerId: string): Promise<any> {
        // Mock implementation
        return {
            'web-dashboard': 15200,
            'mobile-app': 12800,
        };
    }

    async getAllTokenStatistics(period: string): Promise<TokenStatisticsDto> {
        // Mock implementation
        return {
            totalTokensAllocated: 5000000,
            totalTokensUsed: 1727300,
            totalTokensPurchased: 2500000,
            tokenUsageByPeriod: [{ period: '2024-05', tokensUsed: 527000 }],
            tokenUsageByCustomerType: { pme: 650000, financial: 1077300 },
            averageTokensPerCustomer: 86365,
            top10TokenConsumers: [{ customerId: 'cust-2', customerName: 'Crédit Maritime', tokensConsumed: 829650 }],
            tokenUsageTrend: [{ date: '2024-05-28', used: 58750, cost: 1.76, revenue: 4.70 }],
        };
    }

    async allocateTokens(adminId: string, allocateTokensDto: AllocateTokensDto): Promise<AllocateTokensResponseDto> {
        // This is a mock implementation
        const transaction: TokenTransaction = {
            id: `trans_${Math.random().toString(36).substr(2, 9)}`,
            customerId: allocateTokensDto.customerId,
            packageId: null as string,
            type: TokenTransactionType.ALLOCATION,
            amount: allocateTokensDto.amount,
            balance: 0, // This would be calculated
            description: `Allocation: ${allocateTokensDto.reason}`,
            timestamp: new Date(),
            expiryDate: null as Date,
            metadata: { allocatedBy: adminId },
            customer: null as any, // Mocked for type compliance
            package: null as any, // Mocked for type compliance
        };

        const newBalance = await this.getTokenBalance(allocateTokensDto.customerId);
        newBalance.allocated += transaction.amount;
        newBalance.available += transaction.amount;

        // In a real app, you would save the transaction and update the balance here
        // await this.tokenTransactionRepository.save(transaction);

        const eventPayload: TokenAllocatedEvent = {
            allocationId: transaction.id,
            customerId: allocateTokensDto.customerId,
            tokensAllocated: allocateTokensDto.amount,
            allocatedBy: adminId, 
            reason: allocateTokensDto.reason,
            timestamp: new Date().toISOString(),
        };
        this.eventsService.publishTokenAllocated(eventPayload);

        return { 
            transaction: this.mapTransactionToDto(transaction),
            newBalance 
        };
    }

    private mapTransactionToDto(transaction: TokenTransaction): TokenTransactionDto {
        return {
            id: transaction.id,
            customerId: transaction.customerId,
            packageId: transaction.packageId,
            type: transaction.type,
            amount: transaction.amount,
            balance: transaction.balance,
            description: transaction.description,
            timestamp: transaction.timestamp.toISOString(),
            expiryDate: transaction.expiryDate?.toISOString(),
            metadata: transaction.metadata,
        };
    }

    /**
     * Enregistre la consommation de tokens à partir d'un événement Kafka (token.usage)
     */
    async recordTokenUsageFromEvent(event: any): Promise<void> {
        // 1. Créer un enregistrement TokenUsage
        const usage = this.tokenUsageRepository.create({
            customerId: event.company_id || event.institution_id, // PME ou Institution
            userId: event.user_id,
            tokensUsed: event.tokens_used,
            conversationId: event.conversation_id,
            mode: event.mode,
            timestamp: event.timestamp,
            feature: event.mode,
        });
        await this.tokenUsageRepository.save(usage);
        // 2. Mettre à jour le compteur PME/institution selon la logique d'abonnement
        // (À adapter selon la structure de vos entités et abonnements)
        // TODO: Ajouter la logique de quota/abonnement ici si besoin
    }
}
