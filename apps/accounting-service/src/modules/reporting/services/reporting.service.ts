import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CompanyService } from '../../company/services/company.service';
import { JournalService } from '../../journals/services/journal.service';
import { AccountService } from '../../accounts/services/account.service';
import { Account, AccountType } from '../../accounts/entities/account.entity';
import { Journal, JournalStatus } from '../../journals/entities/journal.entity';
import { JournalLine } from '../../journals/entities/journal-line.entity';
import { FiscalYearsService } from '../../fiscal-years/services/fiscal-years.service';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';
import { AccountingStandard } from '../../../common/enums/accounting.enum';
import { Company } from '../../company/entities/company.entity';

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
  type?: 'detail' | 'calculation' | 'subtotal' | 'header';
  order?: number;
}

export interface FinancialStatementCategory {
  categoryName: string;
  totalAmount: number;
  lines: FinancialStatementLineItem[];
  displayOrder?: number;
  type?: 'group' | 'summary';
  order?: number;
}

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

  // Cash Flow Statement specific structure
  cashFlowsFromOperatingActivities?: FinancialStatementCategory[];
  cashFlowsFromInvestingActivities?: FinancialStatementCategory[];
  cashFlowsFromFinancingActivities?: FinancialStatementCategory[];
  netIncreaseInCash?: number;
  cashAtBeginningOfPeriod?: number;
  cashAtEndOfPeriod?: number;

  currency?: string;
  notes?: string;

  rawData?: any;
}

export interface AccountMappingConfig {
  statementLineName: string;
  accountCodes: string[];
  description?: string;
  signConvention?: 'natural' | 'inverse';
  calculationFormula?: string;
  accountingStandardNote?: string;
  referenceCode?: string;
  type?: 'detail' | 'calculation' | 'subtotal' | 'header';
  order?: number;
}

export interface StatementCategoryMapping {
  categoryName: string;
  lines: AccountMappingConfig[];
  subCategories?: StatementCategoryMapping[];
  displayOrder?: number;
  description?: string;
  referenceCode?: string;
  type?: 'group' | 'summary';
  order?: number;
}

export interface FinancialStatementMappingDefinition {
  standard: AccountingStandard;
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
  accountType: AccountType;
  beginningBalance: number;
  entries: GeneralLedgerEntry[];
  endingBalance: number;
  totalDebits: number;
  totalCredits: number;
}

export interface TrialBalanceLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
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
    private readonly fiscalYearsService: FiscalYearsService,
    private readonly accountService: AccountService,
    private readonly journalService: JournalService,
  ) {}

  async getGeneralLedgerForAccount(companyId: string, fiscalYearId: string, accountId: string, options?: ReportGenerationOptions): Promise<GeneralLedgerAccountView> {
    this.logger.log(`Generating General Ledger for company: ${companyId}, fiscal year: ${fiscalYearId}, account: ${accountId}`);

    const company = await this.companyService.findById(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const fiscalYear = await this.fiscalYearsService.findOne(fiscalYearId, companyId);
    if (!fiscalYear) {
      throw new NotFoundException(`Fiscal year with ID ${fiscalYearId} not found for company ${companyId}`);
    }

    const account = await this.accountService.findById(accountId);
    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found for company ${companyId}`);
    }

    // Apply date filters based on options or use fiscal year dates
    const startDate = options?.startDate || fiscalYear.startDate;
    const endDate = options?.endDate || fiscalYear.endDate;

    // Retrieve journal lines using the findLinesByAccountAndFilters method
    const journalLines = await this.journalService.findLinesByAccountAndFilters(
      accountId,
      {
        companyId,
        fiscalYearId,
        startDate,
        endDate
      }
    );

    // Process the journal lines to create the general ledger view
    const glView = await this.processJournalLinesToGeneralLedger(account, journalLines, startDate, endDate);

    return glView;
  }

  private async processJournalLinesToGeneralLedger(account: Account, journalLines: JournalLine[], startDate: Date, endDate: Date): Promise<GeneralLedgerAccountView> {
    // Prepare the GL view structure
    const glView: GeneralLedgerAccountView = {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      beginningBalance: 0, // Will be calculated
      entries: [],
      endingBalance: 0, // Will be calculated
      totalDebits: 0,
      totalCredits: 0,
    };

    // Sort journal lines by date and then by journal ID for consistent ordering
    journalLines.sort((a, b) => {
      if (a.journal.date.getTime() !== b.journal.date.getTime()) {
        return a.journal.date.getTime() - b.journal.date.getTime();
      }
      return a.journal.id.localeCompare(b.journal.id);
    });

    // Calculate beginning balance (sum of all entries before startDate)
    const beforeStartDateLines = journalLines.filter(line => line.journal.date < startDate);
    for (const line of beforeStartDateLines) {
      if (line.debit) glView.beginningBalance += line.debit;
      if (line.credit) glView.beginningBalance -= line.credit;
    }

    // Process entries within the date range
    let currentBalance = glView.beginningBalance;
    const entries: GeneralLedgerEntry[] = [];

    for (const line of journalLines) {
      // Skip lines outside of the date range
      if (line.journal.date < startDate || line.journal.date > endDate) {
        continue;
      }
      const debit = line.debit || 0;
      const credit = line.credit || 0;
      
      currentBalance += (debit - credit); 

      entries.push({
        date: line.journal.date,
        journalId: line.journal.id,
        journalReference: line.journal.reference,
        description: line.description || line.journal.description || '',
        debit,
        credit,
        balance: currentBalance,
      });

      glView.totalDebits += debit;
      glView.totalCredits += credit;
    }

    glView.entries = entries;
    glView.endingBalance = currentBalance;

    return glView;
  }

  async getTrialBalance(companyId: string, fiscalYearId: string, asOfDate?: Date): Promise<TrialBalanceLineItem[]> {
    this.logger.log(`Generating Trial Balance for company: ${companyId}, fiscal year: ${fiscalYearId}, as of: ${asOfDate}`);

    const company = await this.companyService.findById(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const fiscalYear = await this.fiscalYearsService.findOne(fiscalYearId, companyId);
    if (!fiscalYear) {
      throw new NotFoundException(`Fiscal year with ID ${fiscalYearId} not found for company ${companyId}`);
    }

    // Use the asOfDate parameter or fall back to fiscal year end date
    const effectiveAsOfDate = asOfDate || fiscalYear.endDate;
    
    // Ensure the effective date is within the fiscal year
    if (effectiveAsOfDate < fiscalYear.startDate || effectiveAsOfDate > fiscalYear.endDate) {
      throw new BadRequestException(`As-of date ${effectiveAsOfDate.toISOString()} is outside the fiscal year range ${fiscalYear.startDate.toISOString()} to ${fiscalYear.endDate.toISOString()}`);
    }

    // Get all accounts for the company using the findAll method with filter
    const accountsResult = await this.accountService.findAll({ companyId });
    
    // Extract the actual accounts array from the paginated result
    const accounts = accountsResult.accounts;
    
    // We need to get journal lines for each account in the trial balance period
    let allJournalLines: JournalLine[] = [];
    
    // For each account, get its journal lines for the period
    for (const account of accounts) {
      const accountJournalLines = await this.journalService.findLinesByAccountAndFilters(
        account.id,
        {
          companyId,
          fiscalYearId,
          startDate: fiscalYear.startDate,
          endDate: effectiveAsOfDate
        }
      );
      
      allJournalLines = [...allJournalLines, ...accountJournalLines];
    }

    // Calculate trial balance lines
    return this.calculateTrialBalance(accounts, allJournalLines, fiscalYear);
  }

  private calculateTrialBalance(accounts: Account[], journalLines: JournalLine[], fiscalYear: FiscalYear): TrialBalanceLineItem[] {
    const trialBalanceLines: TrialBalanceLineItem[] = [];
    
    // Group journal lines by account
    const linesByAccount = new Map<string, JournalLine[]>();
    
    for (const line of journalLines) {
      const accountId = line.accountId;
      if (!linesByAccount.has(accountId)) {
        linesByAccount.set(accountId, []);
      }
      linesByAccount.get(accountId)?.push(line);
    }
    
    // Process each account
    for (const account of accounts) {
      const accountLines = linesByAccount.get(account.id) || [];
      
      // Split lines into opening balance (before fiscal year) and period activity
      const openingBalanceLines = accountLines.filter(line => 
        line.journal.date < fiscalYear.startDate
      );
      
      const periodLines = accountLines.filter(line => 
        line.journal.date >= fiscalYear.startDate && 
        line.journal.date <= fiscalYear.endDate
      );
      
      // Calculate opening balance
      let openingDebit = 0;
      let openingCredit = 0;
      
      for (const line of openingBalanceLines) {
        if (line.debit) openingDebit += line.debit;
        if (line.credit) openingCredit += line.credit;
      }
      
      // Calculate period activity
      let periodDebit = 0;
      let periodCredit = 0;
      
      for (const line of periodLines) {
        if (line.debit) periodDebit += line.debit;
        if (line.credit) periodCredit += line.credit;
      }
      
      // Calculate closing balance
      const calculatedClosingDebit = openingDebit + periodDebit;
      const calculatedClosingCredit = openingCredit + periodCredit;
      
      trialBalanceLines.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
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
