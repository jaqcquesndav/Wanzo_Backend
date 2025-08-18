import { Test, TestingModule } from '@nestjs/testing';
import { JournalController } from './journal.controller';
import { JournalService } from '../services/journal.service';
import { CreateJournalDto, UpdateJournalStatusDto, JournalFilterDto } from '../dtos/journal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JournalType, JournalStatus } from '../entities/journal.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('JournalController', () => {
  let controller: JournalController;
  let service: JournalService;

  const mockJournalService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByAccount: jest.fn(),
    updateStatus: jest.fn(),
    getAccountBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JournalController],
      providers: [
        {
          provide: JournalService,
          useValue: mockJournalService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<JournalController>(JournalController);
    service = module.get<JournalService>(JournalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new journal entry', async () => {
      const createJournalDto: CreateJournalDto = {
        date: new Date('2025-06-01'),
        description: 'Test Journal Entry',
        reference: 'REF001',
        type: JournalType.GENERAL,
        journalType: JournalType.GENERAL,
        companyId: 'company-id',
        fiscalYear: 'fiscal-year-id',
        lines: [
          {
            accountId: 'account1-id',
            description: 'Line 1',
            debit: 1000,
            credit: 0,
          },
          {
            accountId: 'account2-id',
            description: 'Line 2',
            debit: 0,
            credit: 1000,
          },
        ],
      };

      const req = { user: { id: 'user-id' } };
      const expectedResult = {
        id: 'journal-id',
        ...createJournalDto,
        status: JournalStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-id',
      };

      mockJournalService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createJournalDto, req);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
      expect(mockJournalService.create).toHaveBeenCalledWith(createJournalDto, 'user-id');
    });
  });

  describe('findAll', () => {
    it('should return all journal entries with filters', async () => {
      const page = 1;
      const pageSize = 20;
      const filters: JournalFilterDto = {
        search: 'test',
        journalType: JournalType.GENERAL,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
        status: JournalStatus.POSTED,
        source: 'manual',
      };

      const req = { user: { companyId: 'company-id' } };

      const journals = [
        {
          id: '1',
          date: new Date('2025-06-15'),
          description: 'Test Journal 1',
          type: JournalType.GENERAL,
          status: JournalStatus.POSTED,
        },
        {
          id: '2',
          date: new Date('2025-06-20'),
          description: 'Test Journal 2',
          type: JournalType.GENERAL,
          status: JournalStatus.POSTED,
        },
      ];

      const paginatedResponse = {
        journals: journals,
        total: 2,
        page: 1,
        perPage: 20,
      };

      mockJournalService.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(page, pageSize, filters, req);

      expect(result).toEqual({
        success: true,
        data: {
          data: journals,
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1
        }
      });
      
      expect(mockJournalService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: filters.journalType,
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
          source: filters.source,
          search: filters.search,
          companyId: 'company-id'
        }), 
        page, 
        pageSize
      );
    });
  });

  describe('findOne', () => {
    it('should return a single journal by id', async () => {
      const journalId = 'journal-id';
      const journal = {
        id: journalId,
        date: new Date('2025-06-15'),
        description: 'Test Journal',
        type: JournalType.GENERAL,
        status: JournalStatus.POSTED,
        lines: [
          {
            id: 'line1-id',
            accountId: 'account1-id',
            debit: 1000,
            credit: 0,
          },
          {
            id: 'line2-id',
            accountId: 'account2-id',
            debit: 0,
            credit: 1000,
          },
        ],
      };

      mockJournalService.findById.mockResolvedValue(journal);

      const result = await controller.findOne(journalId);

      expect(result).toEqual({
        success: true,
        data: journal,
      });
      expect(mockJournalService.findById).toHaveBeenCalledWith(journalId);
    });
  });

  describe('updateStatus', () => {
    it('should update journal status', async () => {
      const journalId = 'journal-id';
      const updateStatusDto: UpdateJournalStatusDto = {
        status: JournalStatus.POSTED,
      };
      
      const req = { user: { id: 'user-id' } };
      const updatedJournal = {
        id: journalId,
        status: JournalStatus.POSTED,
      };

      mockJournalService.updateStatus.mockResolvedValue(updatedJournal);

      const result = await controller.updateStatus(journalId, updateStatusDto, req);

      expect(result).toEqual({
        success: true,
        data: updatedJournal,
      });
      expect(mockJournalService.updateStatus).toHaveBeenCalledWith(journalId, updateStatusDto, 'user-id');
    });
  });

  describe('findByAccount', () => {
    it('should return journal entries for a specific account', async () => {
      const accountId = 'account-id';
      const filters: JournalFilterDto = {
        fiscalYear: 'fiscal-year-id',
      };
      
      const req = { user: { companyId: 'company-id' } };
      
      const journals = [
        {
          id: '1',
          date: new Date('2025-06-15'),
          description: 'Test Journal 1',
          type: JournalType.GENERAL,
          status: JournalStatus.POSTED,
        },
      ];

      mockJournalService.findByAccount.mockResolvedValue(journals);

      const result = await controller.findByAccount(accountId, filters, req);

      expect(result).toEqual({
        success: true,
        data: journals,
      });
      expect(mockJournalService.findByAccount).toHaveBeenCalledWith(
        accountId, 
        expect.objectContaining({
          ...filters,
          companyId: 'company-id',
        })
      );
    });
  });

  describe('getAccountBalance', () => {
    it('should return the balance for an account', async () => {
      const accountId = 'account-id';
      const fiscalYear = 'fiscal-year-id';
      const asOfDate = '2025-06-30';
      const req = { user: { companyId: 'company-id' } };
      
      const balance = 5000;

      mockJournalService.getAccountBalance.mockResolvedValue(balance);

      const result = await controller.getAccountBalance(accountId, fiscalYear, req, asOfDate);

      expect(result).toEqual({
        success: true,
        data: {
          balance,
        },
      });
      expect(mockJournalService.getAccountBalance).toHaveBeenCalledWith(
        accountId, 
        fiscalYear, 
        'company-id',
        new Date(asOfDate)
      );
    });

    it('should throw BadRequestException when company ID is missing', async () => {
      const accountId = 'account-id';
      const fiscalYear = 'fiscal-year-id';
      const req = { user: { } }; // Missing companyId
      
      await expect(controller.getAccountBalance(accountId, fiscalYear, req)).rejects.toThrow(BadRequestException);
    });
  });
});
