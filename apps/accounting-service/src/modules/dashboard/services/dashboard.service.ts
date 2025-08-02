import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../../accounts/services/account.service';
import { JournalService } from '../../journals/services/journal.service';
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
    // private taxService: TaxService,
    // private treasuryService: TreasuryService,
  ) {}

  async getDashboardData(filters: DashboardFilterDto): Promise<any> {
    this.logger.debug(`Getting dashboard data for fiscal year ${filters.fiscalYear}`);

    const [
      financialPosition,
      profitAndLoss,
      cashPosition,
      taxSummary,
      topAccounts,
      recentTransactions,
    ] = await Promise.all([
      this.getFinancialPosition(filters),
      this.getProfitAndLoss(filters),
      this.getCashPosition(filters),
      this.getTaxSummary(filters),
      this.getTopAccounts(filters),
      this.getRecentTransactions(filters),
    ]);

    return {
      financialPosition,
      profitAndLoss,
      cashPosition,
      taxSummary,
      topAccounts,
      recentTransactions,
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
    const totalAssets = await this.calculateAccountTypeTotal(AccountType.ASSET, filters);
    const revenue = await this.calculateAccountTypeTotal(AccountType.REVENUE, filters);
    const expenses = await this.calculateAccountTypeTotal(AccountType.EXPENSE, filters);
    const netIncome = revenue - expenses;
    const cashOnHand = await this.getCashBalance(filters);

    // Calculate trends (simplified - in real implementation, compare with previous period)
    const trends = {
      assets: { value: 15, isPositive: true },
      revenue: { value: 8, isPositive: true },
      netIncome: { value: 12, isPositive: true },
      cashOnHand: { value: 5, isPositive: true }
    };

    return {
      totalAssets,
      revenue,
      netIncome,
      cashOnHand,
      trends
    };
  }

  /**
   * Get financial ratios
   */
  async getFinancialRatios(filters: DashboardFilterDto): Promise<any> {
    const currentRatio = await this.calculateCurrentRatio(filters);
    const workingCapital = await this.calculateWorkingCapital(filters);
    
    // Additional financial ratios (simplified calculations)
    const grossProfitMargin = 65; // TODO: Calculate actual margin
    const breakEvenPoint = 7000000; // TODO: Calculate actual break-even
    const daysSalesOutstanding = 45; // TODO: Calculate actual DSO
    const daysPayableOutstanding = 30; // TODO: Calculate actual DPO

    return {
      grossProfitMargin,
      breakEvenPoint,
      daysSalesOutstanding,
      daysPayableOutstanding,
      workingCapital,
      currentRatio
    };
  }

  /**
   * Get key performance indicators
   */
  async getKeyPerformanceIndicators(filters: DashboardFilterDto): Promise<any> {
    // TODO: Implement actual credit score and rating calculation
    return {
      creditScore: 750,
      financialRating: "AA-"
    };
  }

  /**
   * Get revenue data for charts
   */
  async getRevenueData(filters: DashboardFilterDto): Promise<any> {
    // TODO: Implement actual revenue data retrieval
    // This is a simplified implementation
    return [
      { date: "2024-01", revenue: 12000000 },
      { date: "2024-02", revenue: 15000000 },
      { date: "2024-03", revenue: 18000000 }
    ];
  }

  /**
   * Get expenses data for charts
   */
  async getExpensesData(filters: DashboardFilterDto): Promise<any> {
    // TODO: Implement actual expenses breakdown
    // This is a simplified implementation
    return [
      { name: "Achats", value: 8000000, color: "#197ca8" },
      { name: "Personnel", value: 5000000, color: "#015730" },
      { name: "Services", value: 3000000, color: "#ee872b" },
      { name: "Autres", value: 2000000, color: "#64748b" }
    ];
  }

  /**
   * Get cash balance
   */
  private async getCashBalance(filters: DashboardFilterDto): Promise<number> {
    // TODO: Implement actual cash balance calculation
    // This should calculate based on cash and bank accounts
    return 7500000;
  }
}