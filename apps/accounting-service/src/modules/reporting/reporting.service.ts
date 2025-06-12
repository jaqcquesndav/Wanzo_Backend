import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CompanyService } from '../company/services/company.service';
import { JournalService } from '../journals/services/journal.service';
import { AccountService } from '../accounts/services/account.service';
import { AccountingStandard } from '../../common/enums/accounting.enum';
import { Account, AccountType } from '../accounts/entities/account.entity'; // Modified import
import { Journal, JournalLine, JournalStatus } from '../journals/entities/journal.entity';
import { FiscalYearService } from '../fiscal-years/services/fiscal-year.service'; // Added import
import { FiscalYear } from '../fiscal-years/entities/fiscal-year.entity'; // Added import

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
  name: string; // e.g., "Cash and cash equivalents", "Sales Revenue"
  accountCode?: string; // Optional: if it maps directly to one account or for reference
  amount: number;
  // Optional: for notes or further breakdown if not a direct sum
  // details?: FinancialStatementLineItem[]; // Keep it simple for now
}

export interface FinancialStatementCategory {
  categoryName: string; // e.g., "Current Assets", "Operating Revenue"
  totalAmount: number;
  items: (FinancialStatementLineItem | FinancialStatementCategory)[]; // Allows for nested categories/items
  displayOrder?: number;
}

// Updated FinancialStatementReport
export interface FinancialStatementReport {
  companyId: string;
  statementType: 'balance-sheet' | 'income-statement' | 'cash-flow-statement';
  accountingStandard: AccountingStandard;
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
  statementLineName: string; // e.g., "Cash and Cash Equivalents"
  accountCodes: string[];    // Accounts that sum up to this line
  description?: string;      // Description of what this line represents for accounting experts
  signConvention?: 'natural' | 'inverse'; // Whether to use the natural balance of the account or invert it
  isTotalLine?: boolean;     // Whether this line is a subtotal or total
  calculationFormula?: string; // Optional: For complex lines with calculations, e.g., "SUM(X,Y)" or "X-Y"
  accountingStandardNote?: string; // Optional: Specific note related to accounting standards
  referenceCode?: string;    // Optional: Reference code in the standard (e.g., SYSCOHADA reference)
}

export interface StatementCategoryMapping {
  categoryName: string;
  lines: AccountMappingConfig[];
  subCategories?: StatementCategoryMapping[]; // For nested categories
  displayOrder?: number;
  description?: string;      // Description of what this category represents
  referenceCode?: string;    // Reference code in the accounting standard
}

export interface FinancialStatementMappingDefinition {
  // Metadata
  standard: AccountingStandard;
  description: string;
  version: string;
  effectiveDate?: Date;
  
  // Balance Sheet
  assets: StatementCategoryMapping[];
  liabilities: StatementCategoryMapping[];
  equity: StatementCategoryMapping[];

  // Income Statement
  revenue: StatementCategoryMapping[];
  costOfSales: StatementCategoryMapping[];
  operatingExpenses: StatementCategoryMapping[];
  otherIncome?: StatementCategoryMapping[];
  otherExpenses?: StatementCategoryMapping[];
  incomeTaxExpense?: StatementCategoryMapping[];
  
  // Cash Flow Statement
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
    private readonly companyService: CompanyService,
    private readonly journalService: JournalService,
    private readonly accountService: AccountService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  async generateGeneralLedger(
    companyId: string,
    fiscalYearId: string,
    options: ReportGenerationOptions = {},
  ): Promise<GeneralLedgerAccountView[] | GeneralLedgerAccountView> {
    this.logger.log(`Generating General Ledger for company ${companyId}, fiscal year ${fiscalYearId} with options: ${JSON.stringify(options)}`);

    // Fetch company to verify existence
    const company = await this.companyService.findById(companyId);
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
    
    const fiscalYearEntity = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearEntity) {
      throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found for Trial Balance generation.`);
    }
    const actualFiscalYearStartDate = new Date(fiscalYearEntity.startDate);

    // Use the fiscalYearEntity.code for filtering accounts
    const accountsResult = await this.accountService.findAll({ companyId, fiscalYear: fiscalYearEntity.code });
    if (!accountsResult || !accountsResult.accounts || accountsResult.accounts.length === 0) {
      throw new NotFoundException('No accounts found for this company.');
    }
    const actualAccounts = accountsResult.accounts;

    const trialBalanceLines: TrialBalanceAccountLine[] = [];

    for (const account of actualAccounts) {
      // Opening Balance (as of start of fiscalYearId)
      // Pass undefined for asOfDate to getAccountBalance to signify start of the fiscal year.
      const fiscalYearEntity = await this.fiscalYearService.findById(fiscalYearId);
      if (!fiscalYearEntity) {
        throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found for account ${account.id}.`);
      }
      const actualFiscalYearStartDate = new Date(fiscalYearEntity.startDate);

      // Opening balance is calculated up to the day *before* the actualFiscalYearStartDate.
      const dateForOpeningBalanceCalculation = new Date(actualFiscalYearStartDate);
      dateForOpeningBalanceCalculation.setDate(dateForOpeningBalanceCalculation.getDate() - 1);

      const openingBalanceData = await this.journalService.getAccountBalance(
        account.id,
        fiscalYearId,
        companyId,
        dateForOpeningBalanceCalculation, 
      );
      // This interpretation of opening balance might need refinement.
      // If fiscalYearId implies a start date, getAccountBalance should calculate up to the day *before* that start date.
      // For now, we assume getAccountBalance(..., undefined) gives balance at T-1 of fiscalYearId start.

      let openingDebit = 0;
      let openingCredit = 0;
      if (openingBalanceData.balance !== 0) {
        // Determine if debit or credit based on account type's natural balance
        // Assets & Expenses are typically debit balances
        // Liabilities, Equity & Revenue are typically credit balances
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          if (openingBalanceData.balance > 0) openingDebit = openingBalanceData.balance;
          else openingCredit = -openingBalanceData.balance; // Contra-asset/expense or error
        } else { // LIABILITY, EQUITY, REVENUE
          if (openingBalanceData.balance < 0) openingCredit = -openingBalanceData.balance;
          else openingDebit = openingBalanceData.balance; // Contra-liability/equity/revenue or error
        }
      }

      // Period Movements (from start of fiscalYearId to asOfDate)
      // Need the actual start date of the fiscal year for periodMovements.
      // This is a simplification; a robust solution would fetch FiscalYear entity.
      // Assuming for now that journalService.getAccountMovements can infer start of FY from fiscalYearId if startDate is null.
      // Or, we need to fetch the fiscal year entity to get its start date.
      // Let's assume a placeholder for fiscalYearStartDate for now.
      // A better approach: getAccountMovements should take fiscalYearId and calculate movements *within* that year up to asOfDate.
      
      // Fetch the fiscal year entity to get its actual start date
      // This requires a FiscalYearService. For now, we'll pass a conceptual start.
      // const fiscalYearEntity = await this.fiscalYearService.findById(fiscalYearId); // Hypothetical
      // const actualFiscalYearStartDate = fiscalYearEntity ? new Date(fiscalYearEntity.startDate) : new Date(asOfDate.getFullYear(), 0, 1); // Fallback

      // For getAccountMovements, if periodStartDate is the true start of the fiscal year:
      // We need a way to get this date. If not available, the movements might not be perfectly aligned.
      // The current getAccountMovements expects a defined periodStartDate.
      // Let's assume for now the controller ensures asOfDate is within a sensible range for the fiscalYearId
      // and that movements are from the implicit start of that fiscal year.
      // This part needs a robust way to define the period start for movements.
      // A common practice is that Trial Balance movements are for the fiscal year to date.
      // So, periodStartDate should be the first day of the fiscalYearId.

      // Simplification: Assume getAccountMovements for the entire fiscalYearId up to asOfDate
      // This requires getAccountMovements to know the start_date of fiscalYearId or be adapted.
      // For now, we'll pass a placeholder for periodStartDate, assuming it's handled or needs to be the actual FY start.
      // A more correct call if we had fiscalYearStartDate:
      // const periodMovements = await this.journalService.getAccountMovements(
      //   account.id,
      //   companyId,
      //   fiscalYearId,
      //   actualFiscalYearStartDate, // True start of the fiscal year
      //   asOfDate,
      // );

      // Given the current getAccountMovements signature, we must provide a start date.
      // If the trial balance is always "year to date", then we need the fiscal year's start date.
      // This is a critical piece of information.
      // Let's assume for now the Trial Balance is for the period from the start of the *calendar year* of asOfDate up to asOfDate,
      // if a specific fiscal year start isn't easily retrievable here. This is a major simplification.
      // A better way: The controller should pass periodStartDate for TB if it's not strictly YTD based on fiscalYearId.
      // Or, ReportingService fetches the FiscalYear entity.

      // For now, let's make a simplifying assumption that the trial balance is for the whole fiscal year up to asOfDate
      // and that getAccountMovements can handle fiscalYearId to determine its start if periodStartDate is not given.
      // However, our current getAccountMovements *requires* periodStartDate.
      // This highlights a need to refine how period boundaries are handled.
      // Let's assume the controller will provide a periodStartDate for TB if it's not the full fiscal year.
      // If we want YTD for fiscalYearId, we MUST get that fiscalYearId's start date.
      // For now, this part of TB opening/period calculation is a placeholder for robust date handling.

      const periodMovements = await this.journalService.getAccountMovements(
        account.id,
        companyId,
        fiscalYearId,
        actualFiscalYearStartDate, // Use the actual start date of the fiscal year
        asOfDate,
      );


      const closingDebit = openingDebit + periodMovements.totalDebit;
      const closingCredit = openingCredit + periodMovements.totalCredit;

      trialBalanceLines.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        openingDebit: openingDebit,
        openingCredit: openingCredit,
        periodDebit: periodMovements.totalDebit,
        periodCredit: periodMovements.totalCredit,
        closingDebit: closingDebit > closingCredit ? closingDebit - closingCredit : 0,
        closingCredit: closingCredit > closingDebit ? closingCredit - closingDebit : 0,
      });
    }
    return trialBalanceLines;
  }

  async generateFinancialStatement(
    companyId: string,
    fiscalYearId: string,
    statementType: 'balance-sheet' | 'income-statement' | 'cash-flow-statement',
    accountingStandard: AccountingStandard,
    options: ReportGenerationOptions,
  ): Promise<FinancialStatementReport> {
    this.logger.log(
      `Generating ${statementType} for company ${companyId}, fiscal year ${fiscalYearId}, standard: ${accountingStandard}`,
    );

    // 1. Get the Trial Balance (or more granular data if needed)
    //    For simplicity, let's assume we use balances as of a certain date.
    //    A more robust solution might need detailed GL data.
    const asOfDateForTB = statementType === 'balance-sheet' ? options.asOfDate : options.periodEndDate;
    if (!asOfDateForTB) {
        throw new BadRequestException('Appropriate date (asOfDate or periodEndDate) is required for financial statement generation.');
    }
    const trialBalance = await this.generateTrialBalance(companyId, fiscalYearId, asOfDateForTB);

    // Fetch FiscalYear entity for period start/end dates if not provided in options
    const fiscalYearEntity = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearEntity) {
        throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found.`);
    }

    const reportPeriodStartDate = options.periodStartDate ? new Date(options.periodStartDate) : new Date(fiscalYearEntity.startDate);
    const reportPeriodEndDate = options.periodEndDate ? new Date(options.periodEndDate) : (fiscalYearEntity.endDate ? new Date(fiscalYearEntity.endDate) : new Date(asOfDateForTB)); // Fallback for IS/CF if no explicit period end
    const reportAsOfDate = statementType === 'balance-sheet' ? new Date(asOfDateForTB) : reportPeriodEndDate;


    // 2. Define Account Mappings for the given accountingStandard
    const mappings = this.getFinancialStatementMappings(accountingStandard, statementType);
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
      currency: options.currency, // Add the currency as specified by the client
      // Initialize sections based on statement type
    };
    
    // Fetch actualAccounts earlier, before defining processCategory if it relies on it from the outer scope.
    const fiscalYearForAccountFilter = await this.fiscalYearService.findById(fiscalYearId);
    if (!fiscalYearForAccountFilter) {
        throw new NotFoundException(`FiscalYear with ID ${fiscalYearId} not found when fetching for account details.`);
    }
    const accountsResultForProcessing = await this.accountService.findAll({ companyId, fiscalYear: fiscalYearForAccountFilter.code });
    const actualAccounts = accountsResultForProcessing.accounts; // Defined before processCategory uses it.

    // Helper function to process categories and lines
    const processCategory = (
        currentMappingCategories: StatementCategoryMapping[] | undefined, // Renamed to avoid conflict
        currentTrialBalance: TrialBalanceAccountLine[], // Renamed to avoid conflict
        usePeriodMovement: boolean = false // Renamed and corrected type
      ): { categories: FinancialStatementCategory[], total: number } => {
        if (!currentMappingCategories) return { categories: [], total: 0 };

        let overallTotal = 0;
        const resultCategories: FinancialStatementCategory[] = [];

        for (const mapCategory of currentMappingCategories) { // Use renamed parameter
            let categoryTotal = 0;
            const categoryItems: (FinancialStatementLineItem | FinancialStatementCategory)[] = [];
            
            this.logger.debug(`Processing category: ${mapCategory.categoryName} (${mapCategory.referenceCode || 'no ref code'})`);

            // Process direct lines in this category
            for (const mapLine of mapCategory.lines) {
                let lineAmount = 0;
                let accountsFound = 0;
                
                const contributingAccounts: string[] = [];
                
                for (const accCode of mapLine.accountCodes) {
                    const tbLine = currentTrialBalance.find(l => l.accountCode === accCode || 
                                                            (accCode.endsWith('*') && l.accountCode.startsWith(accCode.slice(0, -1))));
                    if (tbLine) {
                        accountsFound++;
                        contributingAccounts.push(tbLine.accountCode);
                        
                        if (usePeriodMovement) { // Use renamed parameter
                            const accountEntity = actualAccounts.find(a => a.code === tbLine.accountCode);
                            
                            if (!accountEntity) {
                                this.logger.warn(`Account entity not found for code ${tbLine.accountCode} in trial balance. Using fallback logic.`);
                            }
                            
                            const accountType = accountEntity?.type;
                            
                            if (mapLine.signConvention === 'inverse') {
                                if (accountType === AccountType.REVENUE || accountType === AccountType.EQUITY) {
                                    lineAmount += (tbLine.periodDebit - tbLine.periodCredit);
                                } else if (accountType === AccountType.EXPENSE) {
                                    lineAmount += (tbLine.periodCredit - tbLine.periodDebit);
                                } else if (accountType === AccountType.ASSET) {
                                    lineAmount += (tbLine.periodCredit - tbLine.periodDebit);
                                } else if (accountType === AccountType.LIABILITY) {
                                    lineAmount += (tbLine.periodDebit - tbLine.periodCredit);
                                } else {
                                    lineAmount += (tbLine.periodDebit - tbLine.periodCredit);
                                }
                            } else {
                                if (accountType === AccountType.REVENUE || accountType === AccountType.EQUITY || accountType === AccountType.LIABILITY) {
                                    lineAmount += (tbLine.periodCredit - tbLine.periodDebit);
                                } else if (accountType === AccountType.EXPENSE || accountType === AccountType.ASSET) {
                                    lineAmount += (tbLine.periodDebit - tbLine.periodCredit);
                                } else {
                                    const accountClass = parseInt(tbLine.accountCode.charAt(0));
                                    if ([1, 2, 3, 5].includes(accountClass)) {
                                        lineAmount += (tbLine.periodDebit - tbLine.periodCredit);
                                    } else { 
                                        lineAmount += (tbLine.periodCredit - tbLine.periodDebit);
                                    }
                                }
                            }
                        } else {
                            const accountEntity = actualAccounts.find(a => a.code === tbLine.accountCode);
                            const accountType = accountEntity?.type;
                            
                            if (mapLine.signConvention === 'inverse') {
                                lineAmount += (tbLine.closingCredit - tbLine.closingDebit);
                            } else {
                                if (accountType === AccountType.ASSET || accountType === AccountType.EXPENSE) {
                                    lineAmount += (tbLine.closingDebit - tbLine.closingCredit);
                                } else if (accountType === AccountType.LIABILITY || accountType === AccountType.EQUITY || accountType === AccountType.REVENUE) {
                                    lineAmount += (tbLine.closingCredit - tbLine.closingDebit);
                                } else {
                                    const accountClass = parseInt(tbLine.accountCode.charAt(0));
                                    if ([1, 2, 3, 5].includes(accountClass)) {
                                        lineAmount += (tbLine.closingDebit - tbLine.closingCredit);
                                    } else {
                                        lineAmount += (tbLine.closingCredit - tbLine.closingDebit);
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Apply any custom calculation formula if provided
                if (mapLine.calculationFormula && mapLine.isTotalLine) {
                    // This would need a formula parser in a real implementation
                    // For now, we log it and use the summed amount
                    this.logger.log(`Custom calculation for ${mapLine.statementLineName} using formula: ${mapLine.calculationFormula}`);
                }
                
                if (mapLine.accountCodes.length > 0 || mapLine.isTotalLine) {
                    const lineItem: FinancialStatementLineItem = { 
                        name: mapLine.statementLineName, 
                        amount: lineAmount,
                        accountCode: mapLine.accountCodes.length === 1 ? mapLine.accountCodes[0] : undefined
                    };
                    
                    if (accountsFound > 0) {
                        this.logger.debug(`Line ${mapLine.statementLineName}: ${lineAmount} (from ${accountsFound} accounts: ${contributingAccounts.join(', ')})`);
                    } else if (mapLine.accountCodes.length > 0) {
                        this.logger.warn(`No accounts found for line ${mapLine.statementLineName} with codes: ${mapLine.accountCodes.join(', ')}`);
                    }
                    
                    categoryItems.push(lineItem);
                    categoryTotal += lineAmount;
                }
            }

            if (mapCategory.subCategories && mapCategory.subCategories.length > 0) {
                const subResult = processCategory(mapCategory.subCategories, currentTrialBalance, usePeriodMovement); // Use renamed parameters
                categoryItems.push(...subResult.categories);
                categoryTotal += subResult.total;
            }
            
            if (categoryItems.length > 0 || mapCategory.lines.length > 0) { // Add category if it has items or was defined to exist
                 resultCategories.push({
                    categoryName: mapCategory.categoryName,
                    totalAmount: categoryTotal,
                    items: categoryItems,
                    displayOrder: mapCategory.displayOrder
                });
                
                this.logger.debug(`Category ${mapCategory.categoryName}: Total ${categoryTotal}`);
                overallTotal += categoryTotal;
            }
        }
        // Sort categories by displayOrder if present
        resultCategories.sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
        return { categories: resultCategories, total: overallTotal };
    };
    
    if (statementType === 'balance-sheet') {
      const assetsResult = processCategory(mappings?.assets, trialBalance);
      reportData.assets = assetsResult.categories;
      reportData.totalAssets = assetsResult.total;

      const liabilitiesResult = processCategory(mappings?.liabilities, trialBalance);
      reportData.liabilities = liabilitiesResult.categories;
      reportData.totalLiabilities = liabilitiesResult.total;
      
      const equityResult = processCategory(mappings.equity, trialBalance);
      reportData.equity = equityResult.categories;
      reportData.totalEquity = equityResult.total;

      reportData.totalLiabilitiesAndEquity = (reportData.totalLiabilities || 0) + (reportData.totalEquity || 0);

      // Add balance check: totalAssets should equal totalLiabilitiesAndEquity
      const balanceDifference = Math.abs((reportData.totalAssets || 0) - (reportData.totalLiabilitiesAndEquity || 0));
      const isBalanced = balanceDifference < 0.01; // Allow for small rounding differences (0.01 currency units)
      
      if (!isBalanced) {
        this.logger.warn(`Balance sheet is not balanced. Difference: ${balanceDifference}. Assets: ${reportData.totalAssets}, Liabilities+Equity: ${reportData.totalLiabilitiesAndEquity}`);
        reportData.notes = `AVERTISSEMENT: Le bilan n'est pas équilibré. Différence: ${balanceDifference.toFixed(2)} ${options.currency || ''}.`;
      }

    } else if (statementType === 'income-statement') {
      const revenueResult = processCategory(mappings.revenue, trialBalance, true);
      reportData.revenue = revenueResult.categories;
      const totalRevenue = revenueResult.total;

      const costOfSalesResult = processCategory(mappings.costOfSales, trialBalance, true);
      reportData.costOfSales = costOfSalesResult.categories;
      const totalCostOfSales = costOfSalesResult.total;

      reportData.grossProfit = totalRevenue - totalCostOfSales;

      const operatingExpensesResult = processCategory(mappings.operatingExpenses, trialBalance, true);
      reportData.operatingExpenses = operatingExpensesResult.categories;
      const totalOperatingExpenses = operatingExpensesResult.total;
      
      reportData.operatingIncome = reportData.grossProfit - totalOperatingExpenses;

      const otherIncomeResult = processCategory(mappings.otherIncome, trialBalance, true);
      reportData.otherIncome = otherIncomeResult.categories;
      const totalOtherIncome = otherIncomeResult.total;

      const otherExpensesResult = processCategory(mappings.otherExpenses, trialBalance, true);
      reportData.otherExpenses = otherExpensesResult.categories;
      const totalOtherExpenses = otherExpensesResult.total;

      reportData.earningsBeforeTax = reportData.operatingIncome + totalOtherIncome - totalOtherExpenses;
      
      const incomeTaxExpenseResult = processCategory(mappings.incomeTaxExpense, trialBalance, true);
      reportData.incomeTaxExpense = incomeTaxExpenseResult.categories;
      const totalIncomeTaxExpense = incomeTaxExpenseResult.total;

      reportData.netIncome = reportData.earningsBeforeTax - totalIncomeTaxExpense;
    } else if (statementType === 'cash-flow-statement') {
      // Implémentation améliorée du tableau des flux de trésorerie
      // En utilisant la méthode indirecte conforme aux normes comptables
      
      // Pour un tableau des flux de trésorerie complet, nous avons besoin:
      // 1. Du bilan d'ouverture (à la date de début de période)
      // 2. Du bilan de clôture (à la date de fin de période)
      // 3. Du compte de résultat de la période
      
      // 1. Récupérer le bilan à la date d'ouverture (jour avant le début de période)
      const openingBalanceSheetDate = new Date(reportPeriodStartDate);
      openingBalanceSheetDate.setDate(openingBalanceSheetDate.getDate() - 1);
      
      this.logger.log(`Generating opening balance sheet for cash flow at ${openingBalanceSheetDate.toISOString()}`);
      
      // Récupérer les soldes des comptes de trésorerie à l'ouverture
      // Dans une implémentation complète, nous générerions un trial balance complet à cette date
      const cashAccountCodes = ["52", "53", "57", "581", "582"]; // Codes des comptes de trésorerie SYSCOHADA
      let openingCashBalance = 0;
      
      try {
        // Calculer le solde de trésorerie à l'ouverture en utilisant les comptes de trésorerie
        for (const account of actualAccounts.filter(a => cashAccountCodes.some(code => a.code.startsWith(code)))) {
          const balanceData = await this.journalService.getAccountBalance(
            account.id,
            fiscalYearId,
            companyId,
            openingBalanceSheetDate
          );
          // Les comptes de trésorerie actif ont un solde positif, les comptes de trésorerie passif ont un solde négatif
          openingCashBalance += balanceData.balance;
        }
        
        this.logger.log(`Opening cash balance calculated: ${openingCashBalance}`);
      } catch (error: any) {
        this.logger.error(`Error calculating opening cash balance: ${error.message || JSON.stringify(error)}`);
        // En cas d'erreur, continuer avec un solde à zéro mais ajouter une note
        reportData.notes = (reportData.notes || '') + ' Attention: Le solde d\'ouverture de trésorerie n\'a pas pu être calculé correctement.';
      }
      
      // Traiter les sections du cash flow en utilisant les mappings et la logique comptable
      const operatingActivitiesResult = processCategory(mappings.operatingActivities, trialBalance, true);
      reportData.cashFlowsFromOperatingActivities = operatingActivitiesResult.categories;
      const totalOperatingCashFlow = operatingActivitiesResult.total;
      
      const investingActivitiesResult = processCategory(mappings.investingActivities, trialBalance, true);
      reportData.cashFlowsFromInvestingActivities = investingActivitiesResult.categories;
      const totalInvestingCashFlow = investingActivitiesResult.total;
      
      const financingActivitiesResult = processCategory(mappings.financingActivities, trialBalance, true);
      reportData.cashFlowsFromFinancingActivities = financingActivitiesResult.categories;
      const totalFinancingCashFlow = financingActivitiesResult.total;
      
      // Calcul du changement net de trésorerie pour la période
      const netCashChange = totalOperatingCashFlow + totalInvestingCashFlow + totalFinancingCashFlow;
      reportData.netIncreaseInCash = netCashChange;
      
      // Utiliser le solde d'ouverture calculé
      reportData.cashAtBeginningOfPeriod = openingCashBalance;
      
      // Calcul du solde final de trésorerie
      const calculatedEndingCash = openingCashBalance + netCashChange;
      reportData.cashAtEndOfPeriod = calculatedEndingCash;
      
      // Vérification de la cohérence: le solde final calculé devrait correspondre au solde réel des comptes de trésorerie
      let closingCashBalance = 0;
      
      try {
        // Calculer le solde réel de trésorerie à la clôture en utilisant les comptes de trésorerie
        for (const account of actualAccounts.filter(a => cashAccountCodes.some(code => a.code.startsWith(code)))) {          const tbLine = trialBalance.find(tb => tb.accountCode === account.code);
          if (tbLine) {
            closingCashBalance += (tbLine.closingDebit - tbLine.closingCredit);
          } else {
            this.logger.warn(`No trial balance line found for cash account ${account.code} (${account.name})`);
          }
        }
        
        // Vérifier l'écart entre le solde calculé et le solde réel
        const cashDifference = Math.abs(calculatedEndingCash - closingCashBalance);
        if (cashDifference > 0.01) { // Tolérance pour les différences d'arrondi
          this.logger.warn(`Cash flow statement end balance (${calculatedEndingCash}) does not match actual cash accounts (${closingCashBalance}). Difference: ${cashDifference}`);
          reportData.notes = (reportData.notes || '') + 
            ` AVERTISSEMENT: Le solde final de trésorerie calculé (${calculatedEndingCash.toFixed(2)} ${options.currency || ''}) ` +
            `ne correspond pas au solde réel des comptes de trésorerie (${closingCashBalance.toFixed(2)} ${options.currency || ''}). ` +
            `Écart: ${cashDifference.toFixed(2)} ${options.currency || ''}.`;
        }
      } catch (error: any) {
        this.logger.error(`Error verifying closing cash balance: ${error.message || JSON.stringify(error)}`);
      }
      
      this.logger.log(`Cash flow statement generated with net change in cash: ${netCashChange}`);
    }

    reportData.rawData = { trialBalance, mappingsUsed: mappings }; // Include for transparency
    return reportData;
  }

  /**
   * Fetches financial statement account mappings based on accounting standard and statement type.
   * This implementation provides a detailed chart of accounts mapping aligned with accounting standards.
   * 
   * In a production environment, these mappings should come from a database or configuration files
   * to allow for updates without code changes when accounting standards evolve.
   */
  private getFinancialStatementMappings(standard: AccountingStandard, statementTypeString: 'balance-sheet' | 'income-statement' | 'cash-flow-statement'): FinancialStatementMappingDefinition | null {
    // This implementation follows standard accounting principles while providing flexibility
    // for different accounting standards.
    
    if (standard === AccountingStandard.SYSCOHADA) {
      // SYSCOHADA Standard Implementation
      
      // Define assets, liabilities, and equity for balance sheet
      const syscohadaBalanceSheetAssets: StatementCategoryMapping[] = [
        {
          categoryName: "ACTIF IMMOBILISE", 
          displayOrder: 1, 
          referenceCode: "AZ",
          description: "Actifs destinés à servir de façon durable l'activité de l'entreprise",
          lines: [],
          subCategories: [
            { 
              categoryName: "Immobilisations incorporelles", 
              referenceCode: "AX",
              lines: [
                { statementLineName: "Frais de développement et de prospection", accountCodes: ["201", "202"], referenceCode: "AK" },
                { statementLineName: "Brevets, licences, logiciels, et droits similaires", accountCodes: ["203", "205"], referenceCode: "AL" },
                { statementLineName: "Fonds commercial et droit au bail", accountCodes: ["206", "207"], referenceCode: "AM" },
                { statementLineName: "Autres immobilisations incorporelles", accountCodes: ["208"], referenceCode: "AN" },
              ]
            },
            { 
              categoryName: "Immobilisations corporelles", 
              referenceCode: "AY",
              lines: [
                { statementLineName: "Terrains (y compris aménagements et agencements)", accountCodes: ["21", "22"], referenceCode: "AP" },
                { statementLineName: "Bâtiments, installations techniques et agencements", accountCodes: ["23","241","242","243","244"], referenceCode: "AR" },
                { statementLineName: "Matériel, mobilier et actifs biologiques", accountCodes: ["245","246","247","248","2495"], referenceCode: "AS" },
                { statementLineName: "Matériel de transport", accountCodes: ["2497"], referenceCode: "AT" },
                { statementLineName: "Avances et acomptes versés sur immobilisations", accountCodes: ["25"], referenceCode: "AU" },
              ]
            },
            { 
              categoryName: "Immobilisations financières", 
              referenceCode: "BB",
              lines: [
                { statementLineName: "Titres de participation et créances rattachées", accountCodes: ["261", "265"], referenceCode: "AW" },
                { statementLineName: "Autres immobilisations financières", accountCodes: ["271","272","274","275","276","277"], referenceCode: "BA" },
              ]
            },
          ]
        },
        {
          categoryName: "ACTIF CIRCULANT HAO", 
          displayOrder: 2, 
          referenceCode: "BZ",
          description: "Actifs liés aux activités hors activités ordinaires",
          lines: [
              { statementLineName: "Actifs HAO", accountCodes: ["471"], referenceCode: "BT" },
          ]
        },
        {
          categoryName: "ACTIF CIRCULANT D'EXPLOITATION", 
          displayOrder: 3, 
          referenceCode: "CA",
          description: "Actifs liés à l'exploitation normale de l'entreprise",
          lines: [],
          subCategories: [
              { 
                categoryName: "Stocks et en-cours", 
                referenceCode: "BU",
                lines: [
                  { statementLineName: "Marchandises", accountCodes: ["31"], referenceCode: "BC" },
                  { statementLineName: "Matières premières et fournitures liées", accountCodes: ["32", "33"], referenceCode: "BD" },
                  { statementLineName: "Produits et services en cours", accountCodes: ["34", "36"], referenceCode: "BE" },
                  { statementLineName: "Produits finis et intermédiaires", accountCodes: ["35", "37"], referenceCode: "BF" },
                ]
              },
              { 
                categoryName: "Créances et emplois assimilés", 
                referenceCode: "BV",
                lines: [
                  { statementLineName: "Clients et comptes rattachés", accountCodes: ["411", "412", "414", "416", "418"], referenceCode: "BH" },
                  { statementLineName: "Autres créances", accountCodes: ["409", "42", "43", "44", "45", "46"], referenceCode: "BI" },
                  { statementLineName: "Charges payées d\'avance", accountCodes: ["476"], referenceCode: "BJ" },
                ]
              }
          ]
        },
        {
          categoryName: "TRESORERIE-ACTIF", 
          displayOrder: 4, 
          referenceCode: "DZ",
          description: "Liquidités et équivalents de liquidités",
          lines: [
            { statementLineName: "Titres de placement", accountCodes: ["50"], referenceCode: "DB" },
            { statementLineName: "Valeurs à encaisser", accountCodes: ["51"], referenceCode: "DC" },
            { statementLineName: "Banques, chèques postaux, caisse", accountCodes: ["52", "53", "57", "581", "582"], referenceCode: "DD" },
          ]
        }
      ];

      const syscohadaBalanceSheetLiabilities: StatementCategoryMapping[] = [
        { 
          categoryName: "DETTES FINANCIERES ET RESSOURCES ASSIMILEES", 
          displayOrder: 2, 
          referenceCode: "DP",
          description: "Ressources durables mises à la disposition de l'entreprise",
          lines: [
            { statementLineName: "Emprunts et dettes financières diverses", accountCodes: ["161","162","163","164","165","166","167","168","17"], referenceCode: "DJ" },
            { statementLineName: "Dettes de location acquisition", accountCodes: ["17"], referenceCode: "DK" },
            { statementLineName: "Provisions financières pour risques et charges", accountCodes: ["19"], referenceCode: "DM" },
          ]
        },
        { 
          categoryName: "PASSIF CIRCULANT HAO", 
          displayOrder: 3, 
          referenceCode: "DT",
          description: "Dettes liées aux activités hors activités ordinaires",
          lines: [
            { statementLineName: "Passifs HAO", accountCodes: ["475"], referenceCode: "DS" },
          ]
        },
        { 
          categoryName: "PASSIF CIRCULANT D'EXPLOITATION", 
          displayOrder: 4, 
          referenceCode: "DY",
          description: "Dettes liées à l'exploitation normale de l'entreprise",
          lines: [],
          subCategories: [
            { 
              categoryName: "Dettes d'exploitation", 
              referenceCode: "DX",
              lines: [
                { statementLineName: "Fournisseurs d'exploitation et comptes rattachés", accountCodes: ["401", "402", "408"], referenceCode: "DU" },
                { statementLineName: "Dettes fiscales et sociales", accountCodes: ["42", "43", "44"], referenceCode: "DV" },
                { statementLineName: "Autres dettes", accountCodes: ["45", "46"], referenceCode: "DW" },
                { statementLineName: "Produits constatés d'avance", accountCodes: ["477"], referenceCode: "DX" },
              ]
            },
          ]
        },
        { 
          categoryName: "TRESORERIE-PASSIF", 
          displayOrder: 5, 
          referenceCode: "DZ",
          description: "Découverts et crédits bancaires à court terme",
          lines: [
            { statementLineName: "Banques, crédits d'escompte et de trésorerie", accountCodes: ["52", "561", "564", "565", "566"], referenceCode: "DZ" },
          ]
        }
      ];

      const syscohadaBalanceSheetEquity: StatementCategoryMapping[] = [
        { 
          categoryName: "CAPITAUX PROPRES ET RESSOURCES ASSIMILEES", 
          displayOrder: 1, 
          referenceCode: "CP",
          description: "Ressources propres de l'entreprise",
          lines: [],
          subCategories: [
            { 
              categoryName: "Capitaux propres", 
              referenceCode: "CL",
              lines: [
                { statementLineName: "Capital social ou personnel", accountCodes: ["101", "102"], referenceCode: "CA" },
                { statementLineName: "Réserves (légales, statutaires, etc.)", accountCodes: ["103", "104", "105", "106"], referenceCode: "CD" },
                { statementLineName: "Report à nouveau (+/-)", accountCodes: ["11"], referenceCode: "CG" },
                { statementLineName: "Résultat net de l'exercice (+/-)", accountCodes: ["120", "129"], referenceCode: "CH" },
                { statementLineName: "Subventions d'investissement", accountCodes: ["14"], referenceCode: "CJ" },
                { statementLineName: "Provisions réglementées et fonds assimilés", accountCodes: ["15"], referenceCode: "CK" },
              ]
            },
          ]
        }
      ];

      // SYSCOHADA Income Statement
      const syscohadaIncomeStatement = {
        revenue: [
          {
            categoryName: "PRODUITS DES ACTIVITÉS ORDINAIRES",
            displayOrder: 1,
            referenceCode: "TA",
            description: "Revenus issus des activités ordinaires de l'entreprise",
            lines: [
              { statementLineName: "Ventes de marchandises", accountCodes: ["701"], referenceCode: "RA", signConvention: 'natural' as 'natural' },
              { statementLineName: "Ventes de produits fabriqués", accountCodes: ["702"], referenceCode: "RB", signConvention: 'natural' as 'natural' },
              { statementLineName: "Ventes de travaux et services vendus", accountCodes: ["703", "704", "705"], referenceCode: "RC", signConvention: 'natural' as 'natural' },
              { statementLineName: "Produits accessoires", accountCodes: ["706", "707", "708"], referenceCode: "RD", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        costOfSales: [
          {
            categoryName: "ACHATS ET VARIATIONS DE STOCKS",
            displayOrder: 1,
            referenceCode: "TB",
            description: "Coûts directs liés aux produits et services vendus",
            lines: [
              { statementLineName: "Achats de marchandises", accountCodes: ["601"], referenceCode: "RA", signConvention: 'natural' as 'natural' },
              { statementLineName: "Variation de stocks de marchandises", accountCodes: ["6031"], referenceCode: "RB", signConvention: 'natural' as 'natural' },
              { statementLineName: "Achats de matières premières et fournitures", accountCodes: ["602"], referenceCode: "RC", signConvention: 'natural' as 'natural' },
              { statementLineName: "Variation de stocks de matières premières", accountCodes: ["6032"], referenceCode: "RD", signConvention: 'natural' as 'natural' },
              { statementLineName: "Autres achats", accountCodes: ["604", "605", "608"], referenceCode: "RE", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        operatingExpenses: [
          {
            categoryName: "AUTRES CHARGES EXTERNES",
            displayOrder: 1,
            referenceCode: "TC",
            description: "Charges d'exploitation non liées directement aux produits vendus",
            lines: [
              { statementLineName: "Services extérieurs", accountCodes: ["61"], referenceCode: "TA", signConvention: 'natural' as 'natural' },
              { statementLineName: "Autres services extérieurs", accountCodes: ["62"], referenceCode: "TB", signConvention: 'natural' as 'natural' }
            ]
          },
          {
            categoryName: "CHARGES DE PERSONNEL",
            displayOrder: 2,
            referenceCode: "TD",
            description: "Rémunérations et charges sociales",
            lines: [
              { statementLineName: "Rémunérations du personnel", accountCodes: ["661"], referenceCode: "TC", signConvention: 'natural' as 'natural' },
              { statementLineName: "Charges sociales", accountCodes: ["662", "663", "664"], referenceCode: "TD", signConvention: 'natural' as 'natural' }
            ]
          },
          {
            categoryName: "IMPÔTS ET TAXES",
            displayOrder: 3,
            referenceCode: "TE",
            description: "Impôts, taxes et versements assimilés",
            lines: [
              { statementLineName: "Impôts et taxes", accountCodes: ["64"], referenceCode: "TE", signConvention: 'natural' as 'natural' }
            ]
          },
          {
            categoryName: "DOTATIONS AUX AMORTISSEMENTS ET PROVISIONS",
            displayOrder: 4,
            referenceCode: "TF",
            description: "Amortissements et provisions d'exploitation",
            lines: [
              { statementLineName: "Dotations aux amortissements", accountCodes: ["681"], referenceCode: "TF", signConvention: 'natural' as 'natural' },
              { statementLineName: "Dotations aux provisions", accountCodes: ["682"], referenceCode: "TG", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        otherIncome: [
          {
            categoryName: "AUTRES PRODUITS",
            displayOrder: 1,
            referenceCode: "TH",
            description: "Produits hors activité principale",
            lines: [
              { statementLineName: "Revenus financiers", accountCodes: ["77"], referenceCode: "TI", signConvention: 'natural' as 'natural' },
              { statementLineName: "Transferts de charges", accountCodes: ["781"], referenceCode: "TJ", signConvention: 'natural' as 'natural' },
              { statementLineName: "Reprises de provisions", accountCodes: ["791"], referenceCode: "TK", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        otherExpenses: [
          {
            categoryName: "AUTRES CHARGES",
            displayOrder: 1,
            referenceCode: "TL",
            description: "Charges hors activité principale",
            lines: [
              { statementLineName: "Charges financières", accountCodes: ["67"], referenceCode: "TM", signConvention: 'natural' as 'natural' },
              { statementLineName: "Charges HAO", accountCodes: ["83"], referenceCode: "TN", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        incomeTaxExpense: [
          {
            categoryName: "IMPÔTS SUR LE RÉSULTAT",
            displayOrder: 1,
            referenceCode: "TP",
            description: "Impôts exigibles et différés sur les bénéfices",
            lines: [
              { statementLineName: "Impôts sur les bénéfices", accountCodes: ["89"], referenceCode: "TQ", signConvention: 'natural' as 'natural' }
            ]
          }
        ]
      };

      // SYSCOHADA Cash Flow Statement
      const syscohadaCashFlow = {
        operatingActivities: [
          {
            categoryName: "FLUX DE TRÉSORERIE LIÉS AUX ACTIVITÉS OPÉRATIONNELLES",
            displayOrder: 1,
            referenceCode: "ZA",
            description: "Flux de trésorerie générés par l'activité principale",
            lines: [
              { statementLineName: "Résultat net de l'exercice", accountCodes: ["120", "129"], referenceCode: "FA", signConvention: 'natural' as 'natural', isTotalLine: true },
              { statementLineName: "Dotations aux amortissements et provisions", accountCodes: ["681", "682"], referenceCode: "FB", signConvention: 'natural' as 'natural' },
              { statementLineName: "Reprises sur amortissements et provisions", accountCodes: ["781", "791"], referenceCode: "FC", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Variation des stocks", accountCodes: ["31", "32", "33", "34", "35", "36", "37"], referenceCode: "FD", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Variation des créances clients", accountCodes: ["411", "412", "414", "416", "418"], referenceCode: "FE", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Variation des dettes fournisseurs", accountCodes: ["401", "402", "408"], referenceCode: "FF", signConvention: 'natural' as 'natural' },
              { statementLineName: "Autres variations du BFR", accountCodes: ["42", "43", "44", "45", "46", "47"], referenceCode: "FG", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        investingActivities: [
          {
            categoryName: "FLUX DE TRÉSORERIE LIÉS AUX ACTIVITÉS D'INVESTISSEMENT",
            displayOrder: 2,
            referenceCode: "ZB",
            description: "Flux liés aux acquisitions et cessions d'immobilisations",
            lines: [
              { statementLineName: "Acquisitions d'immobilisations", accountCodes: ["20", "21", "22", "23", "24", "25", "26", "27"], referenceCode: "FH", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Cessions d'immobilisations", accountCodes: ["485", "775"], referenceCode: "FI", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        financingActivities: [
          {
            categoryName: "FLUX DE TRÉSORERIE LIÉS AUX ACTIVITÉS DE FINANCEMENT",
            displayOrder: 3,
            referenceCode: "ZC",
            description: "Flux liés aux opérations de financement",
            lines: [
              { statementLineName: "Augmentation de capital", accountCodes: ["101", "102", "104"], referenceCode: "FJ", signConvention: 'natural' as 'natural' },
              { statementLineName: "Dividendes versés", accountCodes: ["457"], referenceCode: "FK", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Emprunts souscrits", accountCodes: ["16"], referenceCode: "FL", signConvention: 'natural' as 'natural' },
              { statementLineName: "Remboursements d'emprunts", accountCodes: ["16"], referenceCode: "FM", signConvention: 'inverse' as 'inverse' }
            ]
          }
        ]
      };

      // Prepare complete mapping definition based on statement type
      if (statementTypeString === 'balance-sheet') {
        return {
          standard: AccountingStandard.SYSCOHADA,
          description: "Système Comptable OHADA - Bilan",
          version: "SYSCOHADA Révisé",
          effectiveDate: new Date("2018-01-01"),
          assets: syscohadaBalanceSheetAssets,
          liabilities: syscohadaBalanceSheetLiabilities,
          equity: syscohadaBalanceSheetEquity,
          revenue: [], // Not needed for balance sheet
          costOfSales: [], // Not needed for balance sheet
          operatingExpenses: [], // Not needed for balance sheet
          otherIncome: [], // Not needed for balance sheet
          otherExpenses: [], // Not needed for balance sheet
          incomeTaxExpense: [] // Not needed for balance sheet
        };
      } else if (statementTypeString === 'income-statement') {
        return {
          standard: AccountingStandard.SYSCOHADA,
          description: "Système Comptable OHADA - Compte de Résultat",
          version: "SYSCOHADA Révisé",
          effectiveDate: new Date("2018-01-01"),
          assets: [], // Not needed for income statement
          liabilities: [], // Not needed for income statement
          equity: [], // Not needed for income statement
          revenue: syscohadaIncomeStatement.revenue,
          costOfSales: syscohadaIncomeStatement.costOfSales,
          operatingExpenses: syscohadaIncomeStatement.operatingExpenses,
          otherIncome: syscohadaIncomeStatement.otherIncome,
          otherExpenses: syscohadaIncomeStatement.otherExpenses,
          incomeTaxExpense: syscohadaIncomeStatement.incomeTaxExpense
        };
      } else if (statementTypeString === 'cash-flow-statement') {
        return {
          standard: AccountingStandard.SYSCOHADA,
          description: "Système Comptable OHADA - Tableau des Flux de Trésorerie",
          version: "SYSCOHADA Révisé",
          effectiveDate: new Date("2018-01-01"),
          assets: [], // Not needed for cash flow statement
          liabilities: [], // Not needed for cash flow statement
          equity: [], // Not needed for cash flow statement
          revenue: [], // Not needed for cash flow statement
          costOfSales: [], // Not needed for cash flow statement
          operatingExpenses: [], // Not needed for cash flow statement
          otherIncome: [], // Not needed for cash flow statement
          otherExpenses: [], // Not needed for cash flow statement
          incomeTaxExpense: [], // Not needed for cash flow statement
          operatingActivities: syscohadaCashFlow.operatingActivities,
          investingActivities: syscohadaCashFlow.investingActivities,
          financingActivities: syscohadaCashFlow.financingActivities
        };
      }
    }    else if (standard === AccountingStandard.IFRS) {
      // IFRS Standard Implementation
      
      // Define assets for balance sheet according to IFRS
      const ifrsBalanceSheetAssets: StatementCategoryMapping[] = [
        {
          categoryName: "NON-CURRENT ASSETS", 
          displayOrder: 1, 
          referenceCode: "NCA",
          description: "Assets that are not expected to be consumed or sold within one year",
          lines: [],
          subCategories: [
            { 
              categoryName: "Property, Plant and Equipment", 
              referenceCode: "PPE",
              lines: [
                { statementLineName: "Land and Buildings", accountCodes: ["21", "22", "23"], referenceCode: "PPE1" },
                { statementLineName: "Machinery and Equipment", accountCodes: ["24"], referenceCode: "PPE2" },
                { statementLineName: "Motor Vehicles", accountCodes: ["2497"], referenceCode: "PPE3" },
                { statementLineName: "Furniture and Fixtures", accountCodes: ["245", "246"], referenceCode: "PPE4" },
                { statementLineName: "Assets Under Construction", accountCodes: ["25"], referenceCode: "PPE5" },
                { statementLineName: "Accumulated Depreciation", accountCodes: ["28"], referenceCode: "PPE6", signConvention: 'inverse' as 'inverse' },
              ]
            },
            { 
              categoryName: "Intangible Assets", 
              referenceCode: "IA",
              lines: [
                { statementLineName: "Goodwill", accountCodes: ["207"], referenceCode: "IA1" },
                { statementLineName: "Development Costs", accountCodes: ["201", "202"], referenceCode: "IA2" },
                { statementLineName: "Patents and Trademarks", accountCodes: ["203"], referenceCode: "IA3" },
                { statementLineName: "Software and Licenses", accountCodes: ["205"], referenceCode: "IA4" },
                { statementLineName: "Other Intangible Assets", accountCodes: ["208"], referenceCode: "IA5" },
                { statementLineName: "Accumulated Amortization", accountCodes: ["280", "290"], referenceCode: "IA6", signConvention: 'inverse' as 'inverse' },
              ]
            },
            { 
              categoryName: "Financial Assets", 
              referenceCode: "FA",
              lines: [
                { statementLineName: "Investments in Associates", accountCodes: ["261", "266"], referenceCode: "FA1" },
                { statementLineName: "Other Long-term Investments", accountCodes: ["271", "272"], referenceCode: "FA2" },
                { statementLineName: "Long-term Loans and Receivables", accountCodes: ["274", "275"], referenceCode: "FA3" },
              ]
            },
            {
              categoryName: "Deferred Tax Assets",
              referenceCode: "DTA",
              lines: [
                { statementLineName: "Deferred Tax Assets", accountCodes: ["276"], referenceCode: "DTA1" },
              ]
            }
          ]
        },
        {
          categoryName: "CURRENT ASSETS", 
          displayOrder: 2, 
          referenceCode: "CA",
          description: "Assets expected to be converted to cash within one year",
          lines: [],
          subCategories: [
              { 
                categoryName: "Inventories", 
                referenceCode: "INV",
                lines: [
                  { statementLineName: "Raw Materials", accountCodes: ["32", "33"], referenceCode: "INV1" },
                  { statementLineName: "Work in Progress", accountCodes: ["34", "36"], referenceCode: "INV2" },
                  { statementLineName: "Finished Goods", accountCodes: ["35", "37"], referenceCode: "INV3" },
                  { statementLineName: "Merchandise", accountCodes: ["31"], referenceCode: "INV4" },
                ]
              },
              { 
                categoryName: "Trade and Other Receivables", 
                referenceCode: "TR",
                lines: [
                  { statementLineName: "Trade Receivables", accountCodes: ["411", "412", "414", "416", "418"], referenceCode: "TR1" },
                  { statementLineName: "Provision for Doubtful Debts", accountCodes: ["491"], referenceCode: "TR2", signConvention: 'inverse' as 'inverse' },
                  { statementLineName: "Other Receivables", accountCodes: ["409", "42", "43", "44", "45", "46"], referenceCode: "TR3" },
                  { statementLineName: "Prepayments", accountCodes: ["476"], referenceCode: "TR4" },
                ]
              },
              {
                categoryName: "Short-term Investments",
                referenceCode: "STI",
                lines: [
                  { statementLineName: "Marketable Securities", accountCodes: ["50"], referenceCode: "STI1" },
                ]
              },
              {
                categoryName: "Cash and Cash Equivalents", 
                referenceCode: "CCE",
                lines: [
                  { statementLineName: "Cash at Bank", accountCodes: ["52"], referenceCode: "CCE1" },
                  { statementLineName: "Cash in Hand", accountCodes: ["53", "57"], referenceCode: "CCE2" },
                  { statementLineName: "Short-term Deposits", accountCodes: ["581", "582"], referenceCode: "CCE3" },
                ]
              }
          ]
        },
        {
          categoryName: "ASSETS HELD FOR SALE", 
          displayOrder: 3, 
          referenceCode: "AHS",
          description: "Non-current assets classified as held for sale",
          lines: [
            { statementLineName: "Assets Held for Sale", accountCodes: ["471"], referenceCode: "AHS1" },
          ]
        }
      ];

      // Define liabilities for balance sheet according to IFRS
      const ifrsBalanceSheetLiabilities: StatementCategoryMapping[] = [
        { 
          categoryName: "NON-CURRENT LIABILITIES", 
          displayOrder: 1, 
          referenceCode: "NCL",
          description: "Obligations not due within one year",
          lines: [
            { statementLineName: "Long-term Borrowings", accountCodes: ["161","162","163","164","165","166","167","168"], referenceCode: "NCL1" },
            { statementLineName: "Finance Lease Obligations", accountCodes: ["17"], referenceCode: "NCL2" },
            { statementLineName: "Deferred Tax Liabilities", accountCodes: ["477"], referenceCode: "NCL3" },
            { statementLineName: "Long-term Provisions", accountCodes: ["19"], referenceCode: "NCL4" },
            { statementLineName: "Pension Obligations", accountCodes: ["195"], referenceCode: "NCL5" },
          ]
        },
        { 
          categoryName: "CURRENT LIABILITIES", 
          displayOrder: 2, 
          referenceCode: "CL",
          description: "Obligations due within one year",
          lines: [],
          subCategories: [
            { 
              categoryName: "Trade and Other Payables", 
              referenceCode: "TOP",
              lines: [
                { statementLineName: "Trade Payables", accountCodes: ["401", "402", "408"], referenceCode: "TOP1" },
                { statementLineName: "Tax Payables", accountCodes: ["44"], referenceCode: "TOP2" },
                { statementLineName: "Social Security and Other Payables", accountCodes: ["42", "43", "45", "46"], referenceCode: "TOP3" },
                { statementLineName: "Accruals", accountCodes: ["477"], referenceCode: "TOP4" },
              ]
            },
            {
              categoryName: "Short-term Borrowings",
              referenceCode: "STB",
              lines: [
                { statementLineName: "Bank Overdrafts and Loans", accountCodes: ["52", "561", "564", "565", "566"], referenceCode: "STB1" },
                { statementLineName: "Current Portion of Long-term Borrowings", accountCodes: ["169"], referenceCode: "STB2" },
              ]
            },
            {
              categoryName: "Short-term Provisions",
              referenceCode: "STP",
              lines: [
                { statementLineName: "Short-term Provisions", accountCodes: ["499"], referenceCode: "STP1" },
              ]
            }
          ]
        },
        { 
          categoryName: "LIABILITIES RELATED TO ASSETS HELD FOR SALE", 
          displayOrder: 3, 
          referenceCode: "LHS",
          description: "Liabilities directly associated with assets classified as held for sale",
          lines: [
            { statementLineName: "Liabilities Held for Sale", accountCodes: ["475"], referenceCode: "LHS1" },
          ]
        }
      ];

      // Define equity for balance sheet according to IFRS
      const ifrsBalanceSheetEquity: StatementCategoryMapping[] = [
        { 
          categoryName: "EQUITY", 
          displayOrder: 1, 
          referenceCode: "EQ",
          description: "Shareholders' interest in the company",
          lines: [
            { statementLineName: "Share Capital", accountCodes: ["101", "102"], referenceCode: "EQ1" },
            { statementLineName: "Share Premium", accountCodes: ["104"], referenceCode: "EQ2" },
            { statementLineName: "Treasury Shares", accountCodes: ["109"], referenceCode: "EQ3", signConvention: 'inverse' as 'inverse' },
            { statementLineName: "Retained Earnings", accountCodes: ["11"], referenceCode: "EQ4" },
            { statementLineName: "Other Reserves", accountCodes: ["103", "105", "106"], referenceCode: "EQ5" },
            { statementLineName: "Profit/(Loss) for the Year", accountCodes: ["120", "129"], referenceCode: "EQ6" },
            { statementLineName: "Non-controlling Interests", accountCodes: ["108"], referenceCode: "EQ7" },
          ]
        }
      ];

      // Define IFRS Income Statement
      const ifrsIncomeStatement = {
        revenue: [
          {
            categoryName: "REVENUE",
            displayOrder: 1,
            referenceCode: "REV",
            description: "Income from ordinary activities",
            lines: [
              { statementLineName: "Revenue from Sale of Goods", accountCodes: ["701", "702"], referenceCode: "REV1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Revenue from Services", accountCodes: ["703", "704", "705"], referenceCode: "REV2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Other Operating Revenue", accountCodes: ["706", "707", "708"], referenceCode: "REV3", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        costOfSales: [
          {
            categoryName: "COST OF SALES",
            displayOrder: 1,
            referenceCode: "COS",
            description: "Direct costs attributable to goods and services sold",
            lines: [
              { statementLineName: "Cost of Goods Sold", accountCodes: ["601", "6031"], referenceCode: "COS1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Direct Labor", accountCodes: ["661"], referenceCode: "COS2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Direct Materials", accountCodes: ["602", "6032"], referenceCode: "COS3", signConvention: 'natural' as 'natural' },
              { statementLineName: "Manufacturing Overheads", accountCodes: ["604", "605", "608"], referenceCode: "COS4", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        operatingExpenses: [
          {
            categoryName: "DISTRIBUTION COSTS",
            displayOrder: 1,
            referenceCode: "DC",
            description: "Costs associated with selling and distributing products",
            lines: [
              { statementLineName: "Selling and Distribution Expenses", accountCodes: ["622", "623", "624"], referenceCode: "DC1", signConvention: 'natural' as 'natural' }
            ]
          },
          {
            categoryName: "ADMINISTRATIVE EXPENSES",
            displayOrder: 2,
            referenceCode: "AE",
            description: "General costs of running the business",
            lines: [
              { statementLineName: "Personnel Expenses", accountCodes: ["661", "662", "663", "664"], referenceCode: "AE1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Premises Costs", accountCodes: ["613", "614"], referenceCode: "AE2", signConvention: 'natural' as 'natural' },
              { statementLineName: "General Administrative Expenses", accountCodes: ["61", "62"], referenceCode: "AE3", signConvention: 'natural' as 'natural' },
              { statementLineName: "Depreciation and Amortization", accountCodes: ["681"], referenceCode: "AE4", signConvention: 'natural' as 'natural' }
            ]
          },
          {
            categoryName: "OTHER OPERATING EXPENSES",
            displayOrder: 3,
            referenceCode: "OOE",
            description: "Other expenses related to operations",
            lines: [
              { statementLineName: "Research and Development Costs", accountCodes: ["621"], referenceCode: "OOE1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Impairment of Assets", accountCodes: ["682"], referenceCode: "OOE2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Other Operating Expenses", accountCodes: ["65"], referenceCode: "OOE3", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        otherIncome: [
          {
            categoryName: "OTHER INCOME",
            displayOrder: 1,
            referenceCode: "OI",
            description: "Income from activities outside the main operations",
            lines: [
              { statementLineName: "Interest Income", accountCodes: ["776"], referenceCode: "OI1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Dividend Income", accountCodes: ["772"], referenceCode: "OI2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Gain on Disposal of Assets", accountCodes: ["775"], referenceCode: "OI3", signConvention: 'natural' as 'natural' },
              { statementLineName: "Foreign Exchange Gains", accountCodes: ["777"], referenceCode: "OI4", signConvention: 'natural' as 'natural' },
              { statementLineName: "Other Financial Income", accountCodes: ["778"], referenceCode: "OI5", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        otherExpenses: [
          {
            categoryName: "FINANCE COSTS",
            displayOrder: 1,
            referenceCode: "FC",
            description: "Costs related to financing activities",
            lines: [
              { statementLineName: "Interest Expense", accountCodes: ["671"], referenceCode: "FC1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Bank Charges", accountCodes: ["672"], referenceCode: "FC2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Foreign Exchange Losses", accountCodes: ["676"], referenceCode: "FC3", signConvention: 'natural' as 'natural' },
              { statementLineName: "Other Financial Expenses", accountCodes: ["679"], referenceCode: "FC4", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        incomeTaxExpense: [
          {
            categoryName: "INCOME TAX EXPENSE",
            displayOrder: 1,
            referenceCode: "ITE",
            description: "Current and deferred tax",
            lines: [
              { statementLineName: "Current Tax", accountCodes: ["89"], referenceCode: "ITE1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Deferred Tax", accountCodes: ["892"], referenceCode: "ITE2", signConvention: 'natural' as 'natural' }
            ]
          }
        ]
      };

      // Define IFRS Cash Flow Statement
      const ifrsCashFlow = {
        operatingActivities: [
          {
            categoryName: "CASH FLOWS FROM OPERATING ACTIVITIES",
            displayOrder: 1,
            referenceCode: "CFO",
            description: "Cash flows from core business operations",
            lines: [
              { statementLineName: "Profit/(Loss) Before Tax", accountCodes: ["120", "129"], referenceCode: "CFO1", signConvention: 'natural' as 'natural', isTotalLine: true },
              { statementLineName: "Adjustments for Depreciation and Amortization", accountCodes: ["681"], referenceCode: "CFO2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Adjustments for Impairment Losses", accountCodes: ["682"], referenceCode: "CFO3", signConvention: 'natural' as 'natural' },
              { statementLineName: "Adjustments for Provisions", accountCodes: ["683", "684", "685"], referenceCode: "CFO4", signConvention: 'natural' as 'natural' },
              { statementLineName: "Adjustments for Finance Costs", accountCodes: ["671", "672"], referenceCode: "CFO5", signConvention: 'natural' as 'natural' },
              { statementLineName: "Adjustments for Investment Income", accountCodes: ["772", "776"], referenceCode: "CFO6", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "(Increase)/Decrease in Inventories", accountCodes: ["31", "32", "33", "34", "35", "36", "37"], referenceCode: "CFO7", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "(Increase)/Decrease in Trade Receivables", accountCodes: ["411", "412", "414", "416", "418"], referenceCode: "CFO8", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Increase/(Decrease) in Trade Payables", accountCodes: ["401", "402", "408"], referenceCode: "CFO9", signConvention: 'natural' as 'natural' },
              { statementLineName: "Income Taxes Paid", accountCodes: ["89"], referenceCode: "CFO10", signConvention: 'inverse' as 'inverse' }
            ]
          }
        ],
        investingActivities: [
          {
            categoryName: "CASH FLOWS FROM INVESTING ACTIVITIES",
            displayOrder: 2,
            referenceCode: "CFI",
            description: "Cash flows from acquisition and disposal of long-term assets",
            lines: [
              { statementLineName: "Purchase of Property, Plant and Equipment", accountCodes: ["21", "22", "23", "24"], referenceCode: "CFI1", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Purchase of Intangible Assets", accountCodes: ["20"], referenceCode: "CFI2", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Purchase of Investments", accountCodes: ["26", "27"], referenceCode: "CFI3", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Proceeds from Sale of Property, Plant and Equipment", accountCodes: ["775"], referenceCode: "CFI4", signConvention: 'natural' as 'natural' },
              { statementLineName: "Proceeds from Sale of Investments", accountCodes: ["775"], referenceCode: "CFI5", signConvention: 'natural' as 'natural' },
              { statementLineName: "Interest Received", accountCodes: ["776"], referenceCode: "CFI6", signConvention: 'natural' as 'natural' },
              { statementLineName: "Dividends Received", accountCodes: ["772"], referenceCode: "CFI7", signConvention: 'natural' as 'natural' }
            ]
          }
        ],
        financingActivities: [
          {
            categoryName: "CASH FLOWS FROM FINANCING ACTIVITIES",
            displayOrder: 3,
            referenceCode: "CFF",
            description: "Cash flows from activities that result in changes to equity and borrowings",
            lines: [
              { statementLineName: "Proceeds from Issue of Share Capital", accountCodes: ["101", "102", "104"], referenceCode: "CFF1", signConvention: 'natural' as 'natural' },
              { statementLineName: "Proceeds from Long-term Borrowings", accountCodes: ["16"], referenceCode: "CFF2", signConvention: 'natural' as 'natural' },
              { statementLineName: "Repayment of Borrowings", accountCodes: ["16"], referenceCode: "CFF3", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Payment of Finance Lease Liabilities", accountCodes: ["17"], referenceCode: "CFF4", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Interest Paid", accountCodes: ["671"], referenceCode: "CFF5", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Dividends Paid", accountCodes: ["457"], referenceCode: "CFF6", signConvention: 'inverse' as 'inverse' },
              { statementLineName: "Purchase of Treasury Shares", accountCodes: ["109"], referenceCode: "CFF7", signConvention: 'inverse' as 'inverse' }
            ]
          }
        ]
      };

      // Prepare complete mapping definition based on statement type
      if (statementTypeString === 'balance-sheet') {
        return {
          standard: AccountingStandard.IFRS,
          description: "International Financial Reporting Standards - Statement of Financial Position",
          version: "IFRS",
          effectiveDate: new Date("2023-01-01"),
          assets: ifrsBalanceSheetAssets,
          liabilities: ifrsBalanceSheetLiabilities,
          equity: ifrsBalanceSheetEquity,
          revenue: [], // Not needed for balance sheet
          costOfSales: [], // Not needed for balance sheet
          operatingExpenses: [], // Not needed for balance sheet
          otherIncome: [], // Not needed for balance sheet
          otherExpenses: [], // Not needed for balance sheet
          incomeTaxExpense: [] // Not needed for balance sheet
        };
      } else if (statementTypeString === 'income-statement') {
        return {
          standard: AccountingStandard.IFRS,
          description: "International Financial Reporting Standards - Statement of Profit or Loss and Other Comprehensive Income",
          version: "IFRS",
          effectiveDate: new Date("2023-01-01"),
          assets: [], // Not needed for income statement
          liabilities: [], // Not needed for income statement
          equity: [], // Not needed for income statement
          revenue: ifrsIncomeStatement.revenue,
          costOfSales: ifrsIncomeStatement.costOfSales,
          operatingExpenses: ifrsIncomeStatement.operatingExpenses,
          otherIncome: ifrsIncomeStatement.otherIncome,
          otherExpenses: ifrsIncomeStatement.otherExpenses,
          incomeTaxExpense: ifrsIncomeStatement.incomeTaxExpense
        };
      } else if (statementTypeString === 'cash-flow-statement') {
        return {
          standard: AccountingStandard.IFRS,
          description: "International Financial Reporting Standards - Statement of Cash Flows",
          version: "IFRS",
          effectiveDate: new Date("2023-01-01"),
          assets: [], // Not needed for cash flow statement
          liabilities: [], // Not needed for cash flow statement
          equity: [], // Not needed for cash flow statement
          revenue: [], // Not needed for cash flow statement
          costOfSales: [], // Not needed for cash flow statement
          operatingExpenses: [], // Not needed for cash flow statement
          otherIncome: [], // Not needed for cash flow statement
          otherExpenses: [], // Not needed for cash flow statement
          incomeTaxExpense: [], // Not needed for cash flow statement
          operatingActivities: ifrsCashFlow.operatingActivities,
          investingActivities: ifrsCashFlow.investingActivities,
          financingActivities: ifrsCashFlow.financingActivities
        };
      }
    }
    
    this.logger.warn(`No mapping found for ${standard} and ${statementTypeString}`);
    return null;
  }
}
