import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FundingRequest, FundingRequestStatus, DurationUnit } from '../entities/funding-request.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { EventsService } from '../../events/events.service';
import { 
  FundingRequestCreatedEvent,
  FundingRequestAcknowledgedEvent,
  FundingRequestErrorEvent,
  StandardFundingStatus,
  mapStandardToPortfolio
} from '@wanzobe/shared';

@Injectable()
export class FundingRequestConsumerService {
  private readonly logger = new Logger(FundingRequestConsumerService.name);

  constructor(
    @InjectRepository(FundingRequest)
    private readonly fundingRequestRepository: Repository<FundingRequest>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Consomme les événements de création de demande de financement depuis gestion_commerciale
   */
  @EventPattern('funding.request.created')
  async handleFundingRequestCreated(
    @Payload() message: any,
    @Ctx() context: KafkaContext
  ) {
    const startTime = Date.now();
    
    try {
      // Extraire les données du message standardisé
      const data: FundingRequestCreatedEvent['data'] = message.data || message;
      
      this.logger.log(
        `Received funding.request.created from gestion_commerciale: ${data.financingRecordId}`
      );

      // 1. Trouver ou créer le portfolio du client
      let portfolio = await this.portfolioRepository.findOne({
        where: { manager_id: data.userId }
      });

      if (!portfolio) {
        this.logger.log(`Creating new portfolio for client ${data.userId}`);
        
        portfolio = this.portfolioRepository.create({
          reference: `PF-${Date.now()}`,
          name: `Portfolio ${data.businessInformation.name}`,
          manager_id: data.userId,
          institution_id: data.userId, // TODO: Récupérer l'institution_id réelle
          type: 'traditional' as any,
          status: 'active' as any,
          target_amount: 0,
          total_amount: 0,
          currency: data.currency,
        });
        
        await this.portfolioRepository.save(portfolio);
        this.logger.log(`Portfolio created: ${portfolio.id}`);
      }

      // ✅ 1.5 Propager les informations bancaires au Portfolio
      if (data.paymentInfo && (data.paymentInfo.bankAccounts?.length > 0 || data.paymentInfo.mobileMoneyAccounts?.length > 0)) {
        this.logger.log(`Updating portfolio ${portfolio.id} with payment information`);
        
        // Transformer les comptes bancaires (camelCase → snake_case)
        if (data.paymentInfo.bankAccounts?.length > 0) {
          portfolio.bank_accounts = data.paymentInfo.bankAccounts.map(acc => ({
            id: acc.id || `bank-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: acc.accountName,
            bank_name: acc.bankName,
            account_number: acc.accountNumber,
            currency: portfolio.currency,
            balance: 0,
            is_default: acc.isDefault,
            status: acc.status,
            bank_code: acc.bankCode,
            branch_code: acc.branchCode,
            swift_code: acc.swiftCode,
            rib: acc.rib,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        }

        // Transformer les comptes mobile money
        if (data.paymentInfo.mobileMoneyAccounts?.length > 0) {
          portfolio.mobile_money_accounts = data.paymentInfo.mobileMoneyAccounts.map(acc => ({
            id: acc.id || `mm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            account_name: acc.accountName,
            phone_number: acc.phoneNumber,
            provider: acc.operator, // Code déjà standardisé (AM, OM, MP, etc.)
            provider_name: acc.operatorName,
            currency: portfolio.currency,
            is_primary: acc.isDefault,
            is_active: acc.status === 'active',
            account_status: acc.verificationStatus === 'failed' ? 'suspended' : acc.verificationStatus,
            purpose: 'collection',
            balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        }

        await this.portfolioRepository.save(portfolio);
        this.logger.log(
          `Portfolio ${portfolio.id} updated with ${portfolio.bank_accounts?.length || 0} bank accounts ` +
          `and ${portfolio.mobile_money_accounts?.length || 0} mobile money accounts`
        );
      }

      // 2. Créer le FundingRequest
      const fundingRequest = this.fundingRequestRepository.create({
        request_number: this.generateRequestNumber(),
        portfolio_id: portfolio.id,
        client_id: data.userId,
        company_name: data.businessInformation.name,
        product_type: data.type,
        amount: data.amount,
        currency: data.currency,
        purpose: data.purpose,
        duration: data.term,
        duration_unit: DurationUnit.MONTHS,
        proposed_start_date: new Date(),
        status: FundingRequestStatus.PENDING,
        status_date: new Date(),
        source_request_id: data.financingRecordId, // ✅ LIEN CRITIQUE
        source_system: 'gestion_commerciale',
        financial_data: {
          annual_revenue: data.financialInformation.monthlyRevenue * 12,
          net_profit: data.financialInformation.monthlyRevenue * 12 - data.financialInformation.monthlyExpenses * 12,
          existing_debts: data.financialInformation.existingLoans?.reduce(
            (sum, loan) => sum + loan.outstandingBalance,
            0
          ) || 0,
          cash_flow: data.financialInformation.monthlyRevenue - data.financialInformation.monthlyExpenses,
          assets: data.businessInformation.annualRevenue,
          liabilities: data.financialInformation.existingLoans?.reduce(
            (sum, loan) => sum + loan.outstandingBalance,
            0
          ) || 0,
        },
        payment_info: data.paymentInfo, // ✅ INFORMATIONS BANCAIRES
        proposed_guarantees: data.documents?.map(doc => ({
          type: doc.type,
          description: doc.name,
          value: 0,
          currency: data.currency,
        })),
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedFundingRequest = await this.fundingRequestRepository.save(fundingRequest);

      // 3. Publier événement de confirmation
      const acknowledgedEvent: FundingRequestAcknowledgedEvent = {
        eventType: 'funding.request.acknowledged',
        data: {
          financingRecordId: data.financingRecordId,
          fundingRequestId: savedFundingRequest.id,
          portfolioId: portfolio.id,
          requestNumber: savedFundingRequest.request_number,
          status: savedFundingRequest.status,
          acknowledgedAt: new Date().toISOString(),
        },
        metadata: {
          source: 'portfolio_institution',
          correlationId: message.metadata?.correlationId || `pi-${Date.now()}`,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };

      await this.eventsService.publishFundingRequestAcknowledged(acknowledgedEvent);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Successfully created FundingRequest ${savedFundingRequest.id} for FinancingRecord ${data.financingRecordId} in ${processingTime}ms`
      );

      context.getMessage();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Failed to process funding.request.created: ${error.message} (failed after ${processingTime}ms)`,
        error.stack
      );

      // Publier événement d'erreur
      try {
        const data: FundingRequestCreatedEvent['data'] = message.data || message;
        
        const errorEvent: FundingRequestErrorEvent = {
          eventType: 'funding.request.error',
          data: {
            financingRecordId: data.financingRecordId,
            errorCode: 'CREATION_FAILED',
            errorMessage: error.message,
            errorDetails: {
              stack: error.stack,
              processingTime,
            },
            failedAt: new Date().toISOString(),
          },
          metadata: {
            source: 'portfolio_institution',
            correlationId: message.metadata?.correlationId || `pi-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        };

        await this.eventsService.publishFundingRequestError(errorEvent);
      } catch (publishError: any) {
        this.logger.error(`Failed to publish error event: ${publishError.message}`);
      }
    }
  }

  /**
   * Génère un numéro de demande unique
   */
  private generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FR-${year}-${timestamp}-${random}`;
  }
}
