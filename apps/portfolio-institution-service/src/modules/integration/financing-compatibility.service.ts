import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditRequest, CreditRequestStatus } from '../portfolios/entities/credit-request.entity';
import { 
  SyncFinancingRequestDto, 
  StatusMappingGCToPI, 
  StatusMappingPIToGC,
  CreditRequestToFinancingDto 
} from './dtos/financing-compatibility.dto';
import { EventsService } from '../events/events.service';

/**
 * Service de synchronisation et compatibilité entre
 * gestion_commerciale_service et portfolio-institution-service
 * 
 * Assure la cohérence des données au niveau granulaire
 */
@Injectable()
export class FinancingCompatibilityService {
  private readonly logger = new Logger(FinancingCompatibilityService.name);

  constructor(
    @InjectRepository(CreditRequest)
    private creditRequestRepository: Repository<CreditRequest>,
    private eventsService: EventsService,
  ) {}

  /**
   * Mapper un statut de gestion_commerciale vers portfolio-institution
   */
  mapStatusGCToPI(gcStatus: string): CreditRequestStatus {
    const mapped = StatusMappingGCToPI[gcStatus];
    if (!mapped) {
      this.logger.warn(`Unknown status from GC: ${gcStatus}, defaulting to PENDING`);
      return CreditRequestStatus.PENDING;
    }
    return mapped as CreditRequestStatus;
  }

  /**
   * Mapper un statut de portfolio-institution vers gestion_commerciale
   */
  mapStatusPIToGC(piStatus: CreditRequestStatus): string {
    const mapped = StatusMappingPIToGC[piStatus];
    if (!mapped) {
      this.logger.warn(`Unknown status from PI: ${piStatus}, defaulting to underReview`);
      return 'underReview';
    }
    return mapped;
  }

  /**
   * Synchroniser une demande de financement de GC vers PI
   * Crée ou met à jour une CreditRequest dans portfolio-institution
   */
  async syncFromGestionCommerciale(data: SyncFinancingRequestDto): Promise<CreditRequest> {
    this.logger.log(`Syncing financing request from GC: ${data.sourceRequestId}`);

    try {
      // Vérifier si la demande existe déjà (basée sur sourceRequestId dans metadata)
      let creditRequest = await this.creditRequestRepository
        .createQueryBuilder('cr')
        .where("cr.metadata->>'sourceRequestId' = :sourceId", { sourceId: data.sourceRequestId })
        .getOne();

      const mappedStatus = this.mapStatusGCToPI(data.status);

      if (creditRequest) {
        // Mise à jour
        creditRequest.requestAmount = data.amount;
        creditRequest.currency = data.currency || 'XOF';
        creditRequest.status = mappedStatus;
        creditRequest.financingPurpose = data.purpose;
        creditRequest.schedulesCount = data.term;
        creditRequest.portfolioId = data.portfolioId || creditRequest.portfolioId;

        // Mettre à jour les informations de score crédit si disponibles
        if (data.creditScore) {
          creditRequest.metadata = {
            ...creditRequest.metadata,
            creditScore: data.creditScore.creditScore,
            creditScoreCalculatedAt: data.creditScore.calculatedAt,
            creditScoreValidUntil: data.creditScore.validUntil,
            riskLevel: data.creditScore.riskLevel,
            confidenceScore: data.creditScore.confidenceScore,
            sourceRequestId: data.sourceRequestId,
            syncedFrom: 'gestion_commerciale',
            lastSyncAt: new Date().toISOString(),
          };
        }

        this.logger.log(`Updating existing credit request: ${creditRequest.id}`);
      } else {
        // Création - utiliser Object.assign pour éviter les erreurs de type
        const newRequest = new CreditRequest();
        Object.assign(newRequest, {
          memberId: data.userId, // Utiliser userId comme memberId
          productId: data.productId || '', // Devrait être fourni ou résolu
          receptionDate: data.applicationDate || new Date(),
          requestAmount: data.amount,
          currency: data.currency || 'XOF',
          periodicity: 'MONTHLY', // Par défaut
          interestRate: 0, // Devrait être calculé ou fourni
          reason: data.purpose,
          scheduleType: 'CONSTANT', // Par défaut
          schedulesCount: data.term,
          deferredPaymentsCount: 0,
          financingPurpose: data.purpose,
          creditManagerId: '', // À assigner
          isGroup: false,
          status: mappedStatus,
          portfolioId: data.portfolioId,
          metadata: {
            sourceRequestId: data.sourceRequestId,
            syncedFrom: 'gestion_commerciale',
            businessInformation: data.businessInformation,
            financialInformation: data.financialInformation,
            creditScore: data.creditScore,
            firstSyncAt: new Date().toISOString(),
            lastSyncAt: new Date().toISOString(),
          },
        });
        
        creditRequest = newRequest;

        this.logger.log(`Creating new credit request from GC: ${data.sourceRequestId}`);
      }

      const saved = await this.creditRequestRepository.save(creditRequest);

      // Publier événement de synchronisation
      await this.eventsService.publishFundingRequestStatusChanged({
        id: saved.id,
        requestNumber: `CR-${saved.id.substring(0, 8).toUpperCase()}`,
        portfolioId: saved.portfolioId || '',
        clientId: saved.memberId,
        oldStatus: creditRequest.status || CreditRequestStatus.DRAFT,
        newStatus: saved.status,
        changeDate: new Date(),
        changedBy: 'system-sync',
        amount: saved.requestAmount,
        currency: saved.currency,
      });

      return saved;
    } catch (error: any) {
      this.logger.error(`Failed to sync financing request from GC: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  /**
   * Convertir une CreditRequest en format pour gestion_commerciale
   */
  async convertToFinancingFormat(creditRequestId: string): Promise<CreditRequestToFinancingDto> {
    const creditRequest = await this.creditRequestRepository.findOne({
      where: { id: creditRequestId },
      relations: ['portfolio'],
    });

    if (!creditRequest) {
      throw new Error(`Credit request ${creditRequestId} not found`);
    }

    return {
      creditRequestId: creditRequest.id,
      memberId: creditRequest.memberId,
      productId: creditRequest.productId,
      requestAmount: Number(creditRequest.requestAmount),
      interestRate: Number(creditRequest.interestRate),
      financingPurpose: creditRequest.financingPurpose,
      schedulesCount: creditRequest.schedulesCount,
      periodicity: creditRequest.periodicity,
      status: this.mapStatusPIToGC(creditRequest.status),
      portfolioId: creditRequest.portfolioId,
      currency: creditRequest.currency,
    };
  }

  /**
   * Vérifier la compatibilité des données entre les deux services
   */
  async validateDataCompatibility(gcData: SyncFinancingRequestDto): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation montant
    if (gcData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Validation durée
    if (gcData.term < 1 || gcData.term > 360) {
      errors.push('Term must be between 1 and 360 months');
    }

    // Validation devise
    if (!['XOF', 'CDF', 'USD', 'EUR'].includes(gcData.currency)) {
      warnings.push(`Unusual currency: ${gcData.currency}`);
    }

    // Validation business information
    if (!gcData.businessInformation) {
      errors.push('Business information is required');
    } else {
      if (gcData.businessInformation.yearsInBusiness < 0) {
        errors.push('Years in business cannot be negative');
      }
      if (gcData.businessInformation.numberOfEmployees < 0) {
        errors.push('Number of employees cannot be negative');
      }
    }

    // Validation financial information
    if (!gcData.financialInformation) {
      errors.push('Financial information is required');
    } else {
      if (gcData.financialInformation.monthlyRevenue < 0) {
        errors.push('Monthly revenue cannot be negative');
      }
      if (gcData.financialInformation.monthlyExpenses < 0) {
        errors.push('Monthly expenses cannot be negative');
      }

      // Vérifier le ratio revenus/dépenses
      const ratio = gcData.financialInformation.monthlyRevenue / gcData.financialInformation.monthlyExpenses;
      if (ratio < 1) {
        warnings.push('Monthly expenses exceed monthly revenue');
      }
    }

    // Validation credit score si présent
    if (gcData.creditScore) {
      if (gcData.creditScore.creditScore < 1 || gcData.creditScore.creditScore > 100) {
        errors.push('Credit score must be between 1 and 100');
      }
      
      if (gcData.creditScore.validUntil && gcData.creditScore.validUntil < new Date()) {
        warnings.push('Credit score has expired');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Obtenir les statistiques de synchronisation
   */
  async getSyncStats(): Promise<{
    totalSynced: number;
    byStatus: Record<string, number>;
    lastSyncDate: Date | null;
  }> {
    const syncedRequests = await this.creditRequestRepository
      .createQueryBuilder('cr')
      .where("cr.metadata->>'syncedFrom' = :source", { source: 'gestion_commerciale' })
      .getMany();

    const byStatus: Record<string, number> = {};
    let lastSyncDate: Date | null = null;

    for (const request of syncedRequests) {
      const status = request.status;
      byStatus[status] = (byStatus[status] || 0) + 1;

      if (request.metadata?.lastSyncAt) {
        const syncDate = new Date(request.metadata.lastSyncAt);
        if (!lastSyncDate || syncDate > lastSyncDate) {
          lastSyncDate = syncDate;
        }
      }
    }

    return {
      totalSynced: syncedRequests.length,
      byStatus,
      lastSyncDate,
    };
  }
}
