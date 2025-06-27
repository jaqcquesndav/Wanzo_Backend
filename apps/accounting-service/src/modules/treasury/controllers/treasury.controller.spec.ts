import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from '../services/treasury.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateTreasuryAccountDto, UpdateTreasuryAccountDto, CreateTransactionDto, UpdateTransactionStatusDto, TransactionFilterDto, ReconcileAccountDto } from '../dtos/treasury.dto';
import { TransactionType, TransactionStatus } from '../entities/treasury-transaction.entity';
import { AccountType } from '../entities/treasury-account.entity';
import { NotFoundException } from '@nestjs/common';

describe('TreasuryController', () => {
  let controller: TreasuryController;
  let service: TreasuryService;

  const mockTreasuryService = {
    createAccount: jest.fn(),
    findAllAccounts: jest.fn(),
    findAccountById: jest.fn(),
    updateAccount: jest.fn(),
    createTransaction: jest.fn(),
    findAllTransactions: jest.fn(),
    findTransactionById: jest.fn(),
    updateTransactionStatus: jest.fn(),
    getTreasuryBalance: jest.fn(),
    reconcileAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreasuryController],
      providers: [
        {
          provide: TreasuryService,
          useValue: mockTreasuryService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TreasuryController>(TreasuryController);
    service = module.get<TreasuryService>(TreasuryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      const req = {
        user: {
          id: 'user-id',
        },
      };

      const result = {
        id: 'account-id',
        ...createAccountDto,
        kiotaId: 'KIOTA-TRS-123456-AB',
        createdBy: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTreasuryService.createAccount.mockResolvedValue(result);

      expect(await controller.createAccount(createAccountDto, req)).toEqual(result);
      expect(mockTreasuryService.createAccount).toHaveBeenCalledWith(createAccountDto, 'user-id');
    });
  });

  describe('findAllAccounts', () => {
    it('should return all treasury accounts', async () => {
      const accounts = [
        { id: 'account-1', name: 'Account 1' },
        { id: 'account-2', name: 'Account 2' },
      ];

      mockTreasuryService.findAllAccounts.mockResolvedValue(accounts);

      const result = await controller.findAllAccounts();

      expect(result).toEqual({ accounts });
      expect(mockTreasuryService.findAllAccounts).toHaveBeenCalled();
    });
  });

  describe('findAccountById', () => {
    it('should return a single treasury account by id', async () => {
      const accountId = 'account-id';
      const account = {
        id: accountId,
        name: 'Test Account',
        accountNumber: '123456789',
      };

      mockTreasuryService.findAccountById.mockResolvedValue(account);

      const result = await controller.findAccountById(accountId);

      expect(result).toEqual(account);
      expect(mockTreasuryService.findAccountById).toHaveBeenCalledWith(accountId);
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'non-existent-id';

      mockTreasuryService.findAccountById.mockRejectedValue(new NotFoundException('Treasury account not found'));

      await expect(controller.findAccountById(accountId)).rejects.toThrow(NotFoundException);
      expect(mockTreasuryService.findAccountById).toHaveBeenCalledWith(accountId);
    });
  });

  describe('updateAccount', () => {
    it('should update a treasury account', async () => {
      const accountId = 'account-id';
      const updateAccountDto: UpdateTreasuryAccountDto = {
        name: 'Updated Account',
      };

      const updatedAccount = {
        id: accountId,
        name: 'Updated Account',
        accountNumber: '123456789',
      };

      mockTreasuryService.updateAccount.mockResolvedValue(updatedAccount);

      const result = await controller.updateAccount(accountId, updateAccountDto);

      expect(result).toEqual(updatedAccount);
      expect(mockTreasuryService.updateAccount).toHaveBeenCalledWith(accountId, updateAccountDto);
    });
  });

  describe('getAccountTransactions', () => {
    it('should return transactions for an account with filters', async () => {
      const accountId = 'account-id';
      const startDate = '2025-06-01';
      const endDate = '2025-06-30';
      const type = 'debit';
      const page = '1';
      const pageSize = '10';

      const transactions = [
        { id: 'transaction-1', accountId, amount: 100 },
        { id: 'transaction-2', accountId, amount: 200 },
      ];

      mockTreasuryService.findAllTransactions.mockResolvedValue({
        transactions,
        total: 2,
        page: 1,
        perPage: 10,
      });

      const result = await controller.getAccountTransactions(
        accountId,
        startDate,
        endDate,
        type,
        page,
        pageSize,
      );

      expect(result).toEqual({
        transactions,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      expect(mockTreasuryService.findAllTransactions).toHaveBeenCalledWith(
        {
          accountId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        1,
        10,
      );
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

      const req = {
        user: {
          id: 'user-id',
        },
      };

      const result = {
        id: 'transaction-id',
        ...createTransactionDto,
        kiotaId: 'KIOTA-TRX-123456-AB',
        status: TransactionStatus.PENDING,
        createdBy: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTreasuryService.createTransaction.mockResolvedValue(result);

      expect(await controller.createTransaction(createTransactionDto, req)).toEqual(result);
      expect(mockTreasuryService.createTransaction).toHaveBeenCalledWith(createTransactionDto, 'user-id');
    });
  });

  describe('findAllTransactions', () => {
    it('should return all transactions with filters', async () => {
      const page = '1';
      const pageSize = '10';
      const filters: TransactionFilterDto = {
        fiscalYear: '2025',
        type: TransactionType.PAYMENT,
      };

      const transactions = [
        { id: 'transaction-1', type: TransactionType.PAYMENT, amount: 100 },
        { id: 'transaction-2', type: TransactionType.PAYMENT, amount: 200 },
      ];

      mockTreasuryService.findAllTransactions.mockResolvedValue({
        transactions,
        total: 2,
        page: 1,
        perPage: 10,
      });

      const result = await controller.findAllTransactions(page, pageSize, filters);

      expect(result).toEqual({
        transactions,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      expect(mockTreasuryService.findAllTransactions).toHaveBeenCalledWith(filters, 1, 10);
    });
  });

  describe('findTransactionById', () => {
    it('should return a single transaction by id', async () => {
      const transactionId = 'transaction-id';
      const transaction = {
        id: transactionId,
        accountId: 'account-id',
        type: TransactionType.PAYMENT,
        amount: 500,
      };

      mockTreasuryService.findTransactionById.mockResolvedValue(transaction);

      const result = await controller.findTransactionById(transactionId);

      expect(result).toEqual(transaction);
      expect(mockTreasuryService.findTransactionById).toHaveBeenCalledWith(transactionId);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status', async () => {
      const transactionId = 'transaction-id';
      const updateStatusDto: UpdateTransactionStatusDto = {
        status: TransactionStatus.COMPLETED,
      };
      const req = {
        user: {
          id: 'user-id',
        },
      };

      const updatedTransaction = {
        id: transactionId,
        status: TransactionStatus.COMPLETED,
      };

      mockTreasuryService.updateTransactionStatus.mockResolvedValue(updatedTransaction);

      const result = await controller.updateTransactionStatus(transactionId, updateStatusDto, req);

      expect(result).toEqual(updatedTransaction);
      expect(mockTreasuryService.updateTransactionStatus).toHaveBeenCalledWith(
        transactionId,
        updateStatusDto,
        'user-id',
      );
    });
  });

  describe('getTreasuryBalance', () => {
    it('should return the treasury balance', async () => {
      const type = 'bank';
      const balance = {
        total: 5000,
        accounts: [
          { id: 'account-1', name: 'Account 1', balance: 2000 },
          { id: 'account-2', name: 'Account 2', balance: 3000 },
        ],
      };

      mockTreasuryService.getTreasuryBalance.mockResolvedValue(balance);

      const result = await controller.getTreasuryBalance(type);

      expect(result).toEqual(balance);
      expect(mockTreasuryService.getTreasuryBalance).toHaveBeenCalledWith(type);
    });
  });

  describe('reconcileAccount', () => {
    it('should reconcile an account', async () => {
      const accountId = 'account-id';
      const reconcileDto: ReconcileAccountDto = {
        statementId: 'STMT-2025-001',
        endDate: new Date('2025-06-27'),
      };
      const req = {
        user: {
          id: 'user-id',
        },
      };

      const result = {
        success: true,
        message: 'Account reconciliation started',
      };

      mockTreasuryService.reconcileAccount.mockResolvedValue(result);

      expect(await controller.reconcileAccount(accountId, reconcileDto, req)).toEqual(result);
      expect(mockTreasuryService.reconcileAccount).toHaveBeenCalledWith(accountId, reconcileDto, 'user-id');
    });
  });
});
