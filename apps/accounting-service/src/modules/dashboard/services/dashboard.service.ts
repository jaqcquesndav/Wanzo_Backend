import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../../accounts/services/account.service';
import { JournalService } from '../../journals/services/journal.service';
import { AccountingOrchestrationService } from './accounting-orchestration.service';
// import { TaxService } from '../../taxes/services/tax.service';
// import { TreasuryService } from '../../treasury/services/treasury.service';
import { DashboardFilterDto, PeriodType, ComparisonType } from '../dtos/dashboard.dto';
import { AccountType } from '../../accounts/entities/account.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private accountService: AccountService,
    private journalService: JournalService,
    private orchestrationService: AccountingOrchestrationService,
    // private taxService: TaxService,
    // private treasuryService: TreasuryService,
  ) {}

  async getDashboardData(filters: DashboardFilterDto): Promise<any> {
    this.logger.debug(`Getting dashboard data for fiscal year ${filters.fiscalYearId}`);

    // Utiliser le service d'orchestration pour obtenir les métriques consolidées
    const metrics = await this.orchestrationService.getAccountingMetrics(
      filters.companyId || '',
      filters
    );

    const [
      topAccounts,
      recentTransactions,
    ] = await Promise.all([
      this.orchestrationService.getTopAccountsByVolume(
        filters.companyId || '',
        this.getDateRangeFromFilters(filters)
      ),
      this.orchestrationService.getRecentTransactions(filters.companyId || ''),
    ]);

    return {
      financialPosition: {
        balanceSheet: {
          totalAssets: metrics.totalAssets,
          totalLiabilities: metrics.totalLiabilities,
          totalEquity: metrics.totalEquity,
          netAssets: metrics.totalAssets - metrics.totalLiabilities,
        },
        ratios: {
          currentRatio: metrics.currentRatio,
          debtEquityRatio: metrics.debtEquityRatio,
          workingCapital: metrics.workingCapital,
        },
      },
      profitAndLoss: {
        current: {
          revenue: metrics.totalRevenue,
          expenses: metrics.totalExpenses,
          grossProfit: metrics.totalRevenue - metrics.totalExpenses,
          netProfit: metrics.netIncome,
          profitMargin: metrics.netProfitMargin,
        },
        comparison: await this.calculateComparison(filters, metrics),
      },
      cashPosition: {
        totalCash: metrics.cashOnHand + metrics.bankBalance,
        cashOnHand: metrics.cashOnHand,
        bankBalance: metrics.bankBalance,
      },
      taxSummary: await this.getTaxSummary(filters),
      topAccounts: topAccounts.map(item => ({
        account: {
          code: item.account.code,
          name: item.account.name,
          type: item.account.type,
        },
        movements: {
          volume: item.volume,
          balance: item.balance,
        },
      })),
      recentTransactions: recentTransactions.map(item => ({
        date: item.journal.date,
        reference: item.journal.reference,
        description: item.journal.description,
        type: item.type,
        amount: item.amount,
        status: item.journal.status,
      })),
      metrics: {
        syscohadaCompliance: metrics.complianceScore,
        balanceSheetAccuracy: metrics.balanceSheetAccuracy,
        totalTransactions: metrics.totalTransactions,
        activeAccounts: metrics.activeAccounts,
      },
    };
  }

  private async getFinancialPosition(filters: DashboardFilterDto): Promise<any> {
    // Calculer la position financière
    const totalAssets = await this.calculateAccountTypeTotal(AccountType.ASSET, filters);
    const totalLiabilities = await this.calculateAccountTypeTotal(AccountType.LIABILITY, filters);
    const totalEquity = await this.calculateAccountTypeTotal(AccountType.EQUITY, filters);

    // Calculer les ratios financiers
    const currentRatio = await this.calculateCurrentRatio(filters);
    const debtEquityRatio = totalLiabilities / totalEquity;
    const workingCapital = await this.calculateWorkingCapital(filters);

    return {
      balanceSheet: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        netAssets: totalAssets - totalLiabilities,
      },
      ratios: {
        currentRatio,
        debtEquityRatio,
        workingCapital,
      },
    };
  }

  private async getProfitAndLoss(filters: DashboardFilterDto): Promise<any> {
    // Calculer les revenus et dépenses
    const revenue = await this.calculateAccountTypeTotal(AccountType.REVENUE, filters);
    const expenses = await this.calculateAccountTypeTotal(AccountType.EXPENSE, filters);
    const grossProfit = revenue - expenses;
    const netProfit = grossProfit; // Simplifié pour l'exemple

    // Calculer les variations si une comparaison est demandée
    let comparison: any = null;
    if (filters.comparison) {
      const previousFilters = this.getPreviousFilters(filters);
      const previousRevenue = await this.calculateAccountTypeTotal(AccountType.REVENUE, previousFilters);
      const previousExpenses = await this.calculateAccountTypeTotal(AccountType.EXPENSE, previousFilters);
      const previousGrossProfit = previousRevenue - previousExpenses;

      comparison = {
        revenue: {
          value: previousRevenue,
          change: ((revenue - previousRevenue) / previousRevenue) * 100,
        },
        expenses: {
          value: previousExpenses,
          change: ((expenses - previousExpenses) / previousExpenses) * 100,
        },
        grossProfit: {
          value: previousGrossProfit,
          change: ((grossProfit - previousGrossProfit) / previousGrossProfit) * 100,
        },
      };
    }

    return {
      current: {
        revenue,
        expenses,
        grossProfit,
        netProfit,
        profitMargin: (netProfit / revenue) * 100,
      },
      comparison,
    };
  }

  private async getCashPosition(filters: DashboardFilterDto): Promise<any> {
    // Récupérer les comptes de trésorerie (banque, caisse)
    // const bankAccounts = await this.treasuryService.findAllAccounts();
    const totalCash = 0; // await Promise.all(
    //   bankAccounts.map(async (account) => {
    //     const balance = await this.treasuryService.getAccountBalance(account.id);
    //     return balance;
    //   })
    // ).then(balances => balances.reduce((sum, balance) => sum + balance, 0));

    return {
      totalCash,
      bankAccounts: [], // bankAccounts.map(account => ({ id: account.id, name: account.name })),
    };
  }

  private async getTaxSummary(filters: DashboardFilterDto): Promise<any> {
    // Récupérer le résumé fiscal
    // const summary = await this.taxService.getTaxSummary(filters.fiscalYearId || '', filters.companyId || '');

    // Placeholder data since TaxService is not available
    const summary = {
      totalTax: 0,
      taxPaid: 0,
      taxOwed: 0,
      nextDueDate: null
    };

    return summary;
  }

  private async getTopAccounts(filters: DashboardFilterDto): Promise<any> {
    // Récupérer les comptes avec le plus de mouvements
    const accounts = await this.accountService.findAll({});
    const accountMovements = await Promise.all(
      accounts.accounts.map(async (account) => {
        const balance = await this.journalService.getAccountBalance(
          account.id,
          filters.fiscalYearId || '',
          filters.companyId || '', 
          filters.endDate ? new Date(filters.endDate) : undefined,
        );
        return {
          account: {
            code: account.code,
            name: account.name,
            type: account.type,
          },
          movements: {
            debit: balance.debit,
            credit: balance.credit,
            balance: balance.balance,
          },
        };
      })
    );

    // Trier par volume de transactions
    const sortedAccounts = accountMovements
      .sort((a, b) => (Math.abs(b.movements.debit) + Math.abs(b.movements.credit)) 
                    - (Math.abs(a.movements.debit) + Math.abs(a.movements.credit)))
      .slice(0, 10);

    return sortedAccounts;
  }

  private async getRecentTransactions(filters: DashboardFilterDto): Promise<any> {
    // Récupérer les dernières écritures comptables
    const recentJournals = await this.journalService.findAll(
      {
        fiscalYear: filters.fiscalYearId || '',
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      },
      1,
      10,
    );

    return recentJournals.journals.map(journal => ({
      date: journal.date,
      reference: journal.reference,
      description: journal.description,
      type: journal.journalType, 
      amount: journal.totalDebit, // Les montants sont équilibrés donc on peut prendre soit débit soit crédit
      status: journal.status,
    }));
  }

  private async calculateAccountTypeTotal(
    accountType: AccountType,
    filters: DashboardFilterDto,
  ): Promise<number> {
    const accounts = await this.accountService.findAll({ type: accountType });
    const balances = await Promise.all(
      accounts.accounts.map(account =>
        this.journalService.getAccountBalance(
          account.id,
          filters.fiscalYearId || '',
          filters.companyId || '', 
          filters.endDate ? new Date(filters.endDate) : undefined,
        ),
      ),
    );

    return balances.reduce((total, balance) => total + balance.balance, 0);
  }

  private async calculateCurrentRatio(filters: DashboardFilterDto): Promise<number> {
    const currentAssets = await this.calculateAccountTypeTotal(AccountType.ASSET, filters);
    const currentLiabilities = await this.calculateAccountTypeTotal(AccountType.LIABILITY, filters);
    return currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;
  }

  private async calculateWorkingCapital(filters: DashboardFilterDto): Promise<number> {
    const currentAssets = await this.calculateAccountTypeTotal(AccountType.ASSET, filters);
    const currentLiabilities = await this.calculateAccountTypeTotal(AccountType.LIABILITY, filters);
    return currentAssets - currentLiabilities;
  }

  private getPreviousFilters(filters: DashboardFilterDto): DashboardFilterDto {
    // Create a new instance of DashboardFilterDto instead of a plain object
    const previousFilters = new DashboardFilterDto();
    // Copy properties
    previousFilters.fiscalYearId = filters.fiscalYearId;
    previousFilters.companyId = filters.companyId;
    previousFilters.startDate = filters.startDate;
    previousFilters.endDate = filters.endDate;
    previousFilters.comparison = filters.comparison;

    if (filters.comparison === ComparisonType.PREVIOUS_PERIOD) {
      // Ajuster les dates pour la période précédente
      if (filters.startDate && filters.endDate) {
        const duration = filters.endDate.getTime() - filters.startDate.getTime();
        previousFilters.endDate = new Date(filters.startDate);
        previousFilters.startDate = new Date(filters.startDate.getTime() - duration);
      }
    } else if (filters.comparison === ComparisonType.PREVIOUS_YEAR) {
      // Ajuster l'année fiscale pour l'année précédente
      previousFilters.fiscalYearId = filters.fiscalYearId ? (parseInt(filters.fiscalYearId) - 1).toString() : '';
    }

    return previousFilters;
  }

  /**
   * Get quick stats only
   */
  async getQuickStats(filters: DashboardFilterDto): Promise<any> {
    const metrics = await this.orchestrationService.getAccountingMetrics(
      filters.companyId || '',
      filters
    );

    // Calculer les tendances en comparant avec la période précédente
    const previousPeriod = this.getPreviousPeriod(filters);
    const comparison = await this.orchestrationService.calculatePeriodComparison(
      filters.companyId || '',
      this.getDateRangeFromFilters(filters),
      this.getDateRangeFromFilters(previousPeriod)
    );

    const trends = {
      assets: { value: Math.abs(comparison.growth), isPositive: comparison.trend === 'positive' },
      revenue: { value: Math.abs(metrics.revenueGrowth), isPositive: metrics.revenueGrowth > 0 },
      netIncome: { value: Math.abs(metrics.profitabilityTrend), isPositive: metrics.profitabilityTrend > 0 },
      cashOnHand: { value: 5, isPositive: true } // Simplifié
    };

    return {
      totalAssets: metrics.totalAssets,
      revenue: metrics.totalRevenue,
      netIncome: metrics.netIncome,
      cashOnHand: metrics.cashOnHand + metrics.bankBalance,
      trends
    };
  }

  /**
   * Get financial ratios
   */
  async getFinancialRatios(filters: DashboardFilterDto): Promise<any> {
    const metrics = await this.orchestrationService.getAccountingMetrics(
      filters.companyId || '',
      filters
    );

    return {
      grossProfitMargin: metrics.grossProfitMargin,
      breakEvenPoint: this.calculateBreakEvenPoint(metrics),
      daysSalesOutstanding: 45, // À calculer selon la logique métier
      daysPayableOutstanding: 30, // À calculer selon la logique métier
      workingCapital: metrics.workingCapital,
      currentRatio: metrics.currentRatio
    };
  }

  /**
   * Get key performance indicators
   */
  async getKeyPerformanceIndicators(filters: DashboardFilterDto): Promise<any> {
    const metrics = await this.orchestrationService.getAccountingMetrics(
      filters.companyId || '',
      filters
    );

    // Calculer un score de crédit basé sur les métriques financières
    const creditScore = this.calculateCreditScore(metrics);
    const financialRating = this.calculateFinancialRating(creditScore);

    return {
      creditScore,
      financialRating
    };
  }

  /**
   * Get revenue data for charts
   */
  async getRevenueData(filters: DashboardFilterDto): Promise<any> {
    // Pour maintenant, générer des données simulées
    // À remplacer par une vraie logique de récupération de données historiques
    const dateRange = this.getDateRangeFromFilters(filters);
    const monthlyData: Array<{ date: string; revenue: number }> = [];

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Premier jour du mois

    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Simuler des données de revenus (à remplacer par de vraies données)
      const baseRevenue = 12000000;
      const variation = (Math.random() - 0.5) * 0.4; // ±20% de variation
      const revenue = baseRevenue * (1 + variation);

      monthlyData.push({
        date: monthKey,
        revenue: Math.round(revenue)
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyData;
  }

  /**
   * Get expenses data for charts
   */
  async getExpensesData(filters: DashboardFilterDto): Promise<any> {
    // Simplification - à remplacer par de vraies données de ventilation des dépenses
    const metrics = await this.orchestrationService.getAccountingMetrics(
      filters.companyId || '',
      filters
    );

    const totalExpenses = metrics.totalExpenses;
    
    // Répartition approximative des dépenses (à ajuster selon la logique métier)
    return [
      { name: "Achats", value: Math.round(totalExpenses * 0.4), color: "#197ca8" },
      { name: "Personnel", value: Math.round(totalExpenses * 0.3), color: "#015730" },
      { name: "Services", value: Math.round(totalExpenses * 0.2), color: "#ee872b" },
      { name: "Autres", value: Math.round(totalExpenses * 0.1), color: "#64748b" }
    ];
  }

  /**
   * Méthodes utilitaires privées
   */
  private getDateRangeFromFilters(filters: DashboardFilterDto): { startDate: Date; endDate: Date } {
    if (filters.startDate && filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }

    // Par défaut, utiliser l'année courante
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { startDate: startOfYear, endDate: endOfYear };
  }

  private async calculateComparison(filters: DashboardFilterDto, currentMetrics: any): Promise<any> {
    if (!filters.comparison || filters.comparison === ComparisonType.NONE) {
      return null;
    }

    const previousPeriod = this.getPreviousPeriod(filters);
    const previousMetrics = await this.orchestrationService.getAccountingMetrics(
      filters.companyId || '',
      previousPeriod
    );

    return {
      revenue: {
        value: previousMetrics.totalRevenue,
        change: this.calculatePercentageChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
      },
      expenses: {
        value: previousMetrics.totalExpenses,
        change: this.calculatePercentageChange(currentMetrics.totalExpenses, previousMetrics.totalExpenses),
      },
      grossProfit: {
        value: previousMetrics.totalRevenue - previousMetrics.totalExpenses,
        change: this.calculatePercentageChange(
          currentMetrics.totalRevenue - currentMetrics.totalExpenses,
          previousMetrics.totalRevenue - previousMetrics.totalExpenses
        ),
      },
    };
  }

  private getPreviousPeriod(filters: DashboardFilterDto): DashboardFilterDto {
    const previousFilters = new DashboardFilterDto();
    
    // Copier toutes les propriétés
    previousFilters.period = filters.period;
    previousFilters.fiscalYearId = filters.fiscalYearId;
    previousFilters.companyId = filters.companyId;
    previousFilters.startDate = filters.startDate;
    previousFilters.endDate = filters.endDate;
    previousFilters.comparison = filters.comparison;

    if (filters.comparison === ComparisonType.PREVIOUS_PERIOD) {
      // Ajuster les dates pour la période précédente
      if (filters.startDate && filters.endDate) {
        const duration = filters.endDate.getTime() - filters.startDate.getTime();
        previousFilters.endDate = new Date(filters.startDate);
        previousFilters.startDate = new Date(filters.startDate.getTime() - duration);
      }
    } else if (filters.comparison === ComparisonType.PREVIOUS_YEAR) {
      // Ajuster l'année fiscale pour l'année précédente
      previousFilters.fiscalYearId = filters.fiscalYearId 
        ? (parseInt(filters.fiscalYearId) - 1).toString() 
        : '';
    }

    return previousFilters;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculateBreakEvenPoint(metrics: any): number {
    // Calcul simplifié du point mort
    if (metrics.grossProfitMargin > 0) {
      return Math.round((metrics.totalExpenses / (metrics.grossProfitMargin / 100)));
    }
    return 0;
  }

  private calculateCreditScore(metrics: any): number {
    // Calcul simplifié d'un score de crédit basé sur les métriques financières
    let score = 600; // Score de base

    // Ratio de liquidité
    if (metrics.currentRatio > 2) score += 50;
    else if (metrics.currentRatio > 1.5) score += 30;
    else if (metrics.currentRatio > 1) score += 10;

    // Ratio d'endettement
    if (metrics.debtEquityRatio < 0.3) score += 40;
    else if (metrics.debtEquityRatio < 0.5) score += 20;
    else if (metrics.debtEquityRatio < 1) score += 10;

    // Marge bénéficiaire
    if (metrics.netProfitMargin > 15) score += 40;
    else if (metrics.netProfitMargin > 10) score += 25;
    else if (metrics.netProfitMargin > 5) score += 15;

    // Conformité SYSCOHADA
    if (metrics.complianceScore > 95) score += 30;
    else if (metrics.complianceScore > 90) score += 20;
    else if (metrics.complianceScore > 80) score += 10;

    return Math.min(850, Math.max(300, score));
  }

  private calculateFinancialRating(creditScore: number): string {
    if (creditScore >= 800) return "AAA";
    if (creditScore >= 750) return "AA+";
    if (creditScore >= 700) return "AA";
    if (creditScore >= 650) return "AA-";
    if (creditScore >= 600) return "A+";
    if (creditScore >= 550) return "A";
    if (creditScore >= 500) return "A-";
    if (creditScore >= 450) return "BBB";
    if (creditScore >= 400) return "BB";
    return "B";
  }
}
