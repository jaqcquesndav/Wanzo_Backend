import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from '../services/account.service';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from '../dtos/account.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AccountType } from '../entities/account.entity';
import { HttpStatus } from '@nestjs/common';

describe('AccountController', () => {
  let controller: AccountController;
  let service: AccountService;

  const mockAccountService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAccountHierarchy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AccountController>(AccountController);
    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new account', async () => {      const createAccountDto: CreateAccountDto = {
        code: '101',
        name: 'Test Account',
        type: AccountType.ASSET,
        parentId: undefined,
        isAnalytic: false,
        companyId: 'company-id',
        fiscalYearId: 'fiscal-year-id',
      };

      const req = { user: { id: 'user-id' } };
      const expectedResult = {
        id: 'account-id',
        ...createAccountDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAccountService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createAccountDto, req);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
      expect(mockAccountService.create).toHaveBeenCalledWith(createAccountDto, 'user-id');
    });
  });

  describe('findAll', () => {
    it('should return all accounts with filters', async () => {
      const filters: AccountFilterDto = { 
        type: AccountType.ASSET, 
        isAnalytic: false, 
        search: 'test',
        page: 1,
        pageSize: 20
      };
      
      const accounts = [
        { id: '1', code: '101', name: 'Account 1', type: AccountType.ASSET },
        { id: '2', code: '102', name: 'Account 2', type: AccountType.ASSET },
      ];

      mockAccountService.findAll.mockResolvedValue(accounts);

      const result = await controller.findAll(filters);

      expect(result).toEqual({
        success: true,
        data: accounts,
      });
      expect(mockAccountService.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should return a single account by id', async () => {
      const accountId = 'account-id';
      const account = {
        id: accountId,
        code: '101',
        name: 'Test Account',
        type: AccountType.ASSET,
      };

      mockAccountService.findById.mockResolvedValue(account);

      const result = await controller.findOne(accountId);

      expect(result).toEqual({
        success: true,
        data: account,
      });
      expect(mockAccountService.findById).toHaveBeenCalledWith(accountId);
    });
  });

  describe('findByCode', () => {
    it('should return a single account by code', async () => {
      const accountCode = '101';
      const account = {
        id: 'account-id',
        code: accountCode,
        name: 'Test Account',
        type: AccountType.ASSET,
      };

      mockAccountService.findByCode.mockResolvedValue(account);

      const result = await controller.findByCode(accountCode);

      expect(result).toEqual({
        success: true,
        data: account,
      });
      expect(mockAccountService.findByCode).toHaveBeenCalledWith(accountCode);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const accountId = 'account-id';
      const updateAccountDto: UpdateAccountDto = {
        name: 'Updated Account',
      };
      const updatedAccount = {
        id: accountId,
        code: '101',
        name: 'Updated Account',
        type: AccountType.ASSET,
      };

      mockAccountService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(accountId, updateAccountDto);

      expect(result).toEqual({
        success: true,
        data: updatedAccount,
      });
      expect(mockAccountService.update).toHaveBeenCalledWith(accountId, updateAccountDto);
    });
  });

  describe('remove', () => {
    it('should delete an account', async () => {
      const accountId = 'account-id';

      mockAccountService.delete.mockResolvedValue(undefined);

      await controller.remove(accountId);

      expect(mockAccountService.delete).toHaveBeenCalledWith(accountId);
    });
  });

  describe('getHierarchy', () => {
    it('should return account hierarchy', async () => {
      const rootId = 'root-id';
      const hierarchyResult = [
        {
          id: '1',
          code: '1',
          name: 'Assets',
          type: AccountType.ASSET,
          children: [
            {
              id: '101',
              code: '101',
              name: 'Cash',
              type: AccountType.ASSET,
              children: [],
            },
          ],
        },
      ];

      mockAccountService.getAccountHierarchy.mockResolvedValue(hierarchyResult);

      const result = await controller.getHierarchy(rootId);

      expect(result).toEqual({
        success: true,
        data: hierarchyResult,
      });
      expect(mockAccountService.getAccountHierarchy).toHaveBeenCalledWith(rootId);
    });
  });
});
