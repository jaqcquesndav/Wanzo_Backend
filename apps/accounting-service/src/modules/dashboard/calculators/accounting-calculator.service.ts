import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Account, AccountType } from '../../accounts/entities/account.entity';
import { Journal, JournalStatus } from '../../journals/entities/journal.entity';
import { JournalLine } from '../../journals/entities/journal-line.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';

export interface BalanceSheetMetrics {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  fixedAssets: number;
  longTermLiabilities: number;
}

export interface IncomeStatementMetrics {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netIncome: number;
  operatingIncome: number;
  ebitda: number;
}

export interface CashFlowMetrics {
  cashOnHand: number;
  bankBalance: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
}

export interface FinancialRatios {
  currentRatio: number;
  quickRatio: number;
  debtEquityRatio: number;
  debtRatio: number;
  workingCapital: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  operatingMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
}

export interface OperationalMetrics {
  totalTransactions: number;
  activeAccounts: number;
  pendingJournals: number;
  averageTransactionSize: number;
  transactionVolume: number;
  accountUtilization: number;
}

export interface PerformanceMetrics {
  revenueGrowth: number;
  expenseGrowth: number;
  profitabilityTrend: number;
  assetTurnover: number;
  inventoryTurnover: number;
  receivableTurnover: number;
  payableTurnover: number;
}

export interface SYSCOHADACompliance {
  balanceSheetAccuracy: number;
  complianceScore: number;
  chartOfAccountsCompliance: number;
  journalIntegrity: number;
  fiscalYearCompliance: number;
}

@Injectable()
export class AccountingCalculatorService {
  private readonly logger = new Logger(AccountingCalculatorService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    @InjectRepository(FiscalYear)
    private fiscalYearRepository: Repository<FiscalYear>,
  ) {}

  /**
   * Calculer les métriques du bilan
   */
  async calculateBalanceSheetMetrics(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<BalanceSheetMetrics> {
    const [
      totalAssets,
      totalLiabilities,
      totalEquity,
      currentAssets,
      currentLiabilities,
      fixedAssets,
      longTermLiabilities,
    ] = await Promise.all([
      this.aggregateAccountBalances(AccountType.ASSET, companyId, dateRange),
      this.aggregateAccountBalances(AccountType.LIABILITY, companyId, dateRange),
      this.aggregateAccountBalances(AccountType.EQUITY, companyId, dateRange),
      this.calculateCurrentAssets(companyId, dateRange),
      this.calculateCurrentLiabilities(companyId, dateRange),
      this.calculateFixedAssets(companyId, dateRange),
      this.calculateLongTermLiabilities(companyId, dateRange),
    ]);

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      currentAssets,
      currentLiabilities,
      fixedAssets,
      longTermLiabilities,
    };
  }

  /**
   * Calculer les métriques du compte de résultat
   */
  async calculateIncomeStatementMetrics(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<IncomeStatementMetrics> {
    const [totalRevenue, totalExpenses] = await Promise.all([
      this.aggregateAccountBalances(AccountType.REVENUE, companyId, dateRange),
      this.aggregateAccountBalances(AccountType.EXPENSE, companyId, dateRange),
    ]);

    const grossProfit = totalRevenue - totalExpenses;
    const netIncome = grossProfit; // Simplifié - à ajuster selon la logique métier
    const operatingIncome = netIncome; // Simplifié
    const ebitda = operatingIncome; // Simplifié

    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      netIncome,
      operatingIncome,
      ebitda,
    };
  }

  /**
   * Calculer les métriques de trésorerie
   */
  async calculateCashFlowMetrics(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<CashFlowMetrics> {
    // Comptes de trésorerie (classe 5 SYSCOHADA)
    const cashAccounts = await this.accountRepository.find({
      where: {
        companyId,
        class: '5', // Comptes de trésorerie SYSCOHADA
      },
    });

    let cashOnHand = 0;
    let bankBalance = 0;

    for (const account of cashAccounts) {
      const balance = await this.getAccountBalance(account.id, companyId, dateRange);
      
      if (account.code.startsWith('57')) { // Caisse
        cashOnHand += balance;
      } else if (account.code.startsWith('52')) { // Banque
        bankBalance += balance;
      }
    }

    // Flux de trésorerie (simplifié)
    const operatingCashFlow = await this.calculateOperatingCashFlow(companyId, dateRange);
    const investingCashFlow = await this.calculateInvestingCashFlow(companyId, dateRange);
    const financingCashFlow = await this.calculateFinancingCashFlow(companyId, dateRange);
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      cashOnHand,
      bankBalance,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
    };
  }

  /**
   * Calculer les ratios financiers
   */
  async calculateFinancialRatios(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<FinancialRatios> {
    const balanceSheet = await this.calculateBalanceSheetMetrics(companyId, dateRange);
    const incomeStatement = await this.calculateIncomeStatementMetrics(companyId, dateRange);

    const currentRatio = balanceSheet.currentLiabilities !== 0 
      ? balanceSheet.currentAssets / balanceSheet.currentLiabilities 
      : 0;

    const quickRatio = balanceSheet.currentLiabilities !== 0
      ? (balanceSheet.currentAssets - await this.calculateInventory(companyId, dateRange)) / balanceSheet.currentLiabilities
      : 0;

    const debtEquityRatio = balanceSheet.totalEquity !== 0
      ? balanceSheet.totalLiabilities / balanceSheet.totalEquity
      : 0;

    const debtRatio = balanceSheet.totalAssets !== 0
      ? balanceSheet.totalLiabilities / balanceSheet.totalAssets
      : 0;

    const workingCapital = balanceSheet.currentAssets - balanceSheet.currentLiabilities;

    const grossProfitMargin = incomeStatement.totalRevenue !== 0
      ? (incomeStatement.grossProfit / incomeStatement.totalRevenue) * 100
      : 0;

    const netProfitMargin = incomeStatement.totalRevenue !== 0
      ? (incomeStatement.netIncome / incomeStatement.totalRevenue) * 100
      : 0;

    const operatingMargin = incomeStatement.totalRevenue !== 0
      ? (incomeStatement.operatingIncome / incomeStatement.totalRevenue) * 100
      : 0;

    const returnOnAssets = balanceSheet.totalAssets !== 0
      ? (incomeStatement.netIncome / balanceSheet.totalAssets) * 100
      : 0;

    const returnOnEquity = balanceSheet.totalEquity !== 0
      ? (incomeStatement.netIncome / balanceSheet.totalEquity) * 100
      : 0;

    return {
      currentRatio,
      quickRatio,
      debtEquityRatio,
      debtRatio,
      workingCapital,
      grossProfitMargin,
      netProfitMargin,
      operatingMargin,
      returnOnAssets,
      returnOnEquity,
    };
  }

  /**
   * Calculer les métriques opérationnelles
   */
  async calculateOperationalMetrics(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<OperationalMetrics> {
    const [
      totalTransactions,
      activeAccounts,
      pendingJournals,
      transactionData,
    ] = await Promise.all([
      this.countTransactions(companyId, dateRange),
      this.countActiveAccounts(companyId, dateRange),
      this.countPendingJournals(companyId),
      this.getTransactionData(companyId, dateRange),
    ]);

    const averageTransactionSize = transactionData.totalAmount / totalTransactions || 0;
    const transactionVolume = transactionData.totalAmount;
    const accountUtilization = (activeAccounts / await this.getTotalAccounts(companyId)) * 100;

    return {
      totalTransactions,
      activeAccounts,
      pendingJournals,
      averageTransactionSize,
      transactionVolume,
      accountUtilization,
    };
  }

  /**
   * Calculer les métriques de performance
   */
  async calculatePerformanceMetrics(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date },
    filters: any
  ): Promise<PerformanceMetrics> {
    // Période précédente pour comparaison
    const previousPeriod = this.getPreviousPeriod(dateRange);
    
    const [
      currentRevenue,
      previousRevenue,
      currentExpenses,
      previousExpenses,
      assetTurnover,
    ] = await Promise.all([
      this.aggregateAccountBalances(AccountType.REVENUE, companyId, dateRange),
      this.aggregateAccountBalances(AccountType.REVENUE, companyId, previousPeriod),
      this.aggregateAccountBalances(AccountType.EXPENSE, companyId, dateRange),
      this.aggregateAccountBalances(AccountType.EXPENSE, companyId, previousPeriod),
      this.calculateAssetTurnover(companyId, dateRange),
    ]);

    const revenueGrowth = previousRevenue !== 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const expenseGrowth = previousExpenses !== 0
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
      : 0;

    const currentProfitability = currentRevenue - currentExpenses;
    const previousProfitability = previousRevenue - previousExpenses;
    const profitabilityTrend = previousProfitability !== 0
      ? ((currentProfitability - previousProfitability) / previousProfitability) * 100
      : 0;

    // Turnover ratios (simplifiés)
    const inventoryTurnover = await this.calculateInventoryTurnover(companyId, dateRange);
    const receivableTurnover = await this.calculateReceivableTurnover(companyId, dateRange);
    const payableTurnover = await this.calculatePayableTurnover(companyId, dateRange);

    return {
      revenueGrowth,
      expenseGrowth,
      profitabilityTrend,
      assetTurnover,
      inventoryTurnover,
      receivableTurnover,
      payableTurnover,
    };
  }

  /**
   * Calculer la conformité SYSCOHADA
   */
  async calculateSYSCOHADACompliance(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<SYSCOHADACompliance> {
    const [
      balanceSheetAccuracy,
      chartCompliance,
      journalIntegrity,
      fiscalCompliance,
    ] = await Promise.all([
      this.calculateBalanceSheetAccuracy(companyId, dateRange),
      this.calculateChartOfAccountsCompliance(companyId),
      this.calculateJournalIntegrity(companyId, dateRange),
      this.calculateFiscalYearCompliance(companyId, dateRange),
    ]);

    const complianceScore = (balanceSheetAccuracy + chartCompliance + journalIntegrity + fiscalCompliance) / 4;

    return {
      balanceSheetAccuracy,
      complianceScore,
      chartOfAccountsCompliance: chartCompliance,
      journalIntegrity,
      fiscalYearCompliance: fiscalCompliance,
    };
  }

  /**
   * Méthodes utilitaires
   */
  async aggregateAccountBalances(
    accountType: AccountType,
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<number> {
    const accounts = await this.accountRepository.find({
      where: { type: accountType, companyId },
    });

    let total = 0;
    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, companyId, dateRange);
      total += balance;
    }

    return total;
  }

  async getAccountBalance(
    accountId: string,
    companyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<number> {
    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journal', 'journal')
      .select('SUM(line.debit - line.credit)', 'balance')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.companyId = :companyId', { companyId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED })
      .andWhere('journal.date BETWEEN :startDate AND :endDate', dateRange)
      .getRawOne();

    return parseFloat(result?.balance || '0');
  }

  async getTopAccountsByVolume(
    companyId: string,
    dateRange: { startDate: Date; endDate: Date },
    limit: number = 10
  ): Promise<Array<{ account: Account; volume: number; balance: number }>> {
    const accounts = await this.accountRepository.find({
      where: { companyId },
    });

    const accountsWithMetrics: Array<{ account: Account; volume: number; balance: number }> = [];

    for (const account of accounts) {
      const [volume, balance] = await Promise.all([
        this.getAccountTransactionVolume(account.id, companyId, dateRange),
        this.getAccountBalance(account.id, companyId, dateRange),
      ]);

      if (volume > 0) {
        accountsWithMetrics.push({ account, volume, balance });
      }
    }

    return accountsWithMetrics
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  async getRecentTransactions(
    companyId: string,
    limit: number = 20
  ): Promise<Array<{ journal: Journal; amount: number; type: string }>> {
    const journals = await this.journalRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['lines'],
    });

    return journals.map(journal => ({
      journal,
      amount: journal.totalDebit || 0,
      type: journal.journalType,
    }));
  }

  async calculatePeriodComparison(
    companyId: string,
    currentPeriod: { startDate: Date; endDate: Date },
    previousPeriod: { startDate: Date; endDate: Date }
  ): Promise<{ growth: number; change: number; trend: 'positive' | 'negative' | 'stable' }> {
    const [currentValue, previousValue] = await Promise.all([
      this.aggregateAccountBalances(AccountType.REVENUE, companyId, currentPeriod),
      this.aggregateAccountBalances(AccountType.REVENUE, companyId, previousPeriod),
    ]);

    const change = currentValue - previousValue;
    const growth = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    let trend: 'positive' | 'negative' | 'stable' = 'stable';
    if (growth > 5) trend = 'positive';
    else if (growth < -5) trend = 'negative';

    return { growth, change, trend };
  }

  /**
   * Méthodes privées pour calculs spécialisés
   */
  private async calculateCurrentAssets(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Classes 3, 4, 5 SYSCOHADA (stocks, créances, trésorerie)
    const currentAssetClasses = ['3', '4', '5'];
    let total = 0;

    for (const accountClass of currentAssetClasses) {
      const accounts = await this.accountRepository.find({
        where: { companyId, class: accountClass },
      });

      for (const account of accounts) {
        const balance = await this.getAccountBalance(account.id, companyId, dateRange);
        total += balance;
      }
    }

    return total;
  }

  private async calculateCurrentLiabilities(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Dettes à court terme (partie de la classe 4 SYSCOHADA)
    const accounts = await this.accountRepository.find({
      where: { 
        companyId, 
        class: '4',
        type: AccountType.LIABILITY,
      },
    });

    let total = 0;
    for (const account of accounts) {
      // Filtrer les dettes à court terme (à affiner selon la logique métier)
      if (account.code.startsWith('40') || account.code.startsWith('43') || account.code.startsWith('44')) {
        const balance = await this.getAccountBalance(account.id, companyId, dateRange);
        total += balance;
      }
    }

    return total;
  }

  private async calculateFixedAssets(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Classe 2 SYSCOHADA (immobilisations)
    const accounts = await this.accountRepository.find({
      where: { companyId, class: '2' },
    });

    let total = 0;
    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, companyId, dateRange);
      total += balance;
    }

    return total;
  }

  private async calculateLongTermLiabilities(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Dettes à long terme (partie de la classe 1 et 4 SYSCOHADA)
    const accounts = await this.accountRepository.find({
      where: { 
        companyId, 
        type: AccountType.LIABILITY,
      },
    });

    let total = 0;
    for (const account of accounts) {
      // Filtrer les dettes à long terme
      if (account.code.startsWith('16') || account.code.startsWith('17') || account.code.startsWith('18')) {
        const balance = await this.getAccountBalance(account.id, companyId, dateRange);
        total += balance;
      }
    }

    return total;
  }

  private async calculateInventory(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Classe 3 SYSCOHADA (stocks)
    const accounts = await this.accountRepository.find({
      where: { companyId, class: '3' },
    });

    let total = 0;
    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, companyId, dateRange);
      total += balance;
    }

    return total;
  }

  private async calculateOperatingCashFlow(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Simplifié : flux d'exploitation basé sur les revenus et dépenses
    const revenue = await this.aggregateAccountBalances(AccountType.REVENUE, companyId, dateRange);
    const expenses = await this.aggregateAccountBalances(AccountType.EXPENSE, companyId, dateRange);
    return revenue - expenses;
  }

  private async calculateInvestingCashFlow(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Simplifié : flux d'investissement basé sur les immobilisations
    return 0; // À implémenter selon la logique métier
  }

  private async calculateFinancingCashFlow(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Simplifié : flux de financement basé sur les capitaux propres et dettes
    return 0; // À implémenter selon la logique métier
  }

  private async countTransactions(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    const result = await this.journalRepository
      .createQueryBuilder('journal')
      .where('journal.companyId = :companyId', { companyId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED })
      .andWhere('journal.date BETWEEN :startDate AND :endDate', dateRange)
      .getCount();

    return result;
  }

  private async countActiveAccounts(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journal', 'journal')
      .select('COUNT(DISTINCT line.accountId)', 'count')
      .where('journal.companyId = :companyId', { companyId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED })
      .andWhere('journal.date BETWEEN :startDate AND :endDate', dateRange)
      .getRawOne();

    return parseInt(result?.count || '0');
  }

  private async countPendingJournals(companyId: string): Promise<number> {
    return await this.journalRepository.count({
      where: { 
        companyId, 
        status: JournalStatus.PENDING,
      },
    });
  }

  private async getTransactionData(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<{ totalAmount: number }> {
    const result = await this.journalRepository
      .createQueryBuilder('journal')
      .select('SUM(journal.totalDebit)', 'totalAmount')
      .where('journal.companyId = :companyId', { companyId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED })
      .andWhere('journal.date BETWEEN :startDate AND :endDate', dateRange)
      .getRawOne();

    return { totalAmount: parseFloat(result?.totalAmount || '0') };
  }

  private async getTotalAccounts(companyId: string): Promise<number> {
    return await this.accountRepository.count({ where: { companyId } });
  }

  private async getAccountTransactionVolume(accountId: string, companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journal', 'journal')
      .select('SUM(line.debit + line.credit)', 'volume')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.companyId = :companyId', { companyId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED })
      .andWhere('journal.date BETWEEN :startDate AND :endDate', dateRange)
      .getRawOne();

    return parseFloat(result?.volume || '0');
  }

  private getPreviousPeriod(dateRange: { startDate: Date; endDate: Date }): { startDate: Date; endDate: Date } {
    const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const startDate = new Date(dateRange.startDate.getTime() - duration);
    const endDate = new Date(dateRange.startDate.getTime());
    return { startDate, endDate };
  }

  private async calculateAssetTurnover(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    const [revenue, totalAssets] = await Promise.all([
      this.aggregateAccountBalances(AccountType.REVENUE, companyId, dateRange),
      this.aggregateAccountBalances(AccountType.ASSET, companyId, dateRange),
    ]);

    return totalAssets !== 0 ? revenue / totalAssets : 0;
  }

  private async calculateInventoryTurnover(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Simplifié : ratio rotation des stocks
    return 12; // Valeur par défaut - à implémenter selon la logique métier
  }

  private async calculateReceivableTurnover(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Simplifié : ratio rotation des créances
    return 8; // Valeur par défaut - à implémenter selon la logique métier
  }

  private async calculatePayableTurnover(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Simplifié : ratio rotation des dettes
    return 6; // Valeur par défaut - à implémenter selon la logique métier
  }

  private async calculateBalanceSheetAccuracy(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Vérifier l'équilibre du bilan (Actif = Passif)
    const totalAssets = await this.aggregateAccountBalances(AccountType.ASSET, companyId, dateRange);
    const totalLiabilities = await this.aggregateAccountBalances(AccountType.LIABILITY, companyId, dateRange);
    const totalEquity = await this.aggregateAccountBalances(AccountType.EQUITY, companyId, dateRange);

    const totalPassive = totalLiabilities + totalEquity;
    const difference = Math.abs(totalAssets - totalPassive);
    const accuracy = totalAssets !== 0 ? Math.max(0, 100 - (difference / totalAssets) * 100) : 100;

    return accuracy;
  }

  private async calculateChartOfAccountsCompliance(companyId: string): Promise<number> {
    // Vérifier la conformité du plan comptable SYSCOHADA
    const accounts = await this.accountRepository.find({ where: { companyId } });
    
    let compliantAccounts = 0;
    for (const account of accounts) {
      // Vérifier si le code respecte la nomenclature SYSCOHADA
      if (this.isValidSYSCOHADACode(account.code)) {
        compliantAccounts++;
      }
    }

    return accounts.length > 0 ? (compliantAccounts / accounts.length) * 100 : 100;
  }

  private async calculateJournalIntegrity(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Vérifier l'intégrité des écritures (équilibre débit/crédit)
    const journals = await this.journalRepository.find({
      where: { 
        companyId,
        date: Between(dateRange.startDate, dateRange.endDate),
        status: JournalStatus.POSTED,
      },
    });

    let balancedJournals = 0;
    for (const journal of journals) {
      if (Math.abs((journal.totalDebit || 0) - (journal.totalCredit || 0)) < 0.01) {
        balancedJournals++;
      }
    }

    return journals.length > 0 ? (balancedJournals / journals.length) * 100 : 100;
  }

  private async calculateFiscalYearCompliance(companyId: string, dateRange: { startDate: Date; endDate: Date }): Promise<number> {
    // Vérifier que toutes les écritures sont dans la bonne période fiscale
    const journalsInPeriod = await this.journalRepository.count({
      where: {
        companyId,
        date: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    const totalJournals = await this.journalRepository.count({
      where: { companyId },
    });

    return totalJournals > 0 ? (journalsInPeriod / totalJournals) * 100 : 100;
  }

  private isValidSYSCOHADACode(code: string): boolean {
    // Validation simplifiée du code SYSCOHADA
    if (!code || code.length < 2) return false;
    
    const firstDigit = code.charAt(0);
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(firstDigit);
  }
}
