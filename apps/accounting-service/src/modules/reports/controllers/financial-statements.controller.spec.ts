import { Test, TestingModule } from '@nestjs/testing';
import { FinancialStatementsController } from './financial-statements.controller';
import { FinancialStatementsService } from '../services/financial-statements.service';
import { AccountingFramework } from '../dtos/report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('FinancialStatementsController', () => {
  let controller: FinancialStatementsController;
  let service: FinancialStatementsService;
  const mockFinancialStatementsService = {
    generateBalanceSheet: jest.fn(),
    generateIncomeStatement: jest.fn(),
    generateCashFlowStatement: jest.fn(),
    generateTrialBalance: jest.fn(),
    generateGeneralLedger: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialStatementsController],
      providers: [
        {
          provide: FinancialStatementsService,
          useValue: mockFinancialStatementsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FinancialStatementsController>(FinancialStatementsController);
    service = module.get<FinancialStatementsService>(FinancialStatementsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalanceSheet', () => {
    it('should generate a balance sheet', async () => {
      const fiscalYear = 'fiscal-year-id';
      const asOfDate = new Date('2025-12-31');
      const framework = AccountingFramework.SYSCOHADA;
      const req = { user: { companyId: 'company-id' } };

      const balanceSheetData = {
        assets: [
          { code: '101', name: 'Cash', amount: 5000 },
          { code: '201', name: 'Accounts Receivable', amount: 3000 },
        ],
        liabilities: [
          { code: '401', name: 'Accounts Payable', amount: 2000 },
        ],
        equity: [
          { code: '501', name: 'Capital Stock', amount: 6000 },
        ],
        totalAssets: 8000,
        totalLiabilitiesAndEquity: 8000,
      };

      mockFinancialStatementsService.generateBalanceSheet.mockResolvedValue(balanceSheetData);
      // Correction : adapter l'attente à la structure réelle
      const result = await controller.getBalanceSheet(fiscalYear, asOfDate, framework, req);
      expect(result).toEqual(balanceSheetData);
      expect(mockFinancialStatementsService.generateBalanceSheet).toHaveBeenCalledWith(
        'company-id',
        fiscalYear,
        asOfDate,
        framework,
      );
    });
  });

  describe('getIncomeStatement', () => {
    it('should generate an income statement', async () => {
      const fiscalYear = 'fiscal-year-id';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const framework = AccountingFramework.SYSCOHADA;
      const req = { user: { companyId: 'company-id' } };

      const incomeStatementData = {
        revenue: [
          { code: '701', name: 'Sales Revenue', amount: 10000 },
        ],
        expenses: [
          { code: '601', name: 'Cost of Goods Sold', amount: 6000 },
          { code: '602', name: 'Operating Expenses', amount: 2000 },
        ],
        totalRevenue: 10000,
        totalExpenses: 8000,
        netIncome: 2000,
      };

      mockFinancialStatementsService.generateIncomeStatement.mockResolvedValue(incomeStatementData);
      // Correction : adapter l'attente à la structure réelle
      const result = await controller.getIncomeStatement(fiscalYear, startDate, endDate, framework, req);
      expect(result).toEqual(incomeStatementData);
      expect(mockFinancialStatementsService.generateIncomeStatement).toHaveBeenCalledWith(
        'company-id',
        fiscalYear,
        startDate,
        endDate,
        framework,
      );
    });
  });
  describe('getCashFlowStatement', () => {
    it('should generate a cash flow statement', async () => {
      const fiscalYear = 'fiscal-year-id';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const framework = AccountingFramework.SYSCOHADA;
      const req = { user: { companyId: 'company-id' } };

      const cashFlowData = {
        operatingActivities: [
          { description: 'Net Income', amount: 2000 },
          { description: 'Depreciation', amount: 1000 },
        ],
        investingActivities: [
          { description: 'Purchase of Equipment', amount: -3000 },
        ],
        financingActivities: [
          { description: 'Loan Proceeds', amount: 5000 },
        ],
        netCashFromOperating: 3000,
        netCashFromInvesting: -3000,
        netCashFromFinancing: 5000,
        netChangeInCash: 5000,
      };

      mockFinancialStatementsService.generateCashFlowStatement.mockResolvedValue(cashFlowData);

      const result = await controller.getCashFlowStatement(fiscalYear, startDate, endDate, framework, req);      expect(result).toEqual(cashFlowData);

      expect(mockFinancialStatementsService.generateCashFlowStatement).toHaveBeenCalledWith(
        'company-id',
        fiscalYear,
        startDate,
        endDate,
        framework,
      );
    });
  });

  describe('getTrialBalance', () => {
    it('should generate a trial balance', async () => {
      const fiscalYear = 'fiscal-year-id';
      const asOfDate = new Date('2025-12-31');
      const req = { user: { companyId: 'company-id' } };

      const trialBalanceData = {
        accounts: [
          { code: '101', name: 'Cash', debit: 5000, credit: 0, balance: 5000 },
          { code: '201', name: 'Accounts Receivable', debit: 3000, credit: 0, balance: 3000 },
          { code: '401', name: 'Accounts Payable', debit: 0, credit: 2000, balance: -2000 },
        ],
        totalDebit: 8000,
        totalCredit: 2000,
        balanced: true,
      };

      mockFinancialStatementsService.generateTrialBalance.mockResolvedValue(trialBalanceData);
      // Correction : adapter l'attente à la structure réelle
      const result = await controller.getTrialBalance(fiscalYear, asOfDate, req);
      expect(result).toEqual({
        success: true,
        trialBalance: trialBalanceData,
      });
      expect(mockFinancialStatementsService.generateTrialBalance).toHaveBeenCalledWith(
        'company-id',
        fiscalYear,
        asOfDate,
      );
    });
  });
  describe('getGeneralLedger', () => {
    it('should generate a general ledger', async () => {
      const fiscalYear = 'fiscal-year-id';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const req = { user: { companyId: 'company-id' } };

      const generalLedgerData = {
        accounts: [
          {
            code: '101',
            name: 'Cash',
            transactions: [
              { date: new Date('2025-03-15'), description: 'Sale', debit: 5000, credit: 0 },
              { date: new Date('2025-04-20'), description: 'Purchase', debit: 0, credit: 2000 },
            ],
            opening: 0,
            debit: 5000,
            credit: 2000,
            balance: 3000
          },
        ],
      };

      mockFinancialStatementsService.generateGeneralLedger.mockResolvedValue(generalLedgerData);

      const result = await controller.getGeneralLedger(fiscalYear, startDate, endDate, req);

      expect(result).toEqual({
        success: true,
        generalLedger: generalLedgerData,
      });

      expect(mockFinancialStatementsService.generateGeneralLedger).toHaveBeenCalledWith(
        'company-id',
        fiscalYear,
        startDate,
        endDate,
      );
    });
  });
});
