import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalYearsService } from './fiscal-year.service';
import { FiscalYear, FiscalYearStatus } from '../entities/fiscal-year.entity';
import { CreateFiscalYearDto } from '../dtos/create-fiscal-year.dto';
import { AuditFiscalYearDto } from '../dtos/audit-fiscal-year.dto';
import { ImportFiscalYearDto } from '../dtos/import-fiscal-year.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JournalSource } from '../../journals/entities/journal.entity';

describe('FiscalYearsService', () => {
  let service: FiscalYearsService;
  let fiscalYearRepository: MockRepository;
  let journalRepository: MockRepository;

  type MockRepository = {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  });

  beforeEach(async () => {
    fiscalYearRepository = createMockRepository();
    journalRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalYearsService,
        {
          provide: getRepositoryToken(FiscalYear),
          useValue: fiscalYearRepository,
        },
        {
          provide: 'JournalRepository',
          useValue: journalRepository,
        },
      ],
    }).compile();

    service = module.get<FiscalYearsService>(FiscalYearsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all fiscal years for a company', async () => {
      const companyId = 'company-id';
      const fiscalYears = [
        { id: '1', code: 'FY2023', companyId, status: FiscalYearStatus.OPEN },
        { id: '2', code: 'FY2022', companyId, status: FiscalYearStatus.CLOSED },
      ];
      fiscalYearRepository.find.mockResolvedValue(fiscalYears);

      const result = await service.findAll(companyId);

      expect(result).toEqual(fiscalYears);
      expect(fiscalYearRepository.find).toHaveBeenCalledWith({
        where: { companyId },
        order: { startDate: 'DESC' }
      });
    });

    it('should return fiscal years filtered by status', async () => {
      const companyId = 'company-id';
      const status = FiscalYearStatus.OPEN;
      const fiscalYears = [
        { id: '1', code: 'FY2023', companyId, status: FiscalYearStatus.OPEN },
      ];
      fiscalYearRepository.find.mockResolvedValue(fiscalYears);

      const result = await service.findAll(companyId, status);

      expect(result).toEqual(fiscalYears);
      expect(fiscalYearRepository.find).toHaveBeenCalledWith({
        where: { companyId, status },
        order: { startDate: 'DESC' }
      });
    });
  });

  describe('findOne', () => {
    it('should return a fiscal year by id', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const fiscalYear = { id, code: 'FY2023', companyId, status: FiscalYearStatus.OPEN };
      fiscalYearRepository.findOne.mockResolvedValue(fiscalYear);

      const result = await service.findOne(id, companyId);

      expect(result).toEqual(fiscalYear);
      expect(fiscalYearRepository.findOne).toHaveBeenCalledWith({
        where: { id, companyId }
      });
    });

    it('should throw NotFoundException if fiscal year not found', async () => {
      const id = 'non-existent-id';
      const companyId = 'company-id';
      fiscalYearRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id, companyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a fiscal year by code', async () => {
      const code = 'FY2023';
      const companyId = 'company-id';
      const fiscalYear = { id: 'fiscal-year-id', code, companyId, status: FiscalYearStatus.OPEN };
      fiscalYearRepository.findOne.mockResolvedValue(fiscalYear);

      const result = await service.findByCode(code, companyId);

      expect(result).toEqual(fiscalYear);
      expect(fiscalYearRepository.findOne).toHaveBeenCalledWith({
        where: { code, companyId }
      });
    });

    it('should throw NotFoundException if fiscal year not found by code', async () => {
      const code = 'NON-EXISTENT';
      const companyId = 'company-id';
      fiscalYearRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode(code, companyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new fiscal year', async () => {
      const companyId = 'company-id';
      const userId = 'user-id';
      const dto: CreateFiscalYearDto = {
        code: 'FY2023',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        description: 'Fiscal Year 2023',
      };
      const createdFiscalYear = {
        id: 'new-fiscal-year-id',
        ...dto,
        companyId,
        createdBy: userId,
        auditStatus: {
          isAudited: false,
          auditor: {
            name: "",
            registrationNumber: ""
          },
          auditedAt: ""
        }
      };
      fiscalYearRepository.create.mockReturnValue(createdFiscalYear);
      fiscalYearRepository.save.mockResolvedValue(createdFiscalYear);

      const result = await service.create(dto, companyId, userId);

      expect(result).toEqual(createdFiscalYear);
      expect(fiscalYearRepository.create).toHaveBeenCalledWith({
        ...dto,
        companyId,
        createdBy: userId,
        auditStatus: {
          isAudited: false,
          auditor: {
            name: "",
            registrationNumber: ""
          },
          auditedAt: ""
        }
      });
      expect(fiscalYearRepository.save).toHaveBeenCalledWith(createdFiscalYear);
    });
  });

  describe('updateFiscalYear', () => {
    it('should update a fiscal year', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const updateData = { code: 'FY2023-Updated' };
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.OPEN,
      };
      const updatedFiscalYear = { ...existingFiscalYear, ...updateData };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);
      fiscalYearRepository.save.mockResolvedValue(updatedFiscalYear);

      const result = await service.updateFiscalYear(id, updateData, companyId, userId);

      expect(result).toEqual(updatedFiscalYear);
      expect(fiscalYearRepository.findOne).toHaveBeenCalledWith({
        where: { id, companyId }
      });
      expect(fiscalYearRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingFiscalYear,
        code: updateData.code
      }));
    });
  });

  describe('closeFiscalYear', () => {
    it('should close a fiscal year', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.OPEN,
      };
      const closedFiscalYear = {
        ...existingFiscalYear,
        status: FiscalYearStatus.CLOSED,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);
      fiscalYearRepository.save.mockResolvedValue(closedFiscalYear);

      const result = await service.closeFiscalYear(id, companyId, userId);

      expect(result.fiscalYear).toEqual(closedFiscalYear);
      expect(result.checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "balance", passed: true }),
        expect.objectContaining({ name: "journals", passed: true }),
        expect.objectContaining({ name: "reconciliation", passed: true }),
      ]));
      expect(fiscalYearRepository.findOne).toHaveBeenCalledWith({
        where: { id, companyId }
      });
      expect(fiscalYearRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingFiscalYear,
        status: FiscalYearStatus.CLOSED
      }));
    });

    it('should throw BadRequestException if fiscal year is not open', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.CLOSED,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);

      await expect(service.closeFiscalYear(id, companyId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reopenFiscalYear', () => {
    it('should reopen a closed fiscal year', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.CLOSED,
      };
      const reopenedFiscalYear = {
        ...existingFiscalYear,
        status: FiscalYearStatus.OPEN,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);
      fiscalYearRepository.save.mockResolvedValue(reopenedFiscalYear);

      const result = await service.reopenFiscalYear(id, companyId, userId);

      expect(result).toEqual(reopenedFiscalYear);
      expect(fiscalYearRepository.findOne).toHaveBeenCalledWith({
        where: { id, companyId }
      });
      expect(fiscalYearRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingFiscalYear,
        status: FiscalYearStatus.OPEN
      }));
    });

    it('should throw BadRequestException if fiscal year is already open', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.OPEN,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);

      await expect(service.reopenFiscalYear(id, companyId, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if fiscal year is audited', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.AUDITED,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);

      await expect(service.reopenFiscalYear(id, companyId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('auditFiscalYear', () => {
    it('should mark a fiscal year as audited', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const auditData: AuditFiscalYearDto = { auditorToken: '123456' };
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.CLOSED,
      };
      const auditedFiscalYear = {
        ...existingFiscalYear,
        status: FiscalYearStatus.AUDITED,
        auditStatus: {
          isAudited: true,
          auditor: {
            name: "John Auditor",
            registrationNumber: "AUD12345"
          },
          auditedAt: expect.any(String)
        }
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);
      fiscalYearRepository.save.mockResolvedValue(auditedFiscalYear);

      const result = await service.auditFiscalYear(id, auditData, companyId, userId);

      expect(result).toEqual(auditedFiscalYear);
      expect(fiscalYearRepository.findOne).toHaveBeenCalledWith({
        where: { id, companyId }
      });
      expect(fiscalYearRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingFiscalYear,
        status: FiscalYearStatus.AUDITED,
        auditStatus: expect.objectContaining({
          isAudited: true,
          auditor: expect.objectContaining({
            name: "John Auditor",
            registrationNumber: "AUD12345"
          })
        })
      }));
    });

    it('should throw BadRequestException if fiscal year is open', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const auditData: AuditFiscalYearDto = { auditorToken: '123456' };
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.OPEN,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);

      await expect(service.auditFiscalYear(id, auditData, companyId, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if auditor token is invalid', async () => {
      const id = 'fiscal-year-id';
      const companyId = 'company-id';
      const userId = 'user-id';
      const auditData: AuditFiscalYearDto = { auditorToken: 'invalid-token' };
      const existingFiscalYear = {
        id,
        code: 'FY2023',
        companyId,
        status: FiscalYearStatus.CLOSED,
      };
      
      fiscalYearRepository.findOne.mockResolvedValue(existingFiscalYear);

      await expect(service.auditFiscalYear(id, auditData, companyId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('importFiscalYear', () => {
    it('should import a fiscal year with journal entries', async () => {
      const companyId = 'company-id';
      const userId = 'user-id';
      const importDto: ImportFiscalYearDto = {
        fiscalYear: {
          code: 'FY2023',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
        journalEntries: [
          {
            date: '2023-01-15',
            journal: 'SALES',
            account: '4010',
            label: 'Sale Invoice #123',
            debit: 0,
            credit: 1000,
            reference: 'INV123',
          },
        ],
      };
      
      const createdFiscalYear = {
        id: 'new-fiscal-year-id',
        ...importDto.fiscalYear,
        companyId,
        createdBy: userId,
        status: FiscalYearStatus.OPEN,
      };
      
      const createdJournalEntry = {
        id: 'journal-entry-id',
        ...importDto.journalEntries[0],
        companyId,
        fiscalYearId: createdFiscalYear.id,
        postedBy: userId,
        source: JournalSource.IMPORT,
      };
      
      fiscalYearRepository.create.mockReturnValue(createdFiscalYear);
      fiscalYearRepository.save.mockResolvedValue(createdFiscalYear);
      journalRepository.create.mockReturnValue(createdJournalEntry);
      journalRepository.save.mockResolvedValue([createdJournalEntry]);

      await service.importFiscalYear(importDto, companyId, userId);

      expect(fiscalYearRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...importDto.fiscalYear,
        companyId,
        createdBy: userId,
        status: FiscalYearStatus.OPEN,
      }));
      expect(fiscalYearRepository.save).toHaveBeenCalledWith(createdFiscalYear);
      expect(journalRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...importDto.journalEntries[0],
        companyId,
        fiscalYearId: createdFiscalYear.id,
        postedBy: userId,
        source: JournalSource.IMPORT,
      }));
      expect(journalRepository.save).toHaveBeenCalledWith([createdJournalEntry], { chunk: 100 });
    });
  });
});
