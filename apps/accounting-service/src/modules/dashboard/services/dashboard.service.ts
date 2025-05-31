import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../../accounts/services/account.service';
import { JournalService } from '../../journals/services/journal.service';
import { TaxService } from '../../taxes/services/tax.service';
import { TreasuryService } from '../../treasury/services/treasury.service';
import { DashboardFilterDto, PeriodType, ComparisonType } from '../dtos/dashboard.dto';
import { AccountType } from '../../accounts/entities/account.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private accountService: AccountService,
    private journalService: JournalService,
    private taxService: TaxService,
    private treasuryService: TreasuryService,
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
    let comparison = null;
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
    // Récupérer les soldes de trésorerie
    const bankAccounts = await this.treasuryService.findAllAccounts();
    const cashPosition = await Promise.all(
      bankAccounts.map(async (account) => {
        const balance = await this.treasuryService.getAccountBalance(account.id);
        return {
          account: account.name,
          balance: balance.currentBalance,
          pendingReceipts: balance.pendingReceipts,
          pendingPayments: balance.pendingPayments,
          availableBalance: balance.availableBalance,
        };
      })
    );

    // Calculer les totaux
    const totals = cashPosition.reduce(
      (acc, pos) => ({
        balance: acc.balance + pos.balance,
        pendingReceipts: acc.pendingReceipts + pos.pendingReceipts,
        pendingPayments: acc.pendingPayments + pos.pendingPayments,
        availableBalance: acc.availableBalance + pos.availableBalance,
      }),
      { balance: 0, pendingReceipts: 0, pendingPayments: 0, availableBalance: 0 }
    );

    return {
      accounts: cashPosition,
      totals,
    };
  }

  private async getTaxSummary(filters: DashboardFilterDto): Promise<any> {
    const summary = await this.taxService.getTaxSummary(filters.fiscalYear);

    return {
      totalDue: summary.totalDue,
      totalPaid: summary.totalPaid,
      upcomingPayments: summary.upcomingPayments.map(payment => ({
        type: payment.type,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status,
      })),
      overduePayments: summary.overduePayments.map(payment => ({
        type: payment.type,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status,
        daysOverdue: Math.floor((Date.now() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    };
  }

  private async getTopAccounts(filters: DashboardFilterDto): Promise<any> {
    // Récupérer les comptes avec le plus de mouvements
    const accounts = await this.accountService.findAll({});
    const accountMovements = await Promise.all(
      accounts.accounts.map(async (account) => {
        const balance = await this.journalService.getAccountBalance(
          account.id,
          filters.fiscalYear,
          filters.endDate,
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
        fiscalYear: filters.fiscalYear,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      1,
      10,
    );

    return recentJournals.journals.map(journal => ({
      date: journal.date,
      reference: journal.reference,
      description: journal.description,
      type: journal.type,
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
          filters.fiscalYear,
          filters.endDate,
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
    const previousFilters = { ...filters };

    if (filters.comparison === ComparisonType.PREVIOUS_PERIOD) {
      // Ajuster les dates pour la période précédente
      if (filters.startDate && filters.endDate) {
        const duration = filters.endDate.getTime() - filters.startDate.getTime();
        previousFilters.endDate = new Date(filters.startDate);
        previousFilters.startDate = new Date(filters.startDate.getTime() - duration);
      }
    } else if (filters.comparison === ComparisonType.PREVIOUS_YEAR) {
      // Ajuster l'année fiscale pour l'année précédente
      previousFilters.fiscalYear = (parseInt(filters.fiscalYear) - 1).toString();
    }

    return previousFilters;
  }
}