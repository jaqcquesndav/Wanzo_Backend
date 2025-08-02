import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalService } from './journal.service';
import { Journal, JournalStatus, JournalType, JournalSource } from '../entities/journal.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { AccountService } from '../../accounts/services/account.service';
import { CreateJournalDto, UpdateJournalStatusDto, JournalFilterDto } from '../dtos/journal.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock repository factory
const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0])
  }))
});

// Mock account service
const createMockAccountService = () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getBalance: jest.fn()
});

describe('JournalService', () => {
  let service: JournalService;
  let journalRepository: ReturnType<typeof createMockRepository>;
  let journalLineRepository: ReturnType<typeof createMockRepository>;
  let accountService: ReturnType<typeof createMockAccountService>;

  beforeEach(async () => {
    journalRepository = createMockRepository();
    journalLineRepository = createMockRepository();
    accountService = createMockAccountService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        {
          provide: getRepositoryToken(Journal),
          useValue: journalRepository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: journalLineRepository,
        },
        {
          provide: AccountService,
          useValue: accountService,
        },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a balanced journal entry', async () => {
      const createJournalDto: CreateJournalDto = {
        date: new Date('2024-06-15'),
        description: 'Test journal entry',
        type: JournalType.GENERAL,
        reference: 'JRN001',
        fiscalYear: 'fy-2024',
        companyId: 'company-1',
        lines: [
          {
            accountId: 'acc-1',
            description: 'Debit entry',
            debit: 1000,
            credit: 0
          },
          {
            accountId: 'acc-2',
            description: 'Credit entry',
            debit: 0,
            credit: 1000
          }
        ]
      };

      const mockAccount = { id: 'acc-1', code: '100', name: 'Cash' };
      accountService.findById.mockResolvedValue(mockAccount);

      const savedJournal = {
        id: 'journal-1',
        ...createJournalDto,
        journalType: createJournalDto.type,
        fiscalYearId: createJournalDto.fiscalYear,
        status: JournalStatus.DRAFT,
        totalDebit: 1000,
        totalCredit: 1000,
        createdBy: 'user-1'
      };

      journalRepository.save.mockResolvedValue(savedJournal);
      journalRepository.create.mockReturnValue({
        ...savedJournal,
        lines: []
      });

      const result = await service.create(createJournalDto, 'user-1');

      expect(result).toEqual(savedJournal);
      expect(accountService.findById).toHaveBeenCalledTimes(2);
      expect(journalRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unbalanced journal entry', async () => {
      const createJournalDto: CreateJournalDto = {
        date: new Date('2024-06-15'),
        description: 'Unbalanced journal entry',
        type: JournalType.GENERAL,
        reference: 'JRN002',
        fiscalYear: 'fy-2024',
        companyId: 'company-1',
        lines: [
          {
            accountId: 'acc-1',
            description: 'Debit entry',
            debit: 1000,
            credit: 0
          },
          {
            accountId: 'acc-2',
            description: 'Credit entry',
            debit: 0,
            credit: 500 // Unbalanced!
          }
        ]
      };

      const mockAccount = { id: 'acc-1', code: '100', name: 'Cash' };
      accountService.findById.mockResolvedValue(mockAccount);

      await expect(service.create(createJournalDto, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent account', async () => {
      const createJournalDto: CreateJournalDto = {
        date: new Date('2024-06-15'),
        description: 'Journal with invalid account',
        type: JournalType.GENERAL,
        reference: 'JRN003',
        fiscalYear: 'fy-2024',
        companyId: 'company-1',
        lines: [
          {
            accountId: 'invalid-account',
            description: 'Entry',
            debit: 1000,
            credit: 0
          }
        ]
      };

      accountService.findById.mockRejectedValue(new NotFoundException('Account not found'));

      await expect(service.create(createJournalDto, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated journal entries', async () => {
      const filterDto: JournalFilterDto = {
        companyId: 'company-1'
      };

      const mockJournals = [
        {
          id: 'journal-1',
          date: new Date('2024-06-15'),
          description: 'Test journal',
          status: JournalStatus.APPROVED,
          totalDebit: 1000,
          totalCredit: 1000
        }
      ];

      journalRepository.findAndCount.mockResolvedValue([mockJournals, 1]);

      const result = await service.findAll(filterDto, 1, 10);

      expect(result.journals).toEqual(mockJournals);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
      expect(journalRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const filterDto: JournalFilterDto = {
        companyId: 'company-1',
        status: JournalStatus.APPROVED
      };

      journalRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto, 1, 10);

      expect(journalRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          companyId: 'company-1',
          status: JournalStatus.APPROVED
        }),
        relations: expect.any(Array),
        order: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number)
      });
    });

    it('should filter by date range', async () => {
      const filterDto: JournalFilterDto = {
        companyId: 'company-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      journalRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto, 1, 10);

      expect(journalRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          companyId: 'company-1',
          date: expect.any(Object) // Between condition
        }),
        relations: expect.any(Array),
        order: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number)
      });
    });
  });

  describe('findById', () => {
    it('should return journal by id', async () => {
      const journalId = 'journal-1';

      const mockJournal = {
        id: journalId,
        companyId: 'company-1',
        description: 'Test journal',
        status: JournalStatus.APPROVED,
        lines: []
      };

      journalRepository.findOne.mockResolvedValue(mockJournal);

      const result = await service.findById(journalId);

      expect(result).toEqual(mockJournal);
      expect(journalRepository.findOne).toHaveBeenCalledWith({
        where: { id: journalId },
        relations: ['lines']
      });
    });

    it('should throw NotFoundException for non-existent journal', async () => {
      const journalId = 'non-existent';

      journalRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(journalId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update journal status', async () => {
      const journalId = 'journal-1';
      const updateDto: UpdateJournalStatusDto = {
        status: JournalStatus.APPROVED,
        rejectionReason: 'Approved by manager'
      };

      const mockJournal = {
        id: journalId,
        companyId: 'company-1',
        status: JournalStatus.PENDING
      };

      const updatedJournal = {
        ...mockJournal,
        status: JournalStatus.APPROVED
      };

      journalRepository.findOne.mockResolvedValue(mockJournal);
      journalRepository.save.mockResolvedValue(updatedJournal);

      const result = await service.updateStatus(journalId, updateDto, 'user-1');

      expect(result.status).toBe(JournalStatus.APPROVED);
      expect(journalRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent journal', async () => {
      const journalId = 'non-existent';
      const updateDto: UpdateJournalStatusDto = {
        status: JournalStatus.APPROVED
      };

      journalRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(journalId, updateDto, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByAccount', () => {
    it('should return journal entries for specific account', async () => {
      const accountId = 'acc-1';
      const filters: JournalFilterDto = {
        companyId: 'company-1'
      };

      const mockJournals = [
        {
          id: 'journal-1',
          description: 'Test journal',
          date: new Date('2024-06-15'),
          lines: [{
            id: 'line-1',
            accountId,
            debit: 1000,
            credit: 0
          }]
        }
      ];

      const mockQueryBuilder = journalRepository.createQueryBuilder();
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(mockJournals);

      // Mock the createQueryBuilder method to return our configured mock
      journalRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByAccount(accountId, filters);

      expect(result).toEqual(mockJournals);
    });
  });

  describe('getAccountBalance', () => {
    it('should calculate account balance correctly', async () => {
      const accountId = 'acc-1';
      const fiscalYearId = 'fy-2024';
      const companyId = 'company-1';

      const mockJournalLines = [
        { totalDebit: '1500', totalCredit: '200' }
      ];

      const mockQueryBuilder = journalLineRepository.createQueryBuilder();
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.getRawOne.mockResolvedValue(mockJournalLines[0]);

      // Mock the createQueryBuilder method to return our configured mock
      journalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountBalance(accountId, fiscalYearId, companyId);

      expect(result.debit).toBe(1500);
      expect(result.credit).toBe(200);
      expect(result.balance).toBe(1300);
    });

    it('should throw NotFoundException for non-existent account', async () => {
      const accountId = 'non-existent';
      const fiscalYearId = 'fy-2024';
      const companyId = 'company-1';

      const mockQueryBuilder = journalLineRepository.createQueryBuilder();
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      await expect(service.getAccountBalance(accountId, fiscalYearId, companyId))
        .rejects.toThrow();
    });
  });
});
