import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountingCalculatorService } from '../calculators/accounting-calculator.service';
import { Account, AccountType } from '../../accounts/entities/account.entity';
import { Journal, JournalStatus } from '../../journals/entities/journal.entity';
import { JournalLine } from '../../journals/entities/journal-line.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';
import { DashboardFilterDto } from '../dtos/dashboard.dto';

export interface AccountingMetrics {
  // Métriques financières de base
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  
  // Métriques de trésorerie
  cashOnHand: number;
  bankBalance: number;
  
  // Ratios financiers
  currentRatio: number;
  debtEquityRatio: number;
  workingCapital: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  
  // Métriques opérationnelles
  totalTransactions: number;
  activeAccounts: number;
  pendingJournals: number;
  
  // Métriques de performance
  revenueGrowth: number;
  expenseGrowth: number;
  profitabilityTrend: number;
  
  // Métriques SYSCOHADA
  balanceSheetAccuracy: number;
  complianceScore: number;
  
  // Timestamps
  calculatedAt: Date;
  period: string;
}

@Injectable()
export class AccountingOrchestrationService {
  private readonly logger = new Logger(AccountingOrchestrationService.name);
  private metricsCache = new Map<string, AccountingMetrics>();
  private readonly cacheExpiration = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    @InjectRepository(FiscalYear)
    private fiscalYearRepository: Repository<FiscalYear>,
    private calculatorService: AccountingCalculatorService,
  ) {}

  /**
   * Obtenir les métriques comptables pour une entreprise
   */
  async getAccountingMetrics(companyId: string, filters: DashboardFilterDto): Promise<AccountingMetrics> {
    const cacheKey = this.generateCacheKey(companyId, filters);
    
    // Vérifier le cache d'abord
    const cached = this.getCachedMetrics(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached metrics for company ${companyId}`);
      return cached;
    }

    this.logger.debug(`Calculating fresh metrics for company ${companyId}`);
    
    try {
      // Calculer les métriques en temps réel
      const metrics = await this.calculateAccountingMetrics(companyId, filters);
      
      // Mettre en cache
      this.cacheMetrics(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      this.logger.error(`Error calculating accounting metrics for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Calculer toutes les métriques comptables
   */
  private async calculateAccountingMetrics(companyId: string, filters: DashboardFilterDto): Promise<AccountingMetrics> {
    const fiscalYear = await this.getFiscalYear(filters.fiscalYearId, companyId);
    const dateRange = this.getDateRange(filters, fiscalYear);

    // Calculer les métriques en parallèle
    const [
      balanceSheetMetrics,
      incomeStatementMetrics,
      cashFlowMetrics,
      ratioMetrics,
      operationalMetrics,
      performanceMetrics,
      complianceMetrics,
    ] = await Promise.all([
      this.calculatorService.calculateBalanceSheetMetrics(companyId, dateRange),
      this.calculatorService.calculateIncomeStatementMetrics(companyId, dateRange),
      this.calculatorService.calculateCashFlowMetrics(companyId, dateRange),
      this.calculatorService.calculateFinancialRatios(companyId, dateRange),
      this.calculatorService.calculateOperationalMetrics(companyId, dateRange),
      this.calculatorService.calculatePerformanceMetrics(companyId, dateRange, filters),
      this.calculatorService.calculateSYSCOHADACompliance(companyId, dateRange),
    ]);

    return {
      // Métriques du bilan
      totalAssets: balanceSheetMetrics.totalAssets,
      totalLiabilities: balanceSheetMetrics.totalLiabilities,
      totalEquity: balanceSheetMetrics.totalEquity,
      
      // Métriques du compte de résultat
      totalRevenue: incomeStatementMetrics.totalRevenue,
      totalExpenses: incomeStatementMetrics.totalExpenses,
      netIncome: incomeStatementMetrics.netIncome,
      
      // Métriques de trésorerie
      cashOnHand: cashFlowMetrics.cashOnHand,
      bankBalance: cashFlowMetrics.bankBalance,
      
      // Ratios financiers
      currentRatio: ratioMetrics.currentRatio,
      debtEquityRatio: ratioMetrics.debtEquityRatio,
      workingCapital: ratioMetrics.workingCapital,
      grossProfitMargin: ratioMetrics.grossProfitMargin,
      netProfitMargin: ratioMetrics.netProfitMargin,
      
      // Métriques opérationnelles
      totalTransactions: operationalMetrics.totalTransactions,
      activeAccounts: operationalMetrics.activeAccounts,
      pendingJournals: operationalMetrics.pendingJournals,
      
      // Métriques de performance
      revenueGrowth: performanceMetrics.revenueGrowth,
      expenseGrowth: performanceMetrics.expenseGrowth,
      profitabilityTrend: performanceMetrics.profitabilityTrend,
      
      // Métriques SYSCOHADA
      balanceSheetAccuracy: complianceMetrics.balanceSheetAccuracy,
      complianceScore: complianceMetrics.complianceScore,
      
      // Metadata
      calculatedAt: new Date(),
      period: this.formatPeriod(dateRange),
    };
  }

  /**
   * Job planifié pour recalculer les métriques
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledMetricsRecalculation() {
    this.logger.debug('Starting scheduled accounting metrics recalculation');
    
    try {
      // Obtenir toutes les entreprises actives
      const activeCompanies = await this.getActiveCompanies();
      
      for (const companyId of activeCompanies) {
        try {
          // Recalculer pour l'exercice fiscal courant
          const currentFiscalYear = await this.getCurrentFiscalYear(companyId);
          const filters = new DashboardFilterDto();
          filters.fiscalYearId = currentFiscalYear?.id;
          filters.companyId = companyId;
          
          // Invalider le cache et recalculer
          const cacheKey = this.generateCacheKey(companyId, filters);
          this.metricsCache.delete(cacheKey);
          
          await this.getAccountingMetrics(companyId, filters);
          
          this.logger.debug(`Metrics recalculated for company ${companyId}`);
        } catch (error) {
          this.logger.error(`Failed to recalculate metrics for company ${companyId}:`, error);
        }
      }
      
      this.logger.debug('Scheduled accounting metrics recalculation completed');
    } catch (error) {
      this.logger.error('Error in scheduled metrics recalculation:', error);
    }
  }

  /**
   * Nettoyer le cache des métriques expirées
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, metrics] of this.metricsCache.entries()) {
      if (now - metrics.calculatedAt.getTime() > this.cacheExpiration) {
        this.metricsCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Utilitaires privés
   */
  private generateCacheKey(companyId: string, filters: DashboardFilterDto): string {
    return `accounting_metrics_${companyId}_${filters.fiscalYearId || 'current'}_${filters.startDate || ''}_${filters.endDate || ''}`;
  }

  private getCachedMetrics(cacheKey: string): AccountingMetrics | null {
    const cached = this.metricsCache.get(cacheKey);
    if (!cached) return null;

    const age = Date.now() - cached.calculatedAt.getTime();
    if (age > this.cacheExpiration) {
      this.metricsCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  private cacheMetrics(cacheKey: string, metrics: AccountingMetrics): void {
    this.metricsCache.set(cacheKey, metrics);
  }

  private async getFiscalYear(fiscalYearId?: string, companyId?: string): Promise<FiscalYear | null> {
    if (fiscalYearId) {
      return await this.fiscalYearRepository.findOne({ 
        where: { id: fiscalYearId, companyId } 
      });
    }
    
    // Obtenir l'exercice fiscal courant
    return await this.getCurrentFiscalYear(companyId);
  }

  private async getCurrentFiscalYear(companyId?: string): Promise<FiscalYear | null> {
    const now = new Date();
    const fiscalYear = await this.fiscalYearRepository
      .createQueryBuilder('fiscalYear')
      .where('fiscalYear.companyId = :companyId', { companyId })
      .andWhere('fiscalYear.startDate <= :now', { now })
      .andWhere('fiscalYear.endDate >= :now', { now })
      .getOne();
    return fiscalYear;
  }

  private getDateRange(filters: DashboardFilterDto, fiscalYear?: FiscalYear | null): { startDate: Date; endDate: Date } {
    if (filters.startDate && filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }

    if (fiscalYear) {
      return { startDate: fiscalYear.startDate, endDate: fiscalYear.endDate };
    }

    // Par défaut, utiliser l'année courante
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { startDate: startOfYear, endDate: endOfYear };
  }

  private formatPeriod(dateRange: { startDate: Date; endDate: Date }): string {
    const start = dateRange.startDate.toISOString().split('T')[0];
    const end = dateRange.endDate.toISOString().split('T')[0];
    return `${start}_to_${end}`;
  }

  private async getActiveCompanies(): Promise<string[]> {
    // Obtenir toutes les entreprises ayant des transactions récentes
    const recentJournals = await this.journalRepository
      .createQueryBuilder('journal')
      .select('DISTINCT journal.companyId')
      .where('journal.createdAt >= :date', { 
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours 
      })
      .getRawMany();

    return recentJournals.map(row => row.journal_companyId).filter(Boolean);
  }

  /**
   * Méthodes utilitaires pour l'agrégation de données
   */
  async aggregateAccountBalances(
    accountType: AccountType,
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<number> {
    return await this.calculatorService.aggregateAccountBalances(accountType, companyId, dateRange);
  }

  async getTopAccountsByVolume(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date },
    limit: number = 10
  ): Promise<Array<{ account: Account; volume: number; balance: number }>> {
    return await this.calculatorService.getTopAccountsByVolume(companyId, dateRange, limit);
  }

  async getRecentTransactions(
    companyId: string,
    limit: number = 20
  ): Promise<Array<{ journal: Journal; amount: number; type: string }>> {
    return await this.calculatorService.getRecentTransactions(companyId, limit);
  }

  async calculatePeriodComparison(
    companyId: string,
    currentPeriod: { startDate: Date; endDate: Date },
    previousPeriod: { startDate: Date; endDate: Date }
  ): Promise<{ growth: number; change: number; trend: 'positive' | 'negative' | 'stable' }> {
    return await this.calculatorService.calculatePeriodComparison(companyId, currentPeriod, previousPeriod);
  }
}
