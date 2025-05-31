import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalService } from '../../src/modules/journals/services/journal.service';
import { Journal, JournalStatus, JournalType } from '../../src/modules/journals/entities/journal.entity';
import { JournalLine } from '../../src/modules/journals/entities/journal-line.entity';
import { AccountService } from '../../src/modules/accounts/services/account.service';
import { CreateJournalDto } from '../../src/modules/journals/dtos/journal.dto';

describe('JournalService', () => {
  let service: JournalService;
  let journalRepository: Repository<Journal>;
  let journalLineRepository: Repository<JournalLine>;
  let accountService: AccountService;

  const mockJournalRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockJournalLineRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAccountService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        {
          provide: getRepositoryToken(Journal),
          useValue: mockJournalRepository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: mockJournalLineRepository,
        },
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
    journalRepository = module.get<Repository<Journal>>(getRepositoryToken(Journal));
    journalLineRepository = module.get<Repository<JournalLine>>(getRepositoryToken(JournalLine));
    accountService = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createJournalDto: CreateJournalDto = {
      fiscalYear: '2024',
      type: JournalType.GENERAL,
      reference: 'JRN-2024-001',
      date: new Date(),
      description: 'Test journal entry',
      lines: [
        {
          accountId: 'account-1',
          debit: 1000,
          credit: 0,
          description: 'Debit line',
        },
        {
          accountId: 'account-2',
          debit: 0,
          credit: 1000,
          description: 'Credit line',
        },
      ],
    };

    it('should create a journal entry successfully', async () => {
      const userId = 'user-123';
      const journal = {
        ...createJournalDto,
        id: 'journal-123',
        status: JournalStatus.DRAFT,
        totalDebit: 1000,
        totalCredit: 1000,
      };

      mockAccountService.findById.mockResolvedValue({ id: 'account-1' });
      mockJournalRepository.create.mockReturnValue(journal);
      mockJournalRepository.save.mockResolvedValue(journal);

      const result = await service.create(createJournalDto, userId);

      expect(result).toEqual(journal);
      expect(mockJournalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fiscalYear: createJournalDto.fiscalYear,
          type: createJournalDto.type,
          createdBy: userId,
        }),
      );
    });

    it('should validate account existence', async () => {
      mockAccountService.findById.mockRejectedValue(new Error('Account not found'));

      await expect(service.create(createJournalDto, 'user-123')).rejects.toThrow();
    });

    it('should validate debit/credit balance', async () => {
      const unbalancedDto = {
        ...createJournalDto,
        lines: [
          {
            accountId: 'account-1',
            debit: 1000,
            credit: 0,
            description: 'Debit line',
          },
          {
            accountId: 'account-2',
            debit: 0,
            credit: 500,
            description: 'Credit line',
          },
        ],
      };

      await expect(service.create(unbalancedDto, 'user-123')).rejects.toThrow(
        'Journal entry must be balanced',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated journals', async () => {
      const journals = [
        {
          id: 'journal-1',
          fiscalYear: '2024',
          type: JournalType.GENERAL,
        },
        {
          id: 'journal-2',
          fiscalYear: '2024',
          type: JournalType.BANK,
        },
      ];

      mockJournalRepository.findAndCount.mockResolvedValue([journals, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        journals,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        fiscalYear: '2024',
        type: JournalType.GENERAL,
        status: JournalStatus.DRAFT,
      };

      await service.findAll(filters, 1, 10);

      expect(mockJournalRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update journal status', async () => {
      const journal = {
        id: 'journal-123',
        status: JournalStatus.DRAFT,
      };

      mockJournalRepository.findOne.mockResolvedValue(journal);
      mockJournalRepository.save.mockResolvedValue({
        ...journal,
        status: JournalStatus.POSTED,
      });

      const result = await service.updateStatus(
        'journal-123',
        { status: JournalStatus.POSTED },
        'user-123',
      );

      expect(result.status).toBe(JournalStatus.POSTED);
    });

    it('should validate status transitions', async () => {
      const journal = {
        id: 'journal-123',
        status: JournalStatus.POSTED,
      };

      mockJournalRepository.findOne.mockResolvedValue(journal);

      await expect(
        service.updateStatus('journal-123', { status: JournalStatus.DRAFT }, 'user-123'),
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('getAccountBalance', () => {
    it('should calculate account balance correctly', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalDebit: '1000',
          totalCredit: '500',
        }),
      };

      mockJournalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountBalance('account-123', '2024');

      expect(result).toEqual({
        debit: 1000,
        credit: 500,
        balance: 500,
      });
    });
  });
});