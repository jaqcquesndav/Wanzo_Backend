import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import { CompanyService } from '../../company/services/company.service';
import { JournalService } from '../../journals/services/journal.service';
import { AccountService } from '../../accounts/services/account.service';
import { Account, AccountType } from '../../accounts/entities/account.entity';
import { Journal, JournalStatus } from '../../journals/entities/journal.entity';
import { JournalLine } from '../../journals/entities/journal-line.entity'; // Corrected import path
import { FiscalYearService } from '../../fiscal-years/services/fiscal-year.service';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';
import { AccountingStandard } from '../../../common/enums/accounting.enum'; // Added import for AccountingStandard
import { Company } from '../../company/entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

// --- Start of Interface Definitions ---

interface ReportGenerationOptions {
  accountId?: string; // For GL filtered by account
  startDate?: Date;   // For GL period filter
  endDate?: Date;     // For GL period filter
  asOfDate?: Date;    // For Trial Balance and Balance Sheet
  periodStartDate?: Date; // For Income Stmt and Cash Flow
  periodEndDate?: Date;   // For Income Stmt and Cash Flow
  currency?: string;   // For specifying report currency
}

export interface FinancialStatementLineItem {
  name: string;
  accountCode?: string;
  amount: number;
  type?: 'detail' | 'calculation' | 'subtotal' | 'header'; // Added type
  order?: number; // Added order
}

export interface FinancialStatementCategory {
  categoryName: string;
  totalAmount: number;
  lines: FinancialStatementLineItem[]; // Corrected: items to lines
  displayOrder?: number;
  type?: 'group' | 'summary';
  order?: number;
}

// Updated FinancialStatementReport
export interface FinancialStatementReport {
  companyId: string;
  statementType: 'balance-sheet' | 'income-statement' | 'cash-flow-statement';
  accountingStandard: AccountingStandard; // Ensure AccountingStandard is imported
  fiscalYearId: string;
  generatedAt: Date;
  asOfDate?: string; // For Balance Sheet (ISO Date String)
  periodStartDate?: string; // For Income Statement & Cash Flow (ISO Date String)
  periodEndDate?: string;   // For Income Statement & Cash Flow (ISO Date String)

  // Balance Sheet specific structure
  assets?: FinancialStatementCategory[];
  liabilities?: FinancialStatementCategory[];
  equity?: FinancialStatementCategory[];
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalLiabilitiesAndEquity?: number;

  // Income Statement specific structure
  revenue?: FinancialStatementCategory[];
  costOfSales?: FinancialStatementCategory[];
  grossProfit?: number;
  operatingExpenses?: FinancialStatementCategory[];
  operatingIncome?: number; // EBIT or Operating Profit
  otherIncome?: FinancialStatementCategory[]; // e.g. Interest Income, Gain on Sale of Assets
  otherExpenses?: FinancialStatementCategory[]; // e.g. Interest Expense, Loss on Sale of Assets
  earningsBeforeTax?: number; // EBT
  incomeTaxExpense?: FinancialStatementCategory[];
  netIncome?: number; // Profit or Loss for the period

  // Cash Flow Statement specific structure (to be detailed later)
  cashFlowsFromOperatingActivities?: FinancialStatementCategory[];
  cashFlowsFromInvestingActivities?: FinancialStatementCategory[];
  cashFlowsFromFinancingActivities?: FinancialStatementCategory[];
  netIncreaseInCash?: number;
  cashAtBeginningOfPeriod?: number;
  cashAtEndOfPeriod?: number;

  currency?: string; // As per API documentation, currency should be specifiable. Assume company's base currency for now.
  notes?: string; // General notes for the report

  rawData?: any; // Keep for transparency or debugging
}


// --- Structure for Mappings ---
export interface AccountMappingConfig {
  statementLineName: string;
  accountCodes: string[];
  description?: string;
  signConvention?: 'natural' | 'inverse';
  // isTotalLine?: boolean; // Replaced by type
  calculationFormula?: string;
  accountingStandardNote?: string;
  referenceCode?: string;
  type?: 'detail' | 'calculation' | 'subtotal' | 'header'; // Added type
  order?: number; // Added order
}

export interface StatementCategoryMapping {
  categoryName: string; // Standardized to categoryName
  lines: AccountMappingConfig[];
  subCategories?: StatementCategoryMapping[];
  displayOrder?: number; // Kept as displayOrder
  description?: string;
  referenceCode?: string;
  type?: 'group' | 'summary'; // Added type
  order?: number; // Added order
}

export interface FinancialStatementMappingDefinition {
  standard: AccountingStandard; // Ensure AccountingStandard is imported
  description: string;
  version: string;
  effectiveDate?: Date;
  assets?: StatementCategoryMapping[];
  liabilities?: StatementCategoryMapping[];
  equity?: StatementCategoryMapping[];
  revenue?: StatementCategoryMapping[];
  costOfSales?: StatementCategoryMapping[];
  operatingExpenses?: StatementCategoryMapping[];
  otherIncome?: StatementCategoryMapping[];
  otherExpenses?: StatementCategoryMapping[];
  incomeTaxExpense?: StatementCategoryMapping[];
  operatingActivities?: StatementCategoryMapping[];
  investingActivities?: StatementCategoryMapping[];
  financingActivities?: StatementCategoryMapping[];
}

// --- End of New/Updated Interface Definitions ---


export interface GeneralLedgerEntry {
  date: Date;
  journalId: string;
  journalReference?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerAccountView {
  accountId: string;
  accountCode: string;
  accountName: string;
  entries: GeneralLedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
  openingBalance: number; // Balance from previous periods or start of current period
}

export interface TrialBalanceAccountLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly fiscalYearService: FiscalYearService,
    private readonly accountService: AccountService,
    private readonly journalService: JournalService,
    private readonly companyService: CompanyService, // Added companyService injection
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLogger: WinstonLogger,
  ) {}

  async generateGeneralLedger(
    companyId: string,
    fiscalYearId: string,
    options: ReportGenerationOptions = {},
  ): Promise<GeneralLedgerAccountView[] | GeneralLedgerAccountView> {
    this.logger.log(`Generating General Ledger for company ${companyId}, fiscal year ${fiscalYearId} with options: ${JSON.stringify(options)}`);

    // Fetch company to verify existence
    const company = await this.companyService.findById(companyId); // Corrected: uses injected companyService
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }

    // FiscalYearStartDate determination:
    // For a precise opening balance at the *start* of the fiscalYearId,
    // we'd ideally fetch the FiscalYear entity by fiscalYearId to get its exact startDate.
    // This is a simplified approach for now.
    let reportPeriodStartDate: Date;
    let reportPeriodEndDate: Date | undefined = options.endDate;

    const fiscalYearEntity = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearEntity) {
      throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found.`);
    }

    const actualFiscalYearStartDate = new Date(fiscalYearEntity.startDate);

    if (options.startDate) {
        reportPeriodStartDate = new Date(options.startDate);
    } else {
        reportPeriodStartDate = actualFiscalYearStartDate; // Default to fiscal year start if no specific GL period start
    }

    if (!options.endDate) {
        // If no end date for GL period, assume end of fiscal year (if known, otherwise needs logic)
        // For now, let journalService handle open-ended if endDate is undefined
        // Or, if fiscalYearEntity has an endDate, use that.
        // reportPeriodEndDate = fiscalYearEntity.endDate ? new Date(fiscalYearEntity.endDate) : undefined;
    }


    const accountFilter: any = { companyId, fiscalYearId: fiscalYearId };
    const accountsResult = options.accountId
      ? { accounts: [await this.accountService.findById(options.accountId)], total: 1, page: 1, perPage: 1 } // Assuming findById doesn't need companyId if ID is globally unique
      : await this.accountService.findAll(accountFilter);

    if (!accountsResult || !accountsResult.accounts || accountsResult.accounts.length === 0) {
      throw new NotFoundException('No accounts found for this company or selection.');
    }
    
    const actualAccounts = accountsResult.accounts;


    const results: GeneralLedgerAccountView[] = [];

    for (const account of actualAccounts) {
      if (!account) continue;

      let openingBalance = 0;
      // Opening balance is calculated up to the day *before* the reportPeriodStartDate.
      const dateForOpeningBalanceCalculation = new Date(reportPeriodStartDate);
      dateForOpeningBalanceCalculation.setDate(dateForOpeningBalanceCalculation.getDate() - 1);
       
      // Fetch opening balance
      const balanceData = await this.journalService.getAccountBalance(
        account.id,
        fiscalYearId, 
        companyId,
        dateForOpeningBalanceCalculation,
      );
      openingBalance = balanceData.balance;


      let currentBalance = openingBalance;

      const journalLines = await this.journalService.findLinesByAccountAndFilters(
        account.id,
        {
          companyId,
          fiscalYearId,
          startDate: reportPeriodStartDate, // Use GL period start
          endDate: reportPeriodEndDate,     // Use GL period end
          status: JournalStatus.POSTED,
        },
      );

      const entries: GeneralLedgerEntry[] = [];
      let totalPeriodDebit = 0;
      let totalPeriodCredit = 0;

      for (const line of journalLines) {
        if (!line.journal) {
          this.logger.warn(`Journal data missing for line ID ${line.id} on account ${account.id}. Skipping.`);
          continue;
        }
        const debit = line.debit || 0;
        const credit = line.credit || 0;
        
        currentBalance += (debit - credit); 

        entries.push({
          date: line.journal.date,
          journalId: line.journal.id,
          journalReference: line.journal.reference,
          description: line.description || line.journal.description,
          debit,
          credit,
          balance: currentBalance,
        });
        totalPeriodDebit += debit;
        totalPeriodCredit += credit;
      }

      results.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        openingBalance,
        entries,
        totalDebit: totalPeriodDebit,
        totalCredit: totalPeriodCredit,
        finalBalance: currentBalance,
      });
    }
    
    if (options.accountId) {
        const singleResult = results.find(r => r.accountId === options.accountId);
        if (!singleResult) throw new NotFoundException(`Account with ID ${options.accountId} did not yield a GL result.`);
        return singleResult;
    }
    return results;
  }

  async generateTrialBalance(
    companyId: string,
    fiscalYearId: string,
    asOfDateInput: Date, // Renamed to avoid confusion with internal asOfDate
  ): Promise<TrialBalanceAccountLine[]> {
    const asOfDate = new Date(asOfDateInput);
    this.logger.log(`Generating Trial Balance for company ${companyId}, fiscal year ${fiscalYearId} as of ${asOfDate.toISOString()}`);
    
    const fiscalYearEntityForTB = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearEntityForTB) {
      throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found for Trial Balance generation.`);
    }
    const actualFiscalYearStartDateForTB = new Date(fiscalYearEntityForTB.startDate);

    const accountsResult = await this.accountService.findAll({ companyId, fiscalYear: fiscalYearEntityForTB.code });
    if (!accountsResult || !accountsResult.accounts || accountsResult.accounts.length === 0) {
      throw new NotFoundException('No accounts found for this company.');
    }
    const actualAccountsForTB = accountsResult.accounts;

    const trialBalanceLines: TrialBalanceAccountLine[] = [];

    for (const account of actualAccountsForTB) {
      const dateForOpeningBalanceCalculation = new Date(actualFiscalYearStartDateForTB);
      dateForOpeningBalanceCalculation.setDate(dateForOpeningBalanceCalculation.getDate() - 1);

      const openingBalanceData = await this.journalService.getAccountBalance(
        account.id,
        fiscalYearId,
        companyId,
        dateForOpeningBalanceCalculation, 
      );

      let openingDebit = 0;
      let openingCredit = 0;
      if (openingBalanceData.balance !== 0) {
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          if (openingBalanceData.balance > 0) openingDebit = openingBalanceData.balance;
          else openingCredit = -openingBalanceData.balance;
        } else { 
          if (openingBalanceData.balance < 0) openingCredit = -openingBalanceData.balance;
          else openingDebit = openingBalanceData.balance;
        }
      }

      const periodMovements = await this.journalService.getAccountMovements(
        account.id,
        companyId,
        fiscalYearId, // Pass fiscalYearId for context
        actualFiscalYearStartDateForTB, // periodStartDate (Date object)
        asOfDate, // periodEndDate (Date object)
      );
      
      const periodDebit = periodMovements.totalDebit;
      const periodCredit = periodMovements.totalCredit;
      
      // Calculate final balance based on opening balance and period movements
      let finalBalance = openingBalanceData.balance + periodDebit - periodCredit;
      let calculatedClosingDebit = 0;
      let calculatedClosingCredit = 0;

      // Determine closing debit/credit based on account type and final balance sign
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          // Assets and Expenses normally have debit balances
          if (finalBalance >= 0) { // Positive or zero balance is a debit
              calculatedClosingDebit = finalBalance;
          } else { // Negative balance is a credit (e.g., contra-asset like accumulated depreciation)
              calculatedClosingCredit = -finalBalance;
          }
      } else { // LIABILITY, EQUITY, REVENUE
          // Liabilities, Equity, and Revenue normally have credit balances
          if (finalBalance <= 0) { // Negative or zero balance is a credit
              calculatedClosingCredit = -finalBalance;
          } else { // Positive balance is a debit (e.g., drawings, or a contra-liability)
              calculatedClosingDebit = finalBalance;
          }
      }

      trialBalanceLines.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        openingDebit,
        openingCredit,
        periodDebit,
        periodCredit,
        closingDebit: calculatedClosingDebit,
        closingCredit: calculatedClosingCredit,
      });
    }
    return trialBalanceLines;
  }

  async generateFinancialStatement(
    companyId: string,
    fiscalYearId: string,
    statementType: 'balance-sheet' | 'income-statement' | 'cash-flow-statement',
    // accountingStandard: AccountingStandard, // Removed: Fetched from company
    options: ReportGenerationOptions,
  ): Promise<FinancialStatementReport> {

    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }
    const accountingStandard = company.accountingStandard; // Get standard from company

    this.logger.log(
      `Generating ${statementType} for company ${companyId}, fiscal year ${fiscalYearId}, standard: ${accountingStandard}`,
    );

    // Fetch FiscalYear entity for period start/end dates if not provided in options
    const fiscalYearEntity = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearEntity) {
        throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found.`);
    }
    
    // Need 'actualAccounts' for income statement processing logic to determine account type
    // Declare actualAccounts earlier, before processCategory is defined or called.
    const accountsResultInitial = await this.accountService.findAll({ companyId, fiscalYear: fiscalYearEntity.code });
    if (!accountsResultInitial || !accountsResultInitial.accounts || accountsResultInitial.accounts.length === 0) {
      throw new NotFoundException(`No accounts found for company ${companyId} and fiscal year code ${fiscalYearEntity.code}.`);
    }
    const actualAccounts: Account[] = accountsResultInitial.accounts; // Corrected: Renamed to avoid conflict


    // 1. Get the Trial Balance (or more granular data if needed)
    const asOfDateForTB = statementType === 'balance-sheet' ? options.asOfDate : options.periodEndDate;
    if (!asOfDateForTB) {
        throw new BadRequestException('Appropriate date (asOfDate or periodEndDate) is required for financial statement generation.');
    }
    const trialBalance = await this.generateTrialBalance(companyId, fiscalYearId, asOfDateForTB);

    const reportPeriodStartDate = options.periodStartDate ? new Date(options.periodStartDate) : new Date(fiscalYearEntity.startDate);
    const reportPeriodEndDate = options.periodEndDate ? new Date(options.periodEndDate) : (fiscalYearEntity.endDate ? new Date(fiscalYearEntity.endDate) : new Date(asOfDateForTB)); // Fallback for IS/CF if no explicit period end
    const reportAsOfDate = statementType === 'balance-sheet' ? new Date(asOfDateForTB) : reportPeriodEndDate;


    // 2. Define Account Mappings for the given accountingStandard
    const mappings = this.getFinancialStatementMappings(accountingStandard, statementType); // Corrected: Call to restored method
    if (!mappings) {
      throw new InternalServerErrorException(
        `Account mappings not found for ${accountingStandard} and ${statementType}.`,
      );
    }

    // 3. Aggregate data based on mappings
    const reportData: FinancialStatementReport = {
      companyId,
      statementType,
      accountingStandard,
      fiscalYearId,
      generatedAt: new Date(),
      asOfDate: statementType === 'balance-sheet' ? reportAsOfDate.toISOString() : undefined,
      periodStartDate: statementType !== 'balance-sheet' ? reportPeriodStartDate.toISOString() : undefined,
      periodEndDate: statementType !== 'balance-sheet' ? reportPeriodEndDate.toISOString() : undefined,
      currency: options.currency,
    };
    
    // Redundant fetches and assignments for actualAccounts were removed in the previous step, keeping it clean here.

    // Helper function to process categories and lines
    const processCategory = (
        currentMappingCategories: StatementCategoryMapping[] | undefined,
        currentTrialBalance: TrialBalanceAccountLine[],
        isIncomeStatement: boolean = false,
        accountsList: Account[] // Passed in
      ): { categories: FinancialStatementCategory[], total: number } => {
        if (!currentMappingCategories) return { categories: [], total: 0 };

        let overallTotal = 0;
        const resultCategories: FinancialStatementCategory[] = [];

        for (const mapCategory of currentMappingCategories) {
            let categoryTotal = 0;
            const categoryLineItems: FinancialStatementLineItem[] = []; 
            
            this.logger.debug(`Processing category: ${mapCategory.categoryName} (${mapCategory.referenceCode || 'no ref code'})`);

            if (mapCategory.lines) {
                for (const mapLine of mapCategory.lines) {
                    let lineAmount = 0;
                    let accountsFound = 0;
                    const contributingAccounts: string[] = [];
                    
                    for (const accCode of mapLine.accountCodes) {
                        const tbLine = currentTrialBalance.find((l: TrialBalanceAccountLine) => l.accountCode === accCode || 
                                                                (accCode.endsWith('*') && l.accountCode.startsWith(accCode.slice(0, -1))));
                        if (tbLine) {
                            accountsFound++;
                            contributingAccounts.push(tbLine.accountCode);
                            
                            const accountEntity = accountsList.find(a => a.code === tbLine.accountCode);
                            
                            if (!accountEntity && mapLine.accountCodes.length > 0 && !accCode.endsWith('*')) {
                                this.logger.warn(`Account entity not found for specific code ${tbLine.accountCode} in trial balance. This might affect calculations for line "${mapLine.statementLineName}".`);
                            }
                            
                            const accountType = accountEntity?.type;
                            
                            if (isIncomeStatement) {
                                let movement = tbLine.periodDebit - tbLine.periodCredit;
                                if (accountType === AccountType.REVENUE || accountType === AccountType.LIABILITY || accountType === AccountType.EQUITY) {
                                    movement = -movement;
                                }
                                if (mapLine.signConvention === 'inverse') {
                                    lineAmount -= movement;
                                } else {
                                    lineAmount += movement;
                                }
                            } else { // Balance sheet
                                let balance = tbLine.closingDebit - tbLine.closingCredit;
                                if (accountType === AccountType.LIABILITY || accountType === AccountType.EQUITY || accountType === AccountType.REVENUE) {
                                   balance = -balance;
                                }
                                if (mapLine.signConvention === 'inverse') {
                                    lineAmount -= balance;
                                } else {
                                    lineAmount += balance;
                                }
                            }
                        }
                    }
                    
                    if (mapLine.calculationFormula && (mapLine.type === 'calculation' || mapLine.type === 'subtotal')) { // Adjusted condition
                        this.logger.log(`Custom calculation for ${mapLine.statementLineName} using formula: ${mapLine.calculationFormula}`);
                    }
                    
                    if (accountsFound > 0 || mapLine.type === 'header' || mapLine.type === 'subtotal' || mapLine.type === 'calculation') { // Adjusted condition
                        const lineItem: FinancialStatementLineItem = { 
                            name: mapLine.statementLineName, 
                            amount: lineAmount,
                            accountCode: mapLine.accountCodes.length === 1 ? mapLine.accountCodes[0] : undefined,
                            type: mapLine.type || 'detail',
                            order: mapLine.order
                        };
                        
                        if (accountsFound > 0) {
                            this.logger.debug(`Line ${mapLine.statementLineName}: ${lineAmount} (from ${accountsFound} accounts: ${contributingAccounts.join(', ')})`);
                        } else if (mapLine.accountCodes.length > 0 && mapLine.type !== 'header' && mapLine.type !== 'subtotal' && mapLine.type !== 'calculation') { // Adjusted condition
                            this.logger.warn(`No accounts found for line ${mapLine.statementLineName} with codes: ${mapLine.accountCodes.join(', ')}. Amount will be 0.`);
                        }
                        
                        categoryLineItems.push(lineItem);
                        categoryTotal += lineItem.amount;
                    }
                }
            }
            
            if (categoryLineItems.length > 0) {
                resultCategories.push({
                    categoryName: mapCategory.categoryName,
                    totalAmount: categoryTotal,
                    lines: categoryLineItems,
                    displayOrder: mapCategory.displayOrder,
                    type: mapCategory.type,
                    order: mapCategory.order,
                });
            }
        }
        
        resultCategories.sort((a, b) => (a.order ?? a.displayOrder ?? Infinity) - (b.order ?? b.displayOrder ?? Infinity));
        return { categories: resultCategories, total: overallTotal };
    };
    

    if (statementType === 'balance-sheet') {
      // Assets, Liabilities, and Equity
      const { categories: assetCategories, total: assetTotal } = processCategory(mappings.assets, trialBalance, false, actualAccounts);
      const { categories: liabilityCategories, total: liabilityTotal } = processCategory(mappings.liabilities, trialBalance, false, actualAccounts);
      const { categories: equityCategories, total: equityTotal } = processCategory(mappings.equity, trialBalance, false, actualAccounts);
      
      reportData.assets = assetCategories;
      reportData.liabilities = liabilityCategories;
      reportData.equity = equityCategories;
      reportData.totalAssets = assetTotal;
      reportData.totalLiabilities = liabilityTotal;
      reportData.totalEquity = equityTotal;
      reportData.totalLiabilitiesAndEquity = liabilityTotal + equityTotal; // Typically, Assets = Liabilities + Equity
    } else if (statementType === 'income-statement') {
      // Revenue, Expenses, and Net Income
      const { categories: revenueCategories, total: revenueTotal } = processCategory(mappings.revenue, trialBalance, true, actualAccounts);
      const { categories: costOfSalesCategories, total: costOfSalesTotal } = processCategory(mappings.costOfSales, trialBalance, true, actualAccounts);
      const { categories: operatingExpensesCategories, total: operatingExpensesTotal } = processCategory(mappings.operatingExpenses, trialBalance, true, actualAccounts);
      const { categories: otherIncomeCategories, total: otherIncomeTotal } = processCategory(mappings.otherIncome, trialBalance, true, actualAccounts);
      const { categories: otherExpensesCategories, total: otherExpensesTotal } = processCategory(mappings.otherExpenses, trialBalance, true, actualAccounts);
      const { categories: incomeTaxExpenseCategories, total: incomeTaxExpenseTotal } = processCategory(mappings.incomeTaxExpense, trialBalance, true, actualAccounts);
      
      reportData.revenue = revenueCategories;
      reportData.costOfSales = costOfSalesCategories;
      reportData.operatingExpenses = operatingExpensesCategories;
      reportData.otherIncome = otherIncomeCategories;
      reportData.otherExpenses = otherExpensesCategories;
      reportData.incomeTaxExpense = incomeTaxExpenseCategories;
      
      // Calculate derived values
      reportData.grossProfit = revenueTotal - costOfSalesTotal;
      reportData.operatingIncome = reportData.grossProfit - operatingExpensesTotal;
      reportData.earningsBeforeTax = reportData.operatingIncome + otherIncomeTotal - otherExpensesTotal;
      reportData.netIncome = reportData.earningsBeforeTax - incomeTaxExpenseTotal;
    } else if (statementType === 'cash-flow-statement') {
      // Cash Flow categories to be defined
      const { categories: operatingActivities, total: operatingActivitiesTotal } = processCategory(mappings.operatingActivities, trialBalance, false, actualAccounts);
      const { categories: investingActivities, total: investingActivitiesTotal } = processCategory(mappings.investingActivities, trialBalance, false, actualAccounts);
      const { categories: financingActivities, total: financingActivitiesTotal } = processCategory(mappings.financingActivities, trialBalance, false, actualAccounts);
      
      reportData.cashFlowsFromOperatingActivities = operatingActivities;
      reportData.cashFlowsFromInvestingActivities = investingActivities;
      reportData.cashFlowsFromFinancingActivities = financingActivities;
      reportData.netIncreaseInCash = operatingActivitiesTotal + investingActivitiesTotal + financingActivitiesTotal;
    }

    reportData.rawData = { trialBalanceCount: trialBalance.length, mappingsUsedStandard: mappings?.standard, fiscalYearCode: fiscalYearEntity.code };
    return reportData;
  }

  async getTrialBalance(
    companyId: string,
    fiscalYearId: string,
    asOfDateInput: Date, // Renamed to avoid confusion with internal asOfDate
  ): Promise<TrialBalanceAccountLine[]> {
    const asOfDate = new Date(asOfDateInput);
    this.logger.log(`Fetching Trial Balance for company ${companyId}, fiscal year ${fiscalYearId} as of ${asOfDate.toISOString()}`);
    
    const fiscalYearEntityForTB = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearEntityForTB) {
      throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found for Trial Balance fetching.`);
    }
    const actualFiscalYearStartDateForTB = new Date(fiscalYearEntityForTB.startDate);

    const accountsResult = await this.accountService.findAll({ companyId, fiscalYear: fiscalYearEntityForTB.code });
    if (!accountsResult || !accountsResult.accounts || accountsResult.accounts.length === 0) {
      throw new NotFoundException('No accounts found for this company.');
    }
    const actualAccountsForTB = accountsResult.accounts;

    const trialBalanceLines: TrialBalanceAccountLine[] = [];

    for (const account of actualAccountsForTB) {
      const dateForOpeningBalanceCalculation = new Date(actualFiscalYearStartDateForTB);
      dateForOpeningBalanceCalculation.setDate(dateForOpeningBalanceCalculation.getDate() - 1);

      const openingBalanceData = await this.journalService.getAccountBalance(
        account.id,
        fiscalYearId,
        companyId,
        dateForOpeningBalanceCalculation, 
      );

      let openingDebit = 0;
      let openingCredit = 0;
      if (openingBalanceData.balance !== 0) {
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          if (openingBalanceData.balance > 0) openingDebit = openingBalanceData.balance;
          else openingCredit = -openingBalanceData.balance;
        } else { 
          if (openingBalanceData.balance < 0) openingCredit = -openingBalanceData.balance;
          else openingDebit = openingBalanceData.balance;
        }
      }

      const periodMovements = await this.journalService.getAccountMovements(
        account.id,
        companyId,
        fiscalYearId, // Pass fiscalYearId for context
        actualFiscalYearStartDateForTB, // periodStartDate (Date object)
        asOfDate, // periodEndDate (Date object)
      );
      
      const periodDebit = periodMovements.totalDebit;
      const periodCredit = periodMovements.totalCredit;
      
      // Calculate final balance based on opening balance and period movements
      let finalBalance = openingBalanceData.balance + periodDebit - periodCredit;
      let calculatedClosingDebit = 0;
      let calculatedClosingCredit = 0;

      // Determine closing debit/credit based on account type and final balance sign
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          // Assets and Expenses normally have debit balances
          if (finalBalance >= 0) { // Positive or zero balance is a debit
              calculatedClosingDebit = finalBalance;
          } else { // Negative balance is a credit (e.g., contra-asset like accumulated depreciation)
              calculatedClosingCredit = -finalBalance;
          }
      } else { // LIABILITY, EQUITY, REVENUE
          // Liabilities, Equity, and Revenue normally have credit balances
          if (finalBalance <= 0) { // Negative or zero balance is a credit
              calculatedClosingCredit = -finalBalance;
          } else { // Positive balance is a debit (e.g., drawings, or a contra-liability)
              calculatedClosingDebit = finalBalance;
          }
      }

      trialBalanceLines.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        openingDebit,
        openingCredit,
        periodDebit,
        periodCredit,
        closingDebit: calculatedClosingDebit,
        closingCredit: calculatedClosingCredit,
      });
    }
    return trialBalanceLines;
  }

  // Placeholder for the missing method - IMPLEMENTATION NEEDED
  private getFinancialStatementMappings(accountingStandard: AccountingStandard, statementType: string): FinancialStatementMappingDefinition | null {
    this.logger.warn(`getFinancialStatementMappings called with ${accountingStandard}, ${statementType}. Placeholder implementation.`);
    // This is a placeholder. You need to implement this method based on your application's logic for retrieving financial statement mappings.
    // It should return an object conforming to the FinancialStatementMappingDefinition interface.

    const baseMapping: FinancialStatementMappingDefinition = {
        standard: accountingStandard,
        description: `Placeholder mapping for ${accountingStandard} - ${statementType}`,
        version: "1.0",
        assets: [],
        liabilities: [],
        equity: [],
        revenue: [],
        costOfSales: [],
        operatingExpenses: [],
        otherIncome: [],
        otherExpenses: [],
        incomeTaxExpense: [],
        operatingActivities: [],
        investingActivities: [],
        financingActivities: [],
    };

    if (statementType === 'income-statement') {
        baseMapping.revenue = [{ 
            categoryName: 'Revenue', 
            lines: [{ statementLineName: 'Total Revenue', accountCodes: ['4*'], type: 'header', signConvention: 'natural', order: 1 }],
            order: 1,
            type: 'group'
        }];
        baseMapping.costOfSales = [{ 
            categoryName: 'Cost of Sales', 
            lines: [{ statementLineName: 'Total Cost of Sales', accountCodes: ['5*'], type: 'header', signConvention: 'natural', order: 1 }],
            order: 2,
            type: 'group'
        }];
        // Add other income statement categories as needed
    } else if (statementType === 'balance-sheet') {
        baseMapping.assets = [{
            categoryName: 'Current Assets',
            lines: [{ statementLineName: 'Cash and Cash Equivalents', accountCodes: ['101*'], type: 'detail', order: 1 }],
            order: 1,
            type: 'group'
        }];
        // Add other balance sheet categories
    }
    // ... other statement types
    
    return baseMapping;
  }
}
