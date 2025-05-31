import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AccountingFramework } from '../enums/accounting.enum';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly accountingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountingServiceUrl = this.configService.get<string>('ACCOUNTING_SERVICE_URL', 'http://localhost:3003');
  }

  async getBalanceSheet(
    companyId: string,
    fiscalYear: string,
    asOfDate: Date,
    framework: AccountingFramework = AccountingFramework.SYSCOHADA,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/financial-statements/balance-sheet`, {
          params: {
            fiscal_year: fiscalYear,
            as_of_date: asOfDate.toISOString(),
            framework,
          },
          headers: {
            'Company-ID': companyId,
          },
        })
      );

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching balance sheet: ${errorMessage}`);
      throw error;
    }
  }

  async getIncomeStatement(
    companyId: string,
    fiscalYear: string,
    startDate: Date,
    endDate: Date,
    framework: AccountingFramework = AccountingFramework.SYSCOHADA,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/financial-statements/income-statement`, {
          params: {
            fiscal_year: fiscalYear,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            framework,
          },
          headers: {
            'Company-ID': companyId,
          },
        })
      );

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching income statement: ${errorMessage}`);
      throw error;
    }
  }

  async getCashFlowStatement(
    companyId: string,
    fiscalYear: string,
    startDate: Date,
    endDate: Date,
    framework: AccountingFramework = AccountingFramework.SYSCOHADA,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/financial-statements/cash-flow`, {
          params: {
            fiscal_year: fiscalYear,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            framework,
          },
          headers: {
            'Company-ID': companyId,
          },
        })
      );

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching cash flow statement: ${errorMessage}`);
      throw error;
    }
  }

  async getTrialBalance(
    companyId: string,
    fiscalYear: string,
    asOfDate: Date,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/financial-statements/trial-balance`, {
          params: {
            fiscal_year: fiscalYear,
            as_of_date: asOfDate.toISOString(),
          },
          headers: {
            'Company-ID': companyId,
          },
        })
      );

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching trial balance: ${errorMessage}`);
      throw error;
    }
  }

  async getGeneralLedger(
    companyId: string,
    fiscalYear: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/financial-statements/general-ledger`, {
          params: {
            fiscal_year: fiscalYear,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          },
          headers: {
            'Company-ID': companyId,
          },
        })
      );

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching general ledger: ${errorMessage}`);
      throw error;
    }
  }

  async getFinancialRatios(
    companyId: string,
    fiscalYear: string,
    asOfDate: Date,
  ): Promise<any> {
    const balanceSheet = await this.getBalanceSheet(companyId, fiscalYear, asOfDate);
    const incomeStatement = await this.getIncomeStatement(
      companyId,
      fiscalYear,
      new Date(parseInt(fiscalYear), 0, 1),
      asOfDate,
    );

    // Calculate financial ratios
    return {
      liquidity: {
        currentRatio: this.calculateCurrentRatio(balanceSheet),
        quickRatio: this.calculateQuickRatio(balanceSheet),
        cashRatio: this.calculateCashRatio(balanceSheet),
      },
      solvency: {
        debtToEquity: this.calculateDebtToEquity(balanceSheet),
        debtToAssets: this.calculateDebtToAssets(balanceSheet),
        interestCoverage: this.calculateInterestCoverage(incomeStatement),
      },
      profitability: {
        grossMargin: this.calculateGrossMargin(incomeStatement),
        operatingMargin: this.calculateOperatingMargin(incomeStatement),
        netMargin: this.calculateNetMargin(incomeStatement),
        roe: this.calculateROE(incomeStatement, balanceSheet),
        roa: this.calculateROA(incomeStatement, balanceSheet),
      },
      efficiency: {
        assetTurnover: this.calculateAssetTurnover(incomeStatement, balanceSheet),
        inventoryTurnover: this.calculateInventoryTurnover(incomeStatement, balanceSheet),
        receivablesTurnover: this.calculateReceivablesTurnover(incomeStatement, balanceSheet),
      },
    };
  }

  private calculateCurrentRatio(balanceSheet: any): number {
    return balanceSheet.currentAssets / balanceSheet.currentLiabilities;
  }

  private calculateQuickRatio(balanceSheet: any): number {
    return (balanceSheet.currentAssets - balanceSheet.inventory) / balanceSheet.currentLiabilities;
  }

  private calculateCashRatio(balanceSheet: any): number {
    return balanceSheet.cash / balanceSheet.currentLiabilities;
  }

  private calculateDebtToEquity(balanceSheet: any): number {
    return balanceSheet.totalLiabilities / balanceSheet.totalEquity;
  }

  private calculateDebtToAssets(balanceSheet: any): number {
    return balanceSheet.totalLiabilities / balanceSheet.totalAssets;
  }

  private calculateInterestCoverage(incomeStatement: any): number {
    return incomeStatement.operatingIncome / incomeStatement.interestExpense;
  }

  private calculateGrossMargin(incomeStatement: any): number {
    return (incomeStatement.grossProfit / incomeStatement.revenue) * 100;
  }

  private calculateOperatingMargin(incomeStatement: any): number {
    return (incomeStatement.operatingIncome / incomeStatement.revenue) * 100;
  }

  private calculateNetMargin(incomeStatement: any): number {
    return (incomeStatement.netIncome / incomeStatement.revenue) * 100;
  }

  private calculateROE(incomeStatement: any, balanceSheet: any): number {
    return (incomeStatement.netIncome / balanceSheet.totalEquity) * 100;
  }

  private calculateROA(incomeStatement: any, balanceSheet: any): number {
    return (incomeStatement.netIncome / balanceSheet.totalAssets) * 100;
  }

  private calculateAssetTurnover(incomeStatement: any, balanceSheet: any): number {
    return incomeStatement.revenue / balanceSheet.totalAssets;
  }

  private calculateInventoryTurnover(incomeStatement: any, balanceSheet: any): number {
    return incomeStatement.costOfGoodsSold / balanceSheet.inventory;
  }

  private calculateReceivablesTurnover(incomeStatement: any, balanceSheet: any): number {
    return incomeStatement.revenue / balanceSheet.accountsReceivable;
  }
}