import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerService } from './ledger.service';
import { Account } from '../../accounts/entities/account.entity';
import { Journal } from '../../journals/entities/journal.entity';
import { JournalLine } from '../../journals/entities/journal-line.entity';
import { AccountBalanceQueryDto, AccountMovementsQueryDto, TrialBalanceQueryDto } from '../dtos/ledger.dto';
import { NotFoundException } from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawMany: jest.fn().mockResolvedValue([])
  }))
});

// Helper function to create complete mock query builder with custom return value
const createMockQueryBuilder = (customMethods = {}) => ({
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getRawMany: jest.fn().mockResolvedValue([]),
  ...customMethods
});

describe('LedgerService', () => {
  let service: LedgerService;
  let accountRepository: ReturnType<typeof createMockRepository>;
  let journalRepository: ReturnType<typeof createMockRepository>;
  let journalLineRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    accountRepository = createMockRepository();
    journalRepository = createMockRepository();
    journalLineRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(Journal),
          useValue: journalRepository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: journalLineRepository,
        },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccountBalance', () => {
    it('should return account balance for asset account', async () => {
      const accountId = 'acc-1';
      const query: AccountBalanceQueryDto = {
        date: '2024-12-31',
        currency: 'XOF'
      };

      const mockAccount = {
        id: accountId,
        code: '411000',
        name: 'Clients',
        type: 'asset'
      };

      const mockJournalLines = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 200 },
        { debit: 500, credit: 0 }
      ];

      accountRepository.findOne.mockResolvedValue(mockAccount);
      
      const mockQueryBuilder = createMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(mockJournalLines)
      });
      
      journalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountBalance(accountId, query);

      expect(result.accountId).toBe(accountId);
      expect(result.debit).toBe(1500);
      expect(result.credit).toBe(200);
      expect(result.balance).toBe(1300); // For asset: debit - credit
      expect(result.currency).toBe('XOF');
    });

    it('should throw NotFoundException for non-existent account', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAccountBalance('non-existent', {})
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate balance correctly for liability account', async () => {
      const mockAccount = {
        id: 'acc-2',
        type: 'liability'
      };

      const mockJournalLines = [
        { debit: 500, credit: 0 },
        { debit: 0, credit: 1000 }
      ];

      accountRepository.findOne.mockResolvedValue(mockAccount);
      
      const mockQueryBuilder = createMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(mockJournalLines)
      });
      
      journalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountBalance('acc-2', {});

      expect(result.balance).toBe(500); // For liability: credit - debit = 1000 - 500 = 500
    });
  });

  describe('getAccountMovements', () => {
    it('should return paginated account movements', async () => {
      const accountId = 'acc-1';
      const query: AccountMovementsQueryDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        pageSize: 10
      };

      const mockAccount = {
        id: accountId,
        code: '411000',
        name: 'Clients',
        type: 'asset'
      };

      const mockMovements = [
        {
          id: 'je-1',
          date: new Date('2024-06-15'),
          journalType: 'sales',
          description: 'Sale invoice',
          reference: 'INV001',
          status: 'posted',
          lines: [{ accountId: 'acc-1' }],
          totalDebit: 1000,
          totalCredit: 0,
          totalVat: 0
        }
      ];

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const mockQueryBuilder = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([mockMovements, 1])
      });

      journalRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountMovements(accountId, query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('je-1');
      expect(result.data[0].date).toBe('2024-06-15');
      expect(result.data[0].journalType).toBe('sales');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should throw NotFoundException for non-existent account', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAccountMovements('non-existent', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTrialBalance', () => {
    it('should return trial balance with account balances', async () => {
      const query: TrialBalanceQueryDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        currency: 'XOF'
      };

      const mockAccounts = [
        {
          id: 'acc-1',
          code: '411000',
          name: 'Clients',
          type: 'asset',
          class: '4'
        },
        {
          id: 'acc-2',
          code: '401000',
          name: 'Fournisseurs',
          type: 'liability',
          class: '4'
        }
      ];

      const mockJournalLines = [
        { debit: 1500, credit: 200 },
        { debit: 300, credit: 800 }
      ];

      // Mock account query
      const mockAccountQueryBuilder = createMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(mockAccounts)
      });
      accountRepository.createQueryBuilder.mockReturnValue(mockAccountQueryBuilder);

      // Mock journal line query  
      const mockLineQueryBuilder = createMockQueryBuilder({
        getMany: jest.fn()
          .mockResolvedValueOnce([{ debit: 1500, credit: 200 }]) // For first account
          .mockResolvedValueOnce([{ debit: 300, credit: 800 }])   // For second account
      });
      journalLineRepository.createQueryBuilder.mockReturnValue(mockLineQueryBuilder);

      const result = await service.getTrialBalance(query);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].accountCode).toBe('401000'); // First in alphabetical order
      expect(result.entries[1].accountCode).toBe('411000'); // Second in alphabetical order
      expect(result.entries[1].debit).toBe(1500);
      expect(result.entries[1].credit).toBe(200);
      expect(result.entries[1].balance).toBe(1300); // Asset account balance
      
      expect(result.entries[0].balance).toBe(500); // Liability account balance
    });

    it('should filter out zero balances when includeZeroBalance is false', async () => {
      const query: TrialBalanceQueryDto = {
        includeZeroBalance: false
      };

      const mockAccounts = [
        {
          id: 'acc-1',
          code: '411000',
          name: 'Clients',
          type: 'asset',
          class: '4'
        },
        {
          id: 'acc-2',
          code: '401000',
          name: 'Fournisseurs',
          type: 'liability',
          class: '4'
        }
      ];

      // Mock account query
      const mockAccountQueryBuilder = createMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(mockAccounts)
      });
      accountRepository.createQueryBuilder.mockReturnValue(mockAccountQueryBuilder);

      // Mock journal line query - first account has zero balance, second has balance
      const mockLineQueryBuilder = createMockQueryBuilder({
        getMany: jest.fn()
          .mockResolvedValueOnce([{ debit: 1000, credit: 1000 }]) // Zero balance for first account
          .mockResolvedValueOnce([{ debit: 300, credit: 800 }])   // Non-zero balance for second account
      });
      journalLineRepository.createQueryBuilder.mockReturnValue(mockLineQueryBuilder);

      const result = await service.getTrialBalance(query);

      expect(result.entries).toHaveLength(1); // Only non-zero balance account
      expect(result.entries[0].accountCode).toBe('401000');
    });
  });

  describe('export functions', () => {
    it('should export ledger with correct format', async () => {
      const query = {
        format: 'csv',
        accountIds: ['acc-1'],
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const result = await service.exportLedger(query);

      expect(result.success).toBe(true);
      expect(result.message).toContain('csv format');
      expect(result.downloadUrl).toContain('.csv');
    });

    it('should export balance sheet with specified mode', async () => {
      const query = {
        format: 'pdf',
        mode: 'IFRS',
        date: '2024-12-31'
      };

      const result = await service.exportBalanceSheet(query);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('IFRS');
      expect(result.date).toBe('2024-12-31');
    });
  });

  describe('searchLedger', () => {
    it('should search ledger entries with query term', async () => {
      const query = {
        query: 'invoice',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        pageSize: 20
      };

      const mockSearchResults = [
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
      ];

      const mockQueryBuilder = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([mockSearchResults, 1])
      });

      journalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchLedger(query);

      expect(result.results).toEqual(mockSearchResults);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should return empty results for empty search term', async () => {
      const result = await service.searchLedger({ query: '' });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
