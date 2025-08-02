import { Test, TestingModule } from '@nestjs/testing';
import { LedgerController } from './ledger.controller';
import { LedgerService } from '../services/ledger.service';
import { AccountBalanceQueryDto, AccountMovementsQueryDto, TrialBalanceQueryDto } from '../dtos/ledger.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

const mockLedgerService = {
  getAccountBalance: jest.fn(),
  getAccountMovements: jest.fn(),
  getTrialBalance: jest.fn(),
  getGeneralLedger: jest.fn(),
  exportLedger: jest.fn(),
  exportBalanceSheet: jest.fn(),
  searchLedger: jest.fn(),
};

const mockRequest = {
  user: {
    sub: 'user-123',
    organizationId: 'org-456'
  }
};

describe('LedgerController', () => {
  let controller: LedgerController;
  let ledgerService: typeof mockLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LedgerController],
      providers: [
        {
          provide: LedgerService,
          useValue: mockLedgerService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<LedgerController>(LedgerController);
    ledgerService = module.get(LedgerService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAccountBalance', () => {
    it('should return account balance', async () => {
      const accountId = 'acc-123';
      const query: AccountBalanceQueryDto = {
        date: '2024-12-31',
        currency: 'XOF'
      };

      const mockBalance = {
        accountId: 'acc-123',
        debit: 1500,
        credit: 200,
        balance: 1300,
        currency: 'XOF'
      };

      ledgerService.getAccountBalance.mockResolvedValue(mockBalance);

      const result = await controller.getAccountBalance(accountId, query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBalance);
      expect(ledgerService.getAccountBalance).toHaveBeenCalledWith(accountId, query);
    });

    it('should handle errors gracefully', async () => {
      ledgerService.getAccountBalance.mockRejectedValue(new Error('Account not found'));

      const result = await controller.getAccountBalance('invalid-id', {}, mockRequest as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account not found');
    });
  });

  describe('getAccountMovements', () => {
    it('should return account movements', async () => {
      const accountId = 'acc-123';
      const query: AccountMovementsQueryDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        pageSize: 10
      };

      const mockMovements = {
        data: [
          {
            id: 'je-1',
            date: '2024-06-15',
            journalType: 'sales',
            description: 'Sale invoice',
            reference: 'INV001',
            totalDebit: 1000,
            totalCredit: 0
          }
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };

      ledgerService.getAccountMovements.mockResolvedValue(mockMovements);

      const result = await controller.getAccountMovements(accountId, query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovements);
      expect(ledgerService.getAccountMovements).toHaveBeenCalledWith(accountId, query);
    });
  });

  describe('getTrialBalance', () => {
    it('should return trial balance', async () => {
      const query: TrialBalanceQueryDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        currency: 'XOF'
      };

      const mockTrialBalance = [
        {
          account: {
            id: 'acc-1',
            code: '411000',
            name: 'Clients',
            type: 'asset'
          },
          debit: 1500,
          credit: 200,
          balance: 1300
        },
        {
          account: {
            id: 'acc-2',
            code: '401000',
            name: 'Fournisseurs',
            type: 'liability'
          },
          debit: 300,
          credit: 800,
          balance: -500
        }
      ];

      ledgerService.getTrialBalance.mockResolvedValue(mockTrialBalance);

      const result = await controller.getTrialBalance(query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTrialBalance);
      expect(ledgerService.getTrialBalance).toHaveBeenCalledWith(query);
    });
  });

  describe('getGeneralLedger', () => {
    it('should return general ledger', async () => {
      const query: TrialBalanceQueryDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const mockGeneralLedger = {
        accounts: [],
        totals: { debit: 1000, credit: 1000 },
        currency: 'XOF',
        period: { startDate: '2024-01-01', endDate: '2024-12-31' },
        generatedAt: '2024-12-31T23:59:59.000Z'
      };

      ledgerService.getGeneralLedger.mockResolvedValue(mockGeneralLedger);

      const result = await controller.getGeneralLedger(query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGeneralLedger);
    });
  });

  describe('alternative endpoints', () => {
    it('should handle alternative account movements endpoint', async () => {
      const accountId = 'acc-123';
      const query: AccountMovementsQueryDto = {};

      const mockMovements = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0
      };

      ledgerService.getAccountMovements.mockResolvedValue(mockMovements);

      const result = await controller.getAccountMovementsAlt(accountId, query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovements);
    });
  });

  describe('export functions', () => {
    it('should export ledger successfully', async () => {
      const query = {
        format: 'csv',
        accountIds: ['acc-1'],
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const mockExportResult = {
        success: true,
        message: 'Ledger exported successfully in csv format',
        downloadUrl: '/downloads/ledger.csv',
        generatedAt: '2024-12-31T23:59:59.000Z'
      };

      ledgerService.exportLedger.mockResolvedValue(mockExportResult);

      const result = await controller.exportLedger(query, mockRequest as any);

      expect(result).toEqual(mockExportResult);
      expect(ledgerService.exportLedger).toHaveBeenCalledWith(query);
    });

    it('should export balance sheet successfully', async () => {
      const query = {
        format: 'pdf',
        mode: 'IFRS',
        date: '2024-12-31'
      };

      const mockExportResult = {
        success: true,
        message: 'Balance sheet exported successfully in pdf format',
        downloadUrl: '/downloads/balance-sheet.pdf',
        mode: 'IFRS',
        date: '2024-12-31',
        generatedAt: '2024-12-31T23:59:59.000Z'
      };

      ledgerService.exportBalanceSheet.mockResolvedValue(mockExportResult);

      const result = await controller.exportBalanceSheet(query, mockRequest as any);

      expect(result).toEqual(mockExportResult);
    });

    it('should handle export errors', async () => {
      ledgerService.exportLedger.mockRejectedValue(new Error('Export failed'));

      const result = await controller.exportLedger({}, mockRequest as any);

      expect(result.success).toBe(false);
      expect('error' in result ? result.error : '').toBe('Export failed');
    });
  });

  describe('searchLedger', () => {
    it('should search ledger entries', async () => {
      const query = {
        query: 'invoice',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        pageSize: 20
      };

      const mockSearchResults = {
        results: [
          {
            id: 'line-1',
            debit: 1000,
            credit: 0,
            journal: {
              id: 'je-1',
              description: 'Sale invoice',
              reference: 'INV001'
            },
            account: {
              id: 'acc-1',
              code: '411000',
              name: 'Clients'
            }
          }
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };

      ledgerService.searchLedger.mockResolvedValue(mockSearchResults);

      const result = await controller.searchLedger(query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSearchResults);
      expect(ledgerService.searchLedger).toHaveBeenCalledWith(query);
    });

    it('should handle search errors', async () => {
      ledgerService.searchLedger.mockRejectedValue(new Error('Search failed'));

      const result = await controller.searchLedger({ query: 'test' }, mockRequest as any);

      expect(result.success).toBe(false);
      expect('error' in result ? result.error : '').toBe('Search failed');
    });
  });
});
