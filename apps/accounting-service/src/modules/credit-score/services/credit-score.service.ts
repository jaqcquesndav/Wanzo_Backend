import { Injectable, Logger } from "@nestjs/common";
import { JournalService } from "../../journals/services/journal.service";
import { JournalType } from "../../journals/entities/journal.entity";

export interface CreditScoreResult {
  score: number;
  components: {
    transactionVolume: number;
    cashFlow: number;
    paymentRegularity: number;
    accountBalance: number;
    businessActivity: number;
  };
  metadata: {
    periodStart: Date;
    periodEnd: Date;
    calculatedAt: Date;
    transactionCount: number;
    averageBalance: number;
    volatility: number;
  };
}

@Injectable()
export class CreditScoreService {
  private readonly logger = new Logger(CreditScoreService.name);

  constructor(private journalService: JournalService) {}

  async calculateCreditScore(params: {
    companyId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<CreditScoreResult> {
    this.logger.debug(
      `Calculating credit score for company ${params.companyId}`
    );

    // Get treasury transactions
    const transactions = await this.journalService.findByAccount(
      params.companyId,
      {
        startDate: params.startDate,
        endDate: params.endDate,
        type: JournalType.BANK,
      }
    );

    // Calculate daily balances
    const balances = this.calculateDailyBalances(transactions);

    // Calculate components
    const components = {
      transactionVolume: await this.calculateTransactionVolumeScore(
        transactions
      ),
      cashFlow: await this.calculateCashFlowScore(transactions),
      paymentRegularity: await this.calculatePaymentRegularityScore(
        transactions
      ),
      accountBalance: await this.calculateAccountBalanceScore(transactions),
      businessActivity: await this.calculateBusinessActivityScore(transactions),
    };

    // Calculate final score
    const score = this.computeFinalScore(components);

    // Metadata for audit
    const metadata = {
      periodStart: params.startDate,
      periodEnd: params.endDate,
      calculatedAt: new Date(),
      transactionCount: transactions.length,
      averageBalance: this.calculateAverageBalance(balances),
      volatility: this.calculateBalanceVolatility(balances),
    };

    return {
      score,
      components,
      metadata,
    };
  }

  private async calculateTransactionVolumeScore(
    transactions: any[]
  ): Promise<number> {
    // Evaluate volume and frequency of transactions
    const monthlyVolumes = this.groupTransactionsByMonth(transactions);
    const volumeScore = this.normalizeScore(
      this.calculateVolumeConsistency(monthlyVolumes)
    );
    return volumeScore;
  }

  private async calculateCashFlowScore(transactions: any[]): Promise<number> {
    // Analyze inflows and outflows
    const inflows = transactions
      .filter((t) => t.totalDebit > 0)
      .reduce((sum, t) => sum + t.totalDebit, 0);
    const outflows = transactions
      .filter((t) => t.totalCredit > 0)
      .reduce((sum, t) => sum + t.totalCredit, 0);

    const cashFlowRatio = inflows / (outflows || 1);
    return this.normalizeScore(cashFlowRatio);
  }

  private async calculatePaymentRegularityScore(
    transactions: any[]
  ): Promise<number> {
    // Evaluate payment patterns
    const paymentPatterns = this.analyzePaymentPatterns(transactions);
    return this.normalizeScore(paymentPatterns.regularityScore);
  }

  private async calculateAccountBalanceScore(
    transactions: any[]
  ): Promise<number> {
    // Analyze account balance stability
    const balanceHistory = this.calculateDailyBalances(transactions);
    const volatility = this.calculateBalanceVolatility(balanceHistory);
    return this.normalizeScore(1 - volatility); // Lower volatility = better score
  }

  private async calculateBusinessActivityScore(
    transactions: any[]
  ): Promise<number> {
    // Evaluate business activity based on transactions
    const businessMetrics = this.analyzeBusinessActivity(transactions);
    return this.normalizeScore(businessMetrics.activityScore);
  }

  private computeFinalScore(components: Record<string, number>): number {
    // Weight according to BAD approach
    const weights = {
      transactionVolume: 0.25,
      cashFlow: 0.25,
      paymentRegularity: 0.2,
      accountBalance: 0.15,
      businessActivity: 0.15,
    };

    return Object.entries(components).reduce(
      (score, [key, value]) =>
        score + value * weights[key as keyof typeof weights],
      0
    );
  }

  private groupTransactionsByMonth(
    transactions: any[]
  ): Record<string, number> {
    return transactions.reduce((acc, tx) => {
      const month = tx.date.toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + (tx.totalDebit + tx.totalCredit);
      return acc;
    }, {});
  }

  private calculateVolumeConsistency(
    monthlyVolumes: Record<string, number>
  ): number {
    const volumes = Object.values(monthlyVolumes);
    if (volumes.length === 0) return 0;

    const mean = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const variance =
      volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      volumes.length;
    const stdDev = Math.sqrt(variance);

    return mean / (stdDev || 1); // Inverse coefficient of variation
  }

  private analyzePaymentPatterns(transactions: any[]): {
    regularityScore: number;
  } {
    // Identify regular payments and their punctuality
    const patterns = transactions.reduce(
      (acc: Record<string, { count: number; dates: Date[] }>, tx) => {
        const amount = tx.totalCredit;
        const key = `${amount}_${tx.description}`;

        if (!acc[key]) {
          acc[key] = {
            count: 0,
            dates: [],
          };
        }

        acc[key].count++;
        acc[key].dates.push(tx.date);

        return acc;
      },
      {}
    );

    // Calculate score based on regularity
    const regularityScores = Object.values(patterns).map((p) => {
      if (p.count < 2) return 0;

      const intervals: number[] = [];
      for (let i = 1; i < p.dates.length; i++) {
        intervals.push(p.dates[i].getTime() - p.dates[i - 1].getTime());
      }

      const meanInterval =
        intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, i) => sum + Math.pow(i - meanInterval, 2), 0) /
        intervals.length;

      return p.count * (1 / (1 + Math.sqrt(variance)));
    });

    return {
      regularityScore:
        regularityScores.reduce((sum, s) => sum + s, 0) /
        regularityScores.length,
    };
  }

  private calculateDailyBalances(transactions: any[]): number[] {
    const balances: number[] = [];
    let balance = 0;

    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    transactions.forEach((tx) => {
      balance += tx.totalDebit - tx.totalCredit;
      balances.push(balance);
    });

    return balances;
  }

  // Update calculateBalanceVolatility to accept Journal[]
  private calculateBalanceVolatility(transactions: any[]): number {
    const balances = transactions.map((t) => t.balance || 0);
    return this.calculateStandardDeviation(balances);
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private analyzeBusinessActivity(transactions: any[]): {
    activityScore: number;
  } {
    // Analyze diversity and regularity of business transactions
    const uniqueCounterparties = new Set(
      transactions.map((tx) => tx.description)
    ).size;
    const transactionDensity = transactions.length / 30; // Average transactions per day

    return {
      activityScore: this.normalizeScore(
        (uniqueCounterparties * transactionDensity) / 100
      ),
    };
  }

  private calculateAverageBalance(balances: number[]): number {
    return balances.reduce((sum, b) => sum + b, 0) / balances.length;
  }

  private normalizeScore(value: number): number {
    // Normalize a score between 0 and 1
    return Math.min(Math.max(value, 0), 1);
  }
}
