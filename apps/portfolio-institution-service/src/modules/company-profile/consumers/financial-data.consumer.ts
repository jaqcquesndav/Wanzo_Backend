import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyProfile } from '../entities/company-profile.entity';
import { StandardKafkaTopics } from '@wanzobe/shared/events/standard-kafka-topics';

interface TreasuryAccount {
  accountCode: string;
  accountName: string;
  balance: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
}

interface TreasuryPeriodData {
  periodId: string;
  startDate: string;
  endDate: string;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  treasuryAccounts: TreasuryAccount[];
  totalTreasuryBalance: number;
}

interface CompanyFinancialDataSharedEvent {
  companyId: string;
  companyName: string;
  consentGrantedTo: string[];
  accountingStandard?: string; // SYSCOHADA ou IFRS
  financialData: {
    totalRevenue: number;
    netProfit: number;
    totalAssets: number;
    totalLiabilities: number;
    cashFlow: number;
    creditScore: number;
    financialRating: string;
  };
  treasuryAccounts?: TreasuryAccount[];
  treasuryTimeseries?: {
    weekly: TreasuryPeriodData[];
    monthly: TreasuryPeriodData[];
    quarterly: TreasuryPeriodData[];
    annual: TreasuryPeriodData[];
  };
  timestamp: string;
}

/**
 * Consumer Kafka pour les données financières partagées depuis accounting-service
 * 
 * ÉVÉNEMENTS ÉCOUTÉS:
 * - company.financial.data.shared: Données financières complètes incluant trésorerie
 * 
 * DÉCLENCHEUR:
 * Publié automatiquement par accounting-service quand:
 * 1. Une company active le partage de données (consentGiven = true)
 * 2. Au moins un destinataire autorisé (banks, microfinance, coopec, analysts, partners)
 * 
 * DONNÉES REÇUES:
 * - Métriques financières agrégées (revenue, profit, assets, liabilities)
 * - Score de crédit calculé
 * - Détail des comptes de trésorerie (52x) avec soldes
 * - Informations bancaires si disponibles
 */
@Injectable()
export class FinancialDataConsumer {
  private readonly logger = new Logger(FinancialDataConsumer.name);

  constructor(
    @InjectRepository(CompanyProfile)
    private companyProfileRepository: Repository<CompanyProfile>,
  ) {}

  /**
   * Consomme les événements de partage de données financières
   * Topic: company.financial.data.shared
   */
  @EventPattern(StandardKafkaTopics.COMPANY_FINANCIAL_DATA_SHARED)
  async handleFinancialDataShared(@Payload() event: any): Promise<void> {
    const startTime = Date.now();

    try {
      const data: CompanyFinancialDataSharedEvent = event.data || event;

      this.logger.log(
        `[FINANCIAL-SYNC] Received financial data shared event for company ${data.companyId} ` +
        `(${data.treasuryAccounts?.length || 0} treasury accounts)`
      );

      // Vérifier que portfolio-institution fait partie des destinataires autorisés
      const allowedRecipients = ['partners', 'analysts', 'banks', 'microfinance', 'coopec'];
      const isAuthorized = data.consentGrantedTo.some(recipient => 
        allowedRecipients.includes(recipient)
      );

      if (!isAuthorized) {
        this.logger.warn(
          `[FINANCIAL-SYNC] Company ${data.companyId} has not authorized portfolio-institution ` +
          `(granted to: ${data.consentGrantedTo.join(', ')})`
        );
        return;
      }

      // Trouver ou créer le profil
      let profile = await this.companyProfileRepository.findOne({ 
        where: { id: data.companyId } 
      });

      if (!profile) {
        this.logger.log(`[FINANCIAL-SYNC] Creating new profile for company ${data.companyId}`);
        
        profile = this.companyProfileRepository.create({
          id: data.companyId,
          companyName: data.companyName,
          sector: 'Unknown',
          isAccountingDataFresh: true,
          isCustomerDataFresh: false,
          createdBy: 'financial-data-event',
          metadata: {
            syncHistory: [],
            conflicts: [],
            sharedDataConsent: {
              granted: true,
              grantedTo: data.consentGrantedTo,
              grantedAt: data.timestamp
            }
          }
        });
      }

      // Mettre à jour les métriques financières
      profile.totalRevenue = data.financialData.totalRevenue;
      profile.annualRevenue = data.financialData.totalRevenue;
      profile.netProfit = data.financialData.netProfit;
      profile.totalAssets = data.financialData.totalAssets;
      profile.totalLiabilities = data.financialData.totalLiabilities;
      profile.cashFlow = data.financialData.cashFlow;
      profile.creditScore = data.financialData.creditScore;
      profile.financialRating = data.financialData.financialRating;

      // Calculer des ratios supplémentaires
      profile.debtRatio = data.financialData.totalLiabilities / (data.financialData.totalAssets || 1);
      profile.workingCapital = data.financialData.cashFlow;
      profile.profitMargin = (data.financialData.netProfit / (data.financialData.totalRevenue || 1)) * 100;

      // Classer la taille de l'entreprise
      profile.companySize = this.classifyCompanySize(
        data.financialData.totalRevenue,
        data.financialData.totalAssets
      );

      // Stocker les détails de trésorerie dans metadata
      if (data.treasuryAccounts && data.treasuryAccounts.length > 0) {
        profile.metadata = {
          ...profile.metadata,
          accountingStandard: data.accountingStandard || 'SYSCOHADA',
          treasuryAccounts: data.treasuryAccounts.map(acc => ({
            code: acc.accountCode,
            name: acc.accountName,
            balance: acc.balance,
            currency: acc.currency,
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            lastUpdate: data.timestamp
          })),
          totalTreasuryBalance: data.treasuryAccounts.reduce((sum, acc) => sum + acc.balance, 0),
          // Stocker les données temporelles multi-échelles (hebdo, mensuel, trimestriel, annuel)
          treasuryTimeseries: data.treasuryTimeseries ? {
            weekly: data.treasuryTimeseries.weekly.map(p => ({
              periodId: p.periodId,
              startDate: p.startDate,
              endDate: p.endDate,
              totalBalance: p.totalTreasuryBalance,
              accountsCount: p.treasuryAccounts.length
            })),
            monthly: data.treasuryTimeseries.monthly.map(p => ({
              periodId: p.periodId,
              startDate: p.startDate,
              endDate: p.endDate,
              totalBalance: p.totalTreasuryBalance,
              accountsCount: p.treasuryAccounts.length
            })),
            quarterly: data.treasuryTimeseries.quarterly.map(p => ({
              periodId: p.periodId,
              startDate: p.startDate,
              endDate: p.endDate,
              totalBalance: p.totalTreasuryBalance,
              accountsCount: p.treasuryAccounts.length
            })),
            annual: data.treasuryTimeseries.annual.map(p => ({
              periodId: p.periodId,
              startDate: p.startDate,
              endDate: p.endDate,
              totalBalance: p.totalTreasuryBalance,
              accountsCount: p.treasuryAccounts.length
            }))
          } : undefined,
          sharedDataConsent: {
            granted: true,
            grantedTo: data.consentGrantedTo,
            grantedAt: data.timestamp
          }
        };

        const timeseriesInfo = data.treasuryTimeseries 
          ? `with timeseries (${data.treasuryTimeseries.weekly.length}W/${data.treasuryTimeseries.monthly.length}M/${data.treasuryTimeseries.quarterly.length}Q/${data.treasuryTimeseries.annual.length}Y)` 
          : 'without timeseries';

        this.logger.log(
          `[FINANCIAL-SYNC] Stored ${data.treasuryAccounts.length} treasury accounts ${timeseriesInfo} ` +
          `with total balance: ${profile.metadata.totalTreasuryBalance} ${data.treasuryAccounts[0]?.currency || 'CDF'} ` +
          `[Standard: ${data.accountingStandard || 'SYSCOHADA'}]`
        );
      }

      // Marquer les données comme fraîches
      profile.lastSyncFromAccounting = new Date();
      profile.isAccountingDataFresh = true;
      profile.lastModifiedBy = 'financial-data-shared-event';

      // Enregistrer la synchronisation
      profile.recordSync('accounting', 'success', 
        `Received shared financial data with ${data.treasuryAccounts?.length || 0} treasury accounts`
      );

      // Recalculer la complétude
      profile.profileCompleteness = profile.calculateCompleteness();

      // Sauvegarder
      await this.companyProfileRepository.save(profile);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `[FINANCIAL-SYNC] Successfully processed financial data for company ${data.companyId} ` +
        `(completeness: ${profile.profileCompleteness}%) in ${processingTime}ms`
      );

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `[FINANCIAL-SYNC] Failed to process financial data shared event: ${error.message} ` +
        `(failed after ${processingTime}ms)`,
        error.stack
      );
      // Ne pas throw - éviter de bloquer la queue Kafka
    }
  }

  /**
   * Classifie la taille de l'entreprise selon le CA et les actifs
   */
  private classifyCompanySize(revenue: number, assets: number): string {
    if (revenue < 500000000) return 'small';
    if (revenue < 2000000000) return 'medium';
    return 'large';
  }
}
