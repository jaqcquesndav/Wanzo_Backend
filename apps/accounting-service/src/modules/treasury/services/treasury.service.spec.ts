import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreasuryService } from './treasury.service';
import { TreasuryAccount, AccountType, AccountStatus } from '../entities/treasury-account.entity';
import { TreasuryTransaction, TransactionType, TransactionStatus } from '../entities/treasury-transaction.entity';
import { CreateTreasuryAccountDto, UpdateTreasuryAccountDto, CreateTransactionDto, UpdateTransactionStatusDto, ReconcileAccountDto } from '../dtos/treasury.dto';
import { JournalService } from '../../journals/services/journal.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Create mock repositories
const createMockRepository = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('TreasuryService', () => {
  let service: TreasuryService;
  let accountRepository: ReturnType<typeof createMockRepository>;
  let transactionRepository: ReturnType<typeof createMockRepository>;
  let journalService: JournalService;

  beforeEach(async () => {
    accountRepository = createMockRepository();
    transactionRepository = createMockRepository();
    const mockJournalService = {
      createJournalEntry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        {
          provide: getRepositoryToken(TreasuryAccount),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(TreasuryTransaction),
          useValue: transactionRepository,
        },
        {
          provide: JournalService,
          useValue: mockJournalService,
        },
      ],
    }).compile();

    service = module.get<TreasuryService>(TreasuryService);
    journalService = module.get<JournalService>(JournalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create a new treasury account', async () => {
      const createAccountDto: CreateTreasuryAccountDto = {
        name: 'Test Account',
        accountNumber: '123456789',
        type: AccountType.BANK,
        provider: 'Test Bank',
        currency: 'USD',
      };

      const userId = 'user-id';
      
      const expectedAccount = {
        id: 'account-id',
        ...createAccountDto,
        kiotaId: expect.any(String),
        balance: 0,
        createdBy: userId,
        active: true,
        status: AccountStatus.ACTIVE,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      accountRepository.create.mockReturnValue(expectedAccount);
      accountRepository.save.mockResolvedValue(expectedAccount);

      const result = await service.createAccount(createAccountDto, userId);

      expect(result).toEqual(expectedAccount);
      expect(accountRepository.create).toHaveBeenCalledWith({
        ...createAccountDto,
        kiotaId: expect.any(String),
        createdBy: userId,
      });
      expect(accountRepository.save).toHaveBeenCalledWith(expectedAccount);
    });
  });

  describe('findAllAccounts', () => {
    it('should return all active accounts', async () => {
      const accounts = [
        { id: 'account-1', name: 'Account 1', active: true },
        { id: 'account-2', name: 'Account 2', active: true },
      ];

      accountRepository.find.mockResolvedValue(accounts);

      const result = await service.findAllAccounts();

      expect(result).toEqual(accounts);
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findAccountById', () => {
    it('should return a treasury account by id', async () => {
      const accountId = 'account-id';
      const account = {
        id: accountId,
        name: 'Test Account',
      };

      accountRepository.findOne.mockResolvedValue(account);

      const result = await service.findAccountById(accountId);

      expect(result).toEqual(account);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { id: accountId } });
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'non-existent-id';

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.findAccountById(accountId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccount', () => {
    it('should update a treasury account', async () => {
      const accountId = 'account-id';
      const updateAccountDto: UpdateTreasuryAccountDto = {
        name: 'Updated Account',
      };

      const existingAccount = {
        id: accountId,
        name: 'Test Account',
      };

      const updatedAccount = {
        ...existingAccount,
        name: 'Updated Account',
      };

      accountRepository.findOne.mockResolvedValue(existingAccount);
      accountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(accountId, updateAccountDto);

      expect(result).toEqual(updatedAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { id: accountId } });
      expect(accountRepository.save).toHaveBeenCalledWith({
        ...existingAccount,
        ...updateAccountDto,
      });
    });
  });

  describe('createTransaction', () => {
    it('should create a new treasury transaction', async () => {
      const createTransactionDto: CreateTransactionDto = {
        accountId: 'account-id',
        type: TransactionType.PAYMENT,
        amount: 500,
        date: new Date('2025-06-27'),
        description: 'Test payment',
        fiscalYear: '2025',
        reference: 'TRX-2025-001',
      };

      const userId = 'user-id';
      
      const account = {
        id: 'account-id',
        name: 'Test Account',
      };
      
      const expectedTransaction = {
        id: 'transaction-id',
        ...createTransactionDto,
        kiotaId: expect.any(String),
        status: TransactionStatus.PENDING,
        createdBy: userId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      accountRepository.findOne.mockResolvedValue(account);
      transactionRepository.create.mockReturnValue(expectedTransaction);
      transactionRepository.save.mockResolvedValue(expectedTransaction);

      const result = await service.createTransaction(createTransactionDto, userId);

      expect(result).toEqual(expectedTransaction);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { id: 'account-id' } });
      expect(transactionRepository.create).toHaveBeenCalledWith({
        ...createTransactionDto,
        kiotaId: expect.any(String),
        createdBy: userId,
        status: TransactionStatus.PENDING,
      });
      expect(transactionRepository.save).toHaveBeenCalledWith(expectedTransaction);
    });

    it('should throw NotFoundException when account not found', async () => {
      const createTransactionDto: CreateTransactionDto = {
        accountId: 'non-existent-id',
        type: TransactionType.PAYMENT,
        amount: 500,
        date: new Date('2025-06-27'),
        description: 'Test payment',
        fiscalYear: '2025',
        reference: 'TRX-2025-001',
      };

      const userId = 'user-id';
      
      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.createTransaction(createTransactionDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllTransactions', () => {
    it('should return transactions with filters and pagination', async () => {
      const filters = {
        accountId: 'account-id',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      };
      const page = 1;
      const perPage = 20;
      
      const transactions = [
        { id: 'transaction-1', accountId: 'account-id' },
        { id: 'transaction-2', accountId: 'account-id' },
      ];
      
      transactionRepository.findAndCount.mockResolvedValue([transactions, 2]);

      const result = await service.findAllTransactions(filters, page, perPage);

      expect(result).toEqual({
        transactions,
        total: 2,
        page,
        perPage,
      });
      expect(transactionRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findTransactionById', () => {
    it('should return a transaction by id', async () => {
      const transactionId = 'transaction-id';
      const transaction = {
        id: transactionId,
        type: TransactionType.PAYMENT,
        amount: 500,
      };

      transactionRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findTransactionById(transactionId);

      expect(result).toEqual(transaction);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({ where: { id: transactionId } });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'non-existent-id';

      transactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findTransactionById(transactionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update a transaction status', async () => {
      const transactionId = 'transaction-id';
      const updateStatusDto: UpdateTransactionStatusDto = {
        status: TransactionStatus.COMPLETED,
      };
      const userId = 'user-id';
      
      const existingTransaction = {
        id: transactionId,
        status: TransactionStatus.PENDING,
        accountId: 'account-id',
        amount: 500,
      };
      
      const account = {
        id: 'account-id',
        balance: 1000,
      };
      
      const updatedTransaction = {
        ...existingTransaction,
        status: TransactionStatus.COMPLETED,
        processedBy: userId,
        processedAt: expect.any(Date),
      };

      transactionRepository.findOne.mockResolvedValue(existingTransaction);
      accountRepository.findOne.mockResolvedValue(account);
      transactionRepository.save.mockResolvedValue(updatedTransaction);

      const result = await service.updateTransactionStatus(transactionId, updateStatusDto, userId);

      expect(result).toEqual(updatedTransaction);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({ where: { id: transactionId } });
    });
  });

  describe('getTreasuryBalance', () => {
    it('should return the treasury balance by account type', async () => {
      const type = 'bank';
      
      const accounts = [
        { id: 'account-1', name: 'Account 1', type: AccountType.BANK, balance: 1000 },
        { id: 'account-2', name: 'Account 2', type: AccountType.BANK, balance: 2000 },
      ];
      
      accountRepository.find.mockResolvedValue(accounts);

      const result = await service.getTreasuryBalance(type);

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('accounts');
      expect(accountRepository.find).toHaveBeenCalled();
    });
  });

  describe('reconcileAccount', () => {
    it('should reconcile an account', async () => {
      const accountId = 'account-id';
      const reconcileDto: ReconcileAccountDto = {
        statementId: 'STMT-2025-001',
        endDate: new Date('2025-06-27'),
      };
      const userId = 'user-id';
      
      const account = {
        id: accountId,
        name: 'Test Account',
        lastReconciliation: null,
      };
      
      const updatedAccount = {
        ...account,
        lastReconciliation: reconcileDto.endDate,
      };

      accountRepository.findOne.mockResolvedValue(account);
      accountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.reconcileAccount(accountId, reconcileDto, userId);

      expect(result).toHaveProperty('success', true);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { id: accountId } });
      expect(accountRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: accountId,
        lastReconciliation: reconcileDto.endDate,
      }));
    });
  });
});
