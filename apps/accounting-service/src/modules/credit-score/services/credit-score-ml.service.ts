import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CalculateCreditScoreDto, CreditScoreResponseDto } from '../dtos/credit-score.dto';

@Injectable()
export class CreditScoreMLService {
  private readonly logger = new Logger(CreditScoreMLService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:5000');
  }

  async predictCreditScore(data: CalculateCreditScoreDto): Promise<CreditScoreResponseDto> {
    try {
      // Prepare features for the XGBoost model
      const features = await this.prepareFeatures(data);

      // Call external ML service
      const response = await firstValueFrom(
        this.httpService.post(`${this.mlServiceUrl}/predict`, features)
      );

      // Transform prediction
      return this.transformPrediction(response.data);
    } catch (error) {
      this.logger.error(`Error predicting credit score: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async prepareFeatures(data: CalculateCreditScoreDto): Promise<Record<string, any>> {
    // Calculer les agrégats mensuels
    const monthlyAggregates = this.calculateMonthlyAggregates(data);

    // Calculer les différences premières
    const firstDifferences = this.calculateFirstDifferences(monthlyAggregates);

    // Calculer les fréquences d'opération
    const operationFrequencies = this.calculateOperationFrequencies(data);

    // Standardiser les données
    const standardizedMetrics = this.standardizeMetrics(data);

    // Calculer les mesures de croissance et volatilité
    const growthAndVolatility = this.calculateGrowthAndVolatility(monthlyAggregates);

    return {
      monthly_aggregates: monthlyAggregates,
      first_differences: firstDifferences,
      operation_frequencies: operationFrequencies,
      standardized_metrics: standardizedMetrics,
      growth_and_volatility: growthAndVolatility,
      business_context: data.businessContext || {},
    };
  }

  private calculateMonthlyAggregates(data: CalculateCreditScoreDto): Record<string, any> {
    const monthlyData: Record<string, any> = {};

    // Agréger les flux entrants par catégorie
    const inflows = {
      sales: this.aggregateTransactionsByMonth(data.cashInflows.sales),
      bankTransfers: this.aggregateTransactionsByMonth(data.cashInflows.bankTransfers),
      investments: this.aggregateTransactionsByMonth(data.cashInflows.investments),
      financing: this.aggregateTransactionsByMonth(data.cashInflows.financing),
    };

    // Agréger les flux sortants par catégorie
    const outflows = {
      costOfGoods: this.aggregateTransactionsByMonth(data.cashOutflows.costOfGoods),
      variableCosts: this.aggregateTransactionsByMonth(data.cashOutflows.variableCosts),
      fixedCosts: this.aggregateTransactionsByMonth(data.cashOutflows.fixedCosts),
      investmentFinancing: this.aggregateTransactionsByMonth(data.cashOutflows.investmentFinancing),
    };

    // Calculer les totaux mensuels
    const months = this.getMonthsBetweenDates(data.startDate, data.endDate);
    months.forEach(month => {
      monthlyData[month] = {
        total_inflows: this.sumObjectValues(inflows, month),
        total_outflows: this.sumObjectValues(outflows, month),
        net_cash_flow: this.sumObjectValues(inflows, month) - this.sumObjectValues(outflows, month),
        average_balance: data.cashBalance.monthlyAverage,
        inflows_detail: {
          sales: inflows.sales[month] || 0,
          bankTransfers: inflows.bankTransfers[month] || 0,
          investments: inflows.investments[month] || 0,
          financing: inflows.financing[month] || 0,
        },
        outflows_detail: {
          costOfGoods: outflows.costOfGoods[month] || 0,
          variableCosts: outflows.variableCosts[month] || 0,
          fixedCosts: outflows.fixedCosts[month] || 0,
          investmentFinancing: outflows.investmentFinancing[month] || 0,
        },
      };
    });

    return monthlyData;
  }

  private calculateFirstDifferences(monthlyData: Record<string, any>): Record<string, any> {
    const differences: Record<string, any> = {};
    const months = Object.keys(monthlyData).sort();

    for (let i = 1; i < months.length; i++) {
      const currentMonth = months[i];
      const previousMonth = months[i - 1];

      differences[currentMonth] = {
        inflows_diff: monthlyData[currentMonth].total_inflows - monthlyData[previousMonth].total_inflows,
        outflows_diff: monthlyData[currentMonth].total_outflows - monthlyData[previousMonth].total_outflows,
        net_flow_diff: monthlyData[currentMonth].net_cash_flow - monthlyData[previousMonth].net_cash_flow,
        balance_diff: monthlyData[currentMonth].average_balance - monthlyData[previousMonth].average_balance,
      };
    }

    return differences;
  }

  private calculateOperationFrequencies(data: CalculateCreditScoreDto): Record<string, number> {
    return {
      sales_frequency: data.cashInflows.sales.length,
      bank_transfers_frequency: data.cashInflows.bankTransfers.length,
      investments_frequency: data.cashInflows.investments.length,
      financing_frequency: data.cashInflows.financing.length,
      cost_of_goods_frequency: data.cashOutflows.costOfGoods.length,
      variable_costs_frequency: data.cashOutflows.variableCosts.length,
      fixed_costs_frequency: data.cashOutflows.fixedCosts.length,
      investment_financing_frequency: data.cashOutflows.investmentFinancing.length,
    };
  }

  private standardizeMetrics(data: CalculateCreditScoreDto): Record<string, number> {
    const { financialMetrics } = data;
    return {
      inflows_to_revenue: this.calculateTotalInflows(data) / financialMetrics.revenue,
      outflows_to_revenue: this.calculateTotalOutflows(data) / financialMetrics.revenue,
      balance_to_assets: data.cashBalance.monthlyAverage / financialMetrics.totalAssets,
      cash_flow_to_debt: this.calculateNetCashFlow(data) / financialMetrics.outstandingLoans,
      current_ratio: financialMetrics.currentRatio,
      quick_ratio: financialMetrics.quickRatio,
      debt_to_equity: financialMetrics.debtToEquity,
      operating_margin: financialMetrics.operatingMargin,
    };
  }

  private calculateGrowthAndVolatility(monthlyData: Record<string, any>): Record<string, number> {
    const months = Object.keys(monthlyData).sort();
    const firstMonth = monthlyData[months[0]];
    const lastMonth = monthlyData[months[months.length - 1]];

    // Calculer les taux de croissance
    const inflowsGrowth = (lastMonth.total_inflows - firstMonth.total_inflows) / firstMonth.total_inflows;
    const outflowsGrowth = (lastMonth.total_outflows - firstMonth.total_outflows) / firstMonth.total_outflows;
    const balanceGrowth = (lastMonth.average_balance - firstMonth.average_balance) / firstMonth.average_balance;

    // Calculer les volatilités
    const inflowsVolatility = this.calculateVolatility(months.map(m => monthlyData[m].total_inflows));
    const outflowsVolatility = this.calculateVolatility(months.map(m => monthlyData[m].total_outflows));
    const balanceVolatility = this.calculateVolatility(months.map(m => monthlyData[m].average_balance));

    return {
      inflows_growth: inflowsGrowth,
      outflows_growth: outflowsGrowth,
      balance_growth: balanceGrowth,
      inflows_volatility: inflowsVolatility,
      outflows_volatility: outflowsVolatility,
      balance_volatility: balanceVolatility,
    };
  }

  private aggregateTransactionsByMonth(transactions: any[]): Record<string, number> {
    const monthly: Record<string, number> = {};
    transactions.forEach(tx => {
      const month = new Date(tx.date).toISOString().slice(0, 7);
      monthly[month] = (monthly[month] || 0) + tx.amount;
    });
    return monthly;
  }

  private getMonthsBetweenDates(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      months.push(currentDate.toISOString().slice(0, 7));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  }

  private sumObjectValues(obj: Record<string, Record<string, number>>, key: string): number {
    return Object.values(obj).reduce((sum, category) => sum + (category[key] || 0), 0);
  }

  private calculateTotalInflows(data: CalculateCreditScoreDto): number {
    return [
      ...data.cashInflows.sales,
      ...data.cashInflows.bankTransfers,
      ...data.cashInflows.investments,
      ...data.cashInflows.financing,
    ].reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateTotalOutflows(data: CalculateCreditScoreDto): number {
    return [
      ...data.cashOutflows.costOfGoods,
      ...data.cashOutflows.variableCosts,
      ...data.cashOutflows.fixedCosts,
      ...data.cashOutflows.investmentFinancing,
    ].reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateNetCashFlow(data: CalculateCreditScoreDto): number {
    return this.calculateTotalInflows(data) - this.calculateTotalOutflows(data);
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  private transformPrediction(mlResponse: any): CreditScoreResponseDto {
    return {
      score: mlResponse.score,
      components: {
        cashFlowQuality: mlResponse.component_scores.cash_flow_quality || 0,
        businessStability: mlResponse.component_scores.business_stability || 0,
        financialHealth: mlResponse.component_scores.financial_health || 0,
        paymentBehavior: mlResponse.component_scores.payment_behavior || 0,
        growthTrend: mlResponse.component_scores.growth_trend || 0,
      },
      riskAssessment: {
        level: mlResponse.risk_level,
        factors: mlResponse.risk_factors,
        recommendations: mlResponse.recommendations,
      },
      metadata: {
        modelVersion: mlResponse.model_version,
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        confidenceScore: mlResponse.confidence_score,
        dataQualityScore: mlResponse.data_quality_score,
      },
    };
  }
}
