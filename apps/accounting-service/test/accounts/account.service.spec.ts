import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountService } from '../../src/modules/accounts/services/account.service';
import { Account, AccountType } from '../../src/modules/accounts/entities/account.entity';
import { CreateAccountDto } from '../../src/modules/accounts/dtos/account.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AccountService', () => {
  let service: AccountService;
  let repository: Repository<Account>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    repository = module.get<Repository<Account>>(getRepositoryToken(Account));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAccountDto: CreateAccountDto = {
      code: '411000',
      name: 'Clients',
      type: AccountType.ASSET,
      isAnalytic: false,
    };

    it('should create an account successfully', async () => {
      const userId = 'user-123';
      const account = {
        ...createAccountDto,
        id: 'account-123',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(account);
      mockRepository.save.mockResolvedValue(account);

      const result = await service.create(createAccountDto, userId);

      expect(result).toEqual(account);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: createAccountDto.code,
          name: createAccountDto.name,
          createdBy: userId,
        }),
      );
    });

    it('should throw ConflictException if account code exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-account' });

      await expect(service.create(createAccountDto, 'user-123')).rejects.toThrow(ConflictException);
    });

    it('should validate parent account if specified', async () => {
      const dtoWithParent = {
        ...createAccountDto,
        parentId: 'parent-123',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // Code check
        .mockResolvedValueOnce(null); // Parent check

      await expect(service.create(dtoWithParent, 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated accounts', async () => {
      const accounts = [
        {
          id: 'account-1',
          code: '411000',
          name: 'Clients',
        },
        {
          id: 'account-2',
          code: '401000',
          name: 'Fournisseurs',
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([accounts, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        accounts,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        type: AccountType.ASSET,
        isAnalytic: true,
      };

      await service.findAll(filters, 1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update account successfully', async () => {
      const account = {
        id: 'account-123',
        code: '411000',
        name: 'Clients',
      };

      mockRepository.findOne.mockResolvedValue(account);
      mockRepository.save.mockResolvedValue({
        ...account,
        name: 'Clients Généraux',
      });

      const result = await service.update('account-123', { name: 'Clients Généraux' });

      expect(result.name).toBe('Clients Généraux');
    });

    it('should throw NotFoundException if account not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAccountHierarchy', () => {
    it('should return account hierarchy', async () => {
      const mockHierarchy = [
        {
          id: 'parent-1',
          code: '4',
          name: 'Comptes de tiers',
          children: [
            {
              id: 'child-1',
              code: '411',
              name: 'Clients',
            },
          ],
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockHierarchy),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountHierarchy();

      expect(result).toEqual(mockHierarchy);
    });
  });
});