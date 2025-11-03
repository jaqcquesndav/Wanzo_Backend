import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountService } from './account.service';
import { Account, AccountType } from '../entities/account.entity';
import { FiscalYearsService } from '../../fiscal-years/services/fiscal-year.service';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from '../dtos/account.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

// Mock repository factory
const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0])
  }))
});

// Mock fiscal years service
const createMockFiscalYearsService = () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getActiveFiscalYear: jest.fn()
});

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: ReturnType<typeof createMockRepository>;
  let fiscalYearsService: ReturnType<typeof createMockFiscalYearsService>;

  beforeEach(async () => {
    accountRepository = createMockRepository();
    fiscalYearsService = createMockFiscalYearsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: FiscalYearsService,
          useValue: fiscalYearsService,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new account', async () => {
      const createAccountDto: CreateAccountDto = {
        code: '100',
        name: 'Cash Account',
        type: AccountType.ASSET,
        class: '1',
        companyId: 'company-1',
        fiscalYearId: 'fy-2024',
        description: 'Cash and cash equivalents'
      };

      const savedAccount = {
        id: 'account-1',
        ...createAccountDto,
        createdBy: 'user-1'
      };

      accountRepository.findOne.mockResolvedValue(null); // No existing account
      accountRepository.create.mockReturnValue(savedAccount);
      accountRepository.save.mockResolvedValue(savedAccount);

      const result = await service.create(createAccountDto, 'user-1');

      expect(result).toEqual(savedAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: {
          code: createAccountDto.code,
          companyId: createAccountDto.companyId,
          fiscalYearId: createAccountDto.fiscalYearId
        }
      });
      expect(accountRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if account code already exists', async () => {
      const createAccountDto: CreateAccountDto = {
        code: '100',
        name: 'Cash Account',
        type: AccountType.ASSET,
        class: '1',
        companyId: 'company-1',
        fiscalYearId: 'fy-2024'
      };

      const existingAccount = {
        id: 'existing-account',
        code: '100',
        companyId: 'company-1',
        fiscalYearId: 'fy-2024'
      };

      accountRepository.findOne.mockResolvedValue(existingAccount);

      await expect(service.create(createAccountDto, 'user-1'))
        .rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent account does not exist', async () => {
      const createAccountDto: CreateAccountDto = {
        code: '110',
        name: 'Savings Account',
        type: AccountType.ASSET,
        class: '1',
        companyId: 'company-1',
        fiscalYearId: 'fy-2024',
        parentId: 'non-existent-parent'
      };

      accountRepository.findOne
        .mockResolvedValueOnce(null) // No existing account
        .mockResolvedValueOnce(null); // No parent account

      await expect(service.create(createAccountDto, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated accounts', async () => {
      const filterDto: AccountFilterDto = {
        companyId: 'company-1',
        fiscalYear: 'fy-2024'
      };

      const mockAccounts = [
        {
          id: 'account-1',
          code: '100',
          name: 'Cash',
          type: AccountType.ASSET
        }
      ];

      accountRepository.findAndCount.mockResolvedValue([mockAccounts, 1]);

      const result = await service.findAll(filterDto, 1, 10);

      expect(result.accounts).toEqual(mockAccounts);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });

    it('should filter by account type', async () => {
      const filterDto: AccountFilterDto = {
        companyId: 'company-1',
        fiscalYear: 'fy-2024',
        type: AccountType.ASSET
      };

      accountRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto, 1, 10);

      expect(accountRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: AccountType.ASSET
        }),
        relations: expect.any(Array),
        order: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number)
      });
    });

    it('should search by name', async () => {
      const filterDto: AccountFilterDto = {
        companyId: 'company-1',
        fiscalYear: 'fy-2024',
        search: 'Cash'
      };

      accountRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto, 1, 10);

      expect(accountRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          companyId: 'company-1',
          fiscalYearId: 'fy-2024',
          name: expect.any(Object)
        }),
        relations: expect.any(Array),
        order: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number)
      });
    });
  });

  describe('findById', () => {
    it('should return account by id', async () => {
      const accountId = 'account-1';
      const mockAccount = {
        id: accountId,
        code: '100',
        name: 'Cash',
        type: AccountType.ASSET
      };

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findById(accountId);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId },
        relations: ['parent', 'children']
      });
    });

    it('should throw NotFoundException for non-existent account', async () => {
      const accountId = 'non-existent';

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(accountId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return account by code', async () => {
      const accountCode = '100';
      const mockAccount = {
        id: 'account-1',
        code: accountCode,
        name: 'Cash',
        type: AccountType.ASSET
      };

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findByCode(accountCode);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { code: accountCode },
        relations: ['parent', 'children']
      });
    });

    it('should throw NotFoundException for non-existent account code', async () => {
      const accountCode = 'non-existent';

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode(accountCode))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByCodeAndCompany', () => {
    it('should return account by code and company', async () => {
      const accountCode = '100';
      const companyId = 'company-1';
      const mockAccount = {
        id: 'account-1',
        code: accountCode,
        companyId,
        name: 'Cash',
        type: AccountType.ASSET
      };

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOneByCodeAndCompany(accountCode, companyId);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { code: accountCode, companyId }
      });
    });

    it('should return null for non-existent account', async () => {
      const accountCode = 'non-existent';
      const companyId = 'company-1';

      accountRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneByCodeAndCompany(accountCode, companyId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const accountId = 'account-1';
      const updateAccountDto: UpdateAccountDto = {
        name: 'Updated Cash Account',
        description: 'Updated description'
      };

      const existingAccount = {
        id: accountId,
        code: '100',
        name: 'Cash',
        type: AccountType.ASSET
      };

      const updatedAccount = {
        ...existingAccount,
        ...updateAccountDto
      };

      accountRepository.findOne.mockResolvedValue(existingAccount);
      accountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.update(accountId, updateAccountDto);

      expect(result).toEqual(updatedAccount);
      expect(accountRepository.save).toHaveBeenCalledWith({
        ...existingAccount,
        ...updateAccountDto
      });
    });

    it('should throw NotFoundException for non-existent account', async () => {
      const accountId = 'non-existent';
      const updateAccountDto: UpdateAccountDto = {
        name: 'Updated Name'
      };

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.update(accountId, updateAccountDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an account', async () => {
      const accountId = 'account-1';
      const mockAccount = {
        id: accountId,
        code: '100',
        name: 'Cash'
      };

      const updatedAccount = {
        ...mockAccount,
        active: false
      };

      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.count.mockResolvedValue(0); // No children
      accountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.delete(accountId);

      expect(result).toEqual({
        success: true,
        message: 'Account deactivated successfully'
      });
      expect(accountRepository.count).toHaveBeenCalledWith({
        where: { parentId: accountId }
      });
      expect(accountRepository.save).toHaveBeenCalledWith({
        ...mockAccount,
        active: false
      });
    });

    it('should throw NotFoundException for non-existent account', async () => {
      const accountId = 'non-existent';

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(accountId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getAccountHierarchy', () => {
    it('should return account hierarchy', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          code: '100',
          name: 'Assets',
          parentId: null,
          children: []
        }
      ];

      const mockQueryBuilder = accountRepository.createQueryBuilder();
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(mockAccounts);

      // Mock the createQueryBuilder method to return our configured mock
      accountRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountHierarchy();

      expect(result).toEqual(mockAccounts);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('account.children', 'children');
    });

    it('should filter by root id when provided', async () => {
      const rootId = 'root-account';
      const mockAccounts = [];

      const mockQueryBuilder = accountRepository.createQueryBuilder();
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(mockAccounts);

      // Mock the createQueryBuilder method to return our configured mock
      accountRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getAccountHierarchy(rootId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('account.id = :rootId', { rootId });
    });
  });

  describe('createMultiple', () => {
    it('should create multiple accounts successfully', async () => {
      const createAccountsDto: CreateAccountDto[] = [
        {
          code: '100',
          name: 'Cash',
          type: AccountType.ASSET,
          companyId: 'company-1',
          fiscalYearId: 'fy-2024'
        },
        {
          code: '200',
          name: 'Accounts Payable',
          type: AccountType.LIABILITY,
          companyId: 'company-1',
          fiscalYearId: 'fy-2024'
        }
      ];

      accountRepository.findOne.mockResolvedValue(null); // No conflicts
      accountRepository.create.mockImplementation((dto) => ({ id: 'new-id', ...dto }));
      accountRepository.save.mockImplementation((account) => Promise.resolve(account));

      const result = await service.createMultiple(createAccountsDto, 'user-1');

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors during creation', async () => {
      const createAccountsDto: CreateAccountDto[] = [
        {
          code: '100',
          name: 'Cash',
          type: AccountType.ASSET,
          companyId: 'company-1',
          fiscalYearId: 'fy-2024'
        }
      ];

      accountRepository.findOne.mockResolvedValue({ id: 'existing' }); // Conflict

      const result = await service.createMultiple(createAccountsDto, 'user-1');

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('already exists');
    });
  });
});
