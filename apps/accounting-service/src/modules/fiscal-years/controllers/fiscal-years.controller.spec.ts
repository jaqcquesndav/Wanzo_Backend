import { Test, TestingModule } from '@nestjs/testing';
import { FiscalYearsController } from './fiscal-years.controller';
import { FiscalYearsService } from '../services/fiscal-years.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FiscalYearStatus } from '../entities/fiscal-year.entity';
import { CreateFiscalYearDto } from '../dtos/create-fiscal-year.dto';
import { AuditFiscalYearDto } from '../dtos/audit-fiscal-year.dto';
import { ImportFiscalYearDto } from '../dtos/import-fiscal-year.dto';
import { HttpStatus } from '@nestjs/common';

describe('FiscalYearsController', () => {
  let controller: FiscalYearsController;
  let service: FiscalYearsService;

  const mockFiscalYearsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    closeFiscalYear: jest.fn(),
    reopenFiscalYear: jest.fn(),
    auditFiscalYear: jest.fn(),
    updateFiscalYear: jest.fn(),
    importFiscalYear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiscalYearsController],
      providers: [
        {
          provide: FiscalYearsService,
          useValue: mockFiscalYearsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FiscalYearsController>(FiscalYearsController);
    service = module.get<FiscalYearsService>(FiscalYearsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all fiscal years', async () => {
      const req = { user: { companyId: 'company-id' } };
      const fiscalYears = [
        { id: '1', code: 'FY2023', status: FiscalYearStatus.OPEN },
        { id: '2', code: 'FY2022', status: FiscalYearStatus.CLOSED },
      ];
      mockFiscalYearsService.findAll.mockResolvedValue(fiscalYears);

      const result = await controller.findAll(req as any);

      expect(result).toEqual({ success: true, data: fiscalYears });
      expect(mockFiscalYearsService.findAll).toHaveBeenCalledWith('company-id', undefined);
    });

    it('should return fiscal years filtered by status', async () => {
      const req = { user: { companyId: 'company-id' } };
      const status = FiscalYearStatus.OPEN;
      const fiscalYears = [
        { id: '1', code: 'FY2023', status: FiscalYearStatus.OPEN },
      ];
      mockFiscalYearsService.findAll.mockResolvedValue(fiscalYears);

      const result = await controller.findAll(req as any, status);

      expect(result).toEqual({ success: true, data: fiscalYears });
      expect(mockFiscalYearsService.findAll).toHaveBeenCalledWith('company-id', status);
    });
  });

  describe('findOne', () => {
    it('should return a specific fiscal year', async () => {
      const req = { user: { companyId: 'company-id' } };
      const fiscalYearId = 'fiscal-year-id';
      const fiscalYear = {
        id: fiscalYearId,
        code: 'FY2023',
        status: FiscalYearStatus.OPEN,
      };
      mockFiscalYearsService.findOne.mockResolvedValue(fiscalYear);

      const result = await controller.findOne(fiscalYearId, req as any);

      expect(result).toEqual({ success: true, data: fiscalYear });
      expect(mockFiscalYearsService.findOne).toHaveBeenCalledWith(fiscalYearId, 'company-id');
    });
  });

  describe('create', () => {
    it('should create a new fiscal year', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const dto: CreateFiscalYearDto = {
        code: 'FY2023',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        description: 'Fiscal Year 2023',
      };
      const fiscalYear = {
        id: 'new-fiscal-year-id',
        ...dto,
        status: FiscalYearStatus.OPEN,
      };
      mockFiscalYearsService.create.mockResolvedValue(fiscalYear);

      const result = await controller.create(dto, req as any);

      expect(result).toEqual({ success: true, data: fiscalYear });
      expect(mockFiscalYearsService.create).toHaveBeenCalledWith(dto, 'company-id', 'user-id');
    });
  });

  describe('closeFiscalYear', () => {
    it('should close a fiscal year', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const fiscalYearId = 'fiscal-year-id';
      const closeData = { force: false };
      const fiscalYear = {
        id: fiscalYearId,
        code: 'FY2023',
        status: FiscalYearStatus.CLOSED,
      };
      const checks = [
        { name: "balance", passed: true, message: "Balance équilibrée" },
        { name: "journals", passed: true, message: "Journaux validés" },
        { name: "reconciliation", passed: true, message: "Rapprochements effectués" }
      ];
      mockFiscalYearsService.closeFiscalYear.mockResolvedValue({ fiscalYear, checks });

      const result = await controller.closeFiscalYear(fiscalYearId, closeData, req as any);

      expect(result).toEqual({
        success: true,
        data: {
          checks,
          message: "Exercice clôturé avec succès"
        }
      });
      expect(mockFiscalYearsService.closeFiscalYear).toHaveBeenCalledWith(
        fiscalYearId,
        'company-id',
        'user-id',
        false
      );
    });
  });

  describe('reopenFiscalYear', () => {
    it('should reopen a fiscal year', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const fiscalYearId = 'fiscal-year-id';
      const fiscalYear = {
        id: fiscalYearId,
        code: 'FY2023',
        status: FiscalYearStatus.OPEN,
      };
      mockFiscalYearsService.reopenFiscalYear.mockResolvedValue(fiscalYear);

      const result = await controller.reopenFiscalYear(fiscalYearId, req as any);

      expect(result).toEqual({ success: true, data: fiscalYear });
      expect(mockFiscalYearsService.reopenFiscalYear).toHaveBeenCalledWith(
        fiscalYearId,
        'company-id',
        'user-id'
      );
    });
  });

  describe('auditFiscalYear', () => {
    it('should mark a fiscal year as audited', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const fiscalYearId = 'fiscal-year-id';
      const dto: AuditFiscalYearDto = { auditorToken: '123456' };
      const fiscalYear = {
        id: fiscalYearId,
        code: 'FY2023',
        status: FiscalYearStatus.AUDITED,
      };
      mockFiscalYearsService.auditFiscalYear.mockResolvedValue(fiscalYear);

      const result = await controller.auditFiscalYear(fiscalYearId, dto, req as any);

      expect(result).toEqual({
        success: true,
        message: "Audit validé avec succès"
      });
      expect(mockFiscalYearsService.auditFiscalYear).toHaveBeenCalledWith(
        fiscalYearId,
        dto,
        'company-id',
        'user-id'
      );
    });
  });

  describe('update', () => {
    it('should update a fiscal year', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const fiscalYearId = 'fiscal-year-id';
      const updateData = { code: 'FY2023-Updated' };
      const fiscalYear = {
        id: fiscalYearId,
        code: 'FY2023-Updated',
        status: FiscalYearStatus.OPEN,
      };
      mockFiscalYearsService.updateFiscalYear.mockResolvedValue(fiscalYear);

      const result = await controller.update(fiscalYearId, updateData, req as any);

      expect(result).toEqual({ success: true, data: fiscalYear });
      expect(mockFiscalYearsService.updateFiscalYear).toHaveBeenCalledWith(
        fiscalYearId,
        updateData,
        'company-id',
        'user-id'
      );
    });
  });

  describe('importFiscalYear', () => {
    it('should start the fiscal year import process', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const dto: ImportFiscalYearDto = {
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
      
      const result = await controller.importFiscalYear(dto, req as any);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
      expect(result.message).toBe('The import process has been started. You will be notified upon completion.');
      expect(result.data).toHaveProperty('taskId');
      expect(mockFiscalYearsService.importFiscalYear).toHaveBeenCalledWith(
        dto,
        'company-id',
        'user-id'
      );
    });
  });
});
