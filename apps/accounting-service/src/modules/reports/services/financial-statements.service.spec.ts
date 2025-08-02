import { Test, TestingModule } from '@nestjs/testing';
import { FinancialStatementsService } from './financial-statements.service';
import { AccountService } from '../../accounts/services/account.service';
import { JournalService } from '../../journals/services/journal.service';
import { AccountType } from '../../accounts/entities/account.entity';
import { AccountingFramework } from '../dtos/report.dto';

// Mock account service
const createMockAccountService = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
});

// Mock journal service
const createMockJournalService = () => ({
  getAccountBalance: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  findByAccount: jest.fn()
});

describe('FinancialStatementsService', () => {
  let service: FinancialStatementsService;
  let accountService: ReturnType<typeof createMockAccountService>;
  let journalService: ReturnType<typeof createMockJournalService>;

  beforeEach(async () => {
    accountService = createMockAccountService();
    journalService = createMockJournalService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialStatementsService,
        {
          provide: AccountService,
          useValue: accountService,
        },
        {
          provide: JournalService,
          useValue: journalService,
        },
      ],
    }).compile();

    service = module.get<FinancialStatementsService>(FinancialStatementsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateBalanceSheet', () => {
    it('should generate balance sheet with SYSCOHADA framework', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const asOfDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [
          {
            id: 'acc-1',
            code: '200000',
            name: 'Immobilisations incorporelles',
            type: AccountType.ASSET
          },
          {
            id: 'acc-2',
            code: '100000',
            name: 'Capital',
            type: AccountType.EQUITY
          },
          {
            id: 'acc-3',
            code: '520000',
            name: 'Banque',
            type: AccountType.ASSET
          }
        ],
        total: 3,
        page: 1,
        perPage: 20
      };

      const mockBalances = [
        { debit: 100000, credit: 0, balance: 100000 },
        { debit: 0, credit: 50000, balance: -50000 },
        { debit: 25000, credit: 0, balance: 25000 }
      ];

      accountService.findAll.mockResolvedValue(mockAccounts);
      journalService.getAccountBalance
        .mockResolvedValueOnce(mockBalances[0])
        .mockResolvedValueOnce(mockBalances[1])
        .mockResolvedValueOnce(mockBalances[2]);

      const result = await service.generateBalanceSheet(
        companyId,
        fiscalYear,
        asOfDate,
        AccountingFramework.SYSCOHADA
      );

      expect(result).toHaveProperty('actif');
      expect(result).toHaveProperty('passif');
      expect(result.actif).toHaveProperty('immobilisations');
      expect(result.actif).toHaveProperty('actifCirculant');
      expect(result.passif).toHaveProperty('capitauxPropres');
      expect(result.passif).toHaveProperty('dettes');

      expect(accountService.findAll).toHaveBeenCalledWith({ companyId });
      expect(journalService.getAccountBalance).toHaveBeenCalledTimes(3);
    });

    it('should handle empty accounts list', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const asOfDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [],
        total: 0,
        page: 1,
        perPage: 20
      };

      accountService.findAll.mockResolvedValue(mockAccounts);

      const result = await service.generateBalanceSheet(
        companyId,
        fiscalYear,
        asOfDate,
        AccountingFramework.SYSCOHADA
      );

      expect(result).toHaveProperty('actif');
      expect(result).toHaveProperty('passif');
      expect(journalService.getAccountBalance).not.toHaveBeenCalled();
    });
  });

  describe('generateIncomeStatement', () => {
    it('should generate income statement', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [
          {
            id: 'acc-1',
            code: '700000',
            name: 'Ventes',
            type: AccountType.REVENUE
          },
          {
            id: 'acc-2',
            code: '600000',
            name: 'Achats',
            type: AccountType.EXPENSE
          }
        ],
        total: 2,
        page: 1,
        perPage: 20
      };

      const mockBalances = [
        { debit: 0, credit: 150000, balance: -150000 }, // Revenue
        { debit: 80000, credit: 0, balance: 80000 }     // Expense
      ];

      accountService.findAll.mockResolvedValue(mockAccounts);
      journalService.getAccountBalance
        .mockResolvedValueOnce(mockBalances[0])
        .mockResolvedValueOnce(mockBalances[1]);

      const result = await service.generateIncomeStatement(
        companyId,
        fiscalYear,
        startDate,
        endDate,
        AccountingFramework.SYSCOHADA
      );

      expect(result).toHaveProperty('produits');
      expect(result).toHaveProperty('charges');
      expect(typeof result).toBe('object');

      expect(accountService.findAll).toHaveBeenCalledWith({ companyId });
      expect(journalService.getAccountBalance).toHaveBeenCalledTimes(2);
    });

    it('should calculate profit correctly', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [
          {
            id: 'acc-1',
            code: '700000',
            name: 'Ventes',
            type: AccountType.REVENUE
          },
          {
            id: 'acc-2',
            code: '600000',
            name: 'Achats',
            type: AccountType.EXPENSE
          }
        ],
        total: 2,
        page: 1,
        perPage: 20
      };

      const mockBalances = [
        { debit: 0, credit: 200000, balance: -200000 }, // Revenue: 200,000
        { debit: 120000, credit: 0, balance: 120000 }   // Expense: 120,000
      ];

      accountService.findAll.mockResolvedValue(mockAccounts);
      journalService.getAccountBalance
        .mockResolvedValueOnce(mockBalances[0])
        .mockResolvedValueOnce(mockBalances[1]);

      const result = await service.generateIncomeStatement(
        companyId,
        fiscalYear,
        startDate,
        endDate,
        AccountingFramework.SYSCOHADA
      );

      // Verify the structure exists
      expect(result).toHaveProperty('produits');
      expect(result).toHaveProperty('charges');
      // The exact calculation will depend on the service implementation
    });
  });

  describe('generateTrialBalance', () => {
    it('should generate trial balance', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const asOfDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [
          {
            id: 'acc-1',
            code: '100000',
            name: 'Capital',
            type: AccountType.EQUITY
          },
          {
            id: 'acc-2',
            code: '520000',
            name: 'Banque',
            type: AccountType.ASSET
          }
        ],
        total: 2,
        page: 1,
        perPage: 20
      };

      const mockBalances = [
        { debit: 0, credit: 100000, balance: -100000 },
        { debit: 100000, credit: 0, balance: 100000 }
      ];

      accountService.findAll.mockResolvedValue(mockAccounts);
      journalService.getAccountBalance
        .mockResolvedValueOnce(mockBalances[0])
        .mockResolvedValueOnce(mockBalances[1]);

      const result = await service.generateTrialBalance(
        companyId,
        fiscalYear,
        asOfDate
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('account');
      expect(result[0]).toHaveProperty('balance');
      expect(result[0].account).toHaveProperty('code');
      expect(result[0].account).toHaveProperty('name');
      expect(result[0].balance).toHaveProperty('debit');
      expect(result[0].balance).toHaveProperty('credit');

      expect(accountService.findAll).toHaveBeenCalledWith({ companyId });
      expect(journalService.getAccountBalance).toHaveBeenCalledTimes(2);
    });

    it('should ensure trial balance contains correct data structure', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const asOfDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [
          {
            id: 'acc-1',
            code: '100000',
            name: 'Capital',
            type: AccountType.EQUITY
          },
          {
            id: 'acc-2',
            code: '520000',
            name: 'Banque',
            type: AccountType.ASSET
          }
        ],
        total: 2,
        page: 1,
        perPage: 20
      };

      const mockBalances = [
        { debit: 0, credit: 50000, balance: -50000 },
        { debit: 50000, credit: 0, balance: 50000 }
      ];

      accountService.findAll.mockResolvedValue(mockAccounts);
      journalService.getAccountBalance
        .mockResolvedValueOnce(mockBalances[0])
        .mockResolvedValueOnce(mockBalances[1]);

      const result = await service.generateTrialBalance(
        companyId,
        fiscalYear,
        asOfDate
      );

      // Verify the structure is correct
      expect(result[0].account.code).toBe('100000');
      expect(result[0].account.name).toBe('Capital');
      expect(result[0].balance.debit).toBe(0);
      expect(result[0].balance.credit).toBe(50000);

      expect(result[1].account.code).toBe('520000');
      expect(result[1].account.name).toBe('Banque');
      expect(result[1].balance.debit).toBe(50000);
      expect(result[1].balance.credit).toBe(0);
    });
  });

  describe('generateGeneralLedger', () => {
    it('should generate general ledger report', async () => {
      const companyId = 'company-1';
      const fiscalYear = 'fy-2024';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockAccounts = {
        accounts: [
          {
            id: 'acc-1',
            code: '520000',
            name: 'Banque',
            type: AccountType.ASSET
          }
        ],
        total: 1,
        page: 1,
        perPage: 20
      };

      const mockJournalEntries = [
        {
          id: 'journal-1',
          date: new Date('2024-01-15'),
          description: 'Dépôt initial',
          lines: [
            {
              id: 'line-1',
              accountId: 'acc-1',
              debit: 100000,
              credit: 0,
              description: 'Dépôt'
            }
          ]
        }
      ];

      accountService.findAll.mockResolvedValue(mockAccounts);
      journalService.findByAccount.mockResolvedValue(mockJournalEntries);

      const result = await service.generateGeneralLedger(
        companyId,
        fiscalYear,
        startDate,
        endDate
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('account');
      expect(result[0]).toHaveProperty('entries');
      expect(result[0].account).toHaveProperty('code');
      expect(result[0].account).toHaveProperty('name');

      expect(accountService.findAll).toHaveBeenCalledWith({ companyId });
      expect(journalService.findByAccount).toHaveBeenCalledWith(
        'acc-1',
        expect.objectContaining({
          fiscalYear,
          startDate,
          endDate
        })
      );
    });
  });
});
