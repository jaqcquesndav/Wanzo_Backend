import { Test, TestingModule } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { TaxService } from '../services/tax.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationDto, TaxFilterDto } from '../dtos/tax.dto';
import { DeclarationType, DeclarationStatus, DeclarationPeriodicity } from '../entities/tax-declaration.entity';
import { NotFoundException } from '@nestjs/common';

describe('TaxController', () => {
  let controller: TaxController;
  let service: TaxService;

  const mockTaxService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    getTaxSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [
        {
          provide: TaxService,
          useValue: mockTaxService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TaxController>(TaxController);
    service = module.get<TaxService>(TaxService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tax declaration', async () => {
      const createDto: CreateTaxDeclarationDto = {
        type: DeclarationType.TVA,
        period: '2025-06',
        periodicity: DeclarationPeriodicity.MONTHLY,
        taxableBase: 10000,
        taxRate: 16,
        amount: 1600,
        fiscalYearId: 'fiscal-year-id',
        companyId: 'company-id',
      };

      const req = {
        user: {
          id: 'user-id',
          companyId: 'company-id',
        },
      };

      const result = {
        id: 'declaration-id',
        ...createDto,
        amount: 1600,
        dueDate: new Date('2025-07-15'),
        status: DeclarationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaxService.create.mockResolvedValue(result);

      expect(await controller.create(createDto, req)).toEqual(result);
      expect(mockTaxService.create).toHaveBeenCalledWith(createDto, req.user.id);
    });
  });

  describe('findAll', () => {
    it('should return all tax declarations with pagination', async () => {
      const queryFilters: TaxFilterDto = {
        page: 1,
        pageSize: 10,
        type: DeclarationType.TVA,
      };

      const req = {
        user: {
          companyId: 'company-id',
        },
      };

      const declarations = [
        {
          id: 'declaration-1',
          type: DeclarationType.TVA,
          period: '2025-06',
          status: DeclarationStatus.DRAFT,
        },
        {
          id: 'declaration-2',
          type: DeclarationType.TVA,
          period: '2025-05',
          status: DeclarationStatus.SUBMITTED,
        },
      ];

      const total = 2;

      mockTaxService.findAll.mockResolvedValue({ declarations, total });

      const result = await controller.findAll(queryFilters, req);

      expect(result).toEqual({
        data: declarations,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      expect(mockTaxService.findAll).toHaveBeenCalledWith({
        ...queryFilters,
        companyId: 'company-id',
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('getTaxSummary', () => {
    it('should return tax summary for fiscal year', async () => {
      const fiscalYearId = 'fiscal-year-id';
      const req = {
        user: {
          companyId: 'company-id',
        },
      };

      const summaryResult = {
        totalDue: 5000,
        totalPaid: 3000,
        declarationsByType: {
          TVA: { count: 3, amount: 2000 },
          IPR: { count: 2, amount: 3000 },
        },
      };

      mockTaxService.getTaxSummary.mockResolvedValue(summaryResult);

      const result = await controller.getTaxSummary(fiscalYearId, req);

      expect(result).toEqual(summaryResult);
      expect(mockTaxService.getTaxSummary).toHaveBeenCalledWith(fiscalYearId, 'company-id');
    });
  });

  describe('findOne', () => {
    it('should return a single tax declaration by id', async () => {
      const declarationId = 'declaration-id';
      const declaration = {
        id: declarationId,
        type: DeclarationType.TVA,
        period: '2025-06',
        status: DeclarationStatus.DRAFT,
      };

      mockTaxService.findById.mockResolvedValue(declaration);

      const result = await controller.findOne(declarationId);

      expect(result).toEqual(declaration);
      expect(mockTaxService.findById).toHaveBeenCalledWith(declarationId);
    });

    it('should throw NotFoundException when declaration not found', async () => {
      const declarationId = 'non-existent-id';

      mockTaxService.findById.mockRejectedValue(new NotFoundException('Declaration not found'));

      await expect(controller.findOne(declarationId)).rejects.toThrow(NotFoundException);
      expect(mockTaxService.findById).toHaveBeenCalledWith(declarationId);
    });
  });

  describe('update', () => {
    it('should update tax declaration', async () => {
      const declarationId = 'declaration-id';
      const updateDto: UpdateTaxDeclarationDto = {
        taxableBase: 12000,
        taxRate: 16,
      };
      const req = {
        user: {
          id: 'user-id',
        },
      };

      const updatedDeclaration = {
        id: declarationId,
        type: DeclarationType.TVA,
        period: '2025-06',
        taxableBase: 12000,
        taxRate: 16,
        amount: 1920,
        status: DeclarationStatus.DRAFT,
      };

      mockTaxService.update.mockResolvedValue(updatedDeclaration);

      const result = await controller.update(declarationId, updateDto, req);

      expect(result).toEqual(updatedDeclaration);
      expect(mockTaxService.update).toHaveBeenCalledWith(declarationId, updateDto, req.user.id);
    });
  });

  describe('submit', () => {
    it('should submit tax declaration', async () => {
      const declarationId = 'declaration-id';
      const req = {
        user: {
          id: 'user-id',
        },
      };

      const submittedDeclaration = {
        id: declarationId,
        type: DeclarationType.TVA,
        period: '2025-06',
        status: DeclarationStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedBy: 'user-id',
      };

      mockTaxService.updateStatus.mockResolvedValue(submittedDeclaration);

      const result = await controller.submit(declarationId, req);

      expect(result).toEqual(submittedDeclaration);
      expect(mockTaxService.updateStatus).toHaveBeenCalledWith(
        declarationId,
        { status: DeclarationStatus.SUBMITTED },
        req.user.id
      );
    });
  });

  describe('download', () => {
    it('should handle download requests for tax declarations', async () => {
      const declarationId = 'declaration-id';
      const format = 'pdf';
      
      const declaration = {
        id: declarationId,
        type: DeclarationType.TVA,
        period: '2025-06',
      };

      mockTaxService.findById.mockResolvedValue(declaration);

      const res = {
        setHeader: jest.fn(),
        json: jest.fn(),
      };

      await controller.download(declarationId, format, res as any);

      expect(mockTaxService.findById).toHaveBeenCalledWith(declarationId);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename=declaration-${declarationId}.pdf`);
      expect(res.json).toHaveBeenCalledWith({
        message: `Download of declaration ${declarationId} in ${format} format would happen here`,
        declaration: declaration,
      });
    });

    it('should throw NotFoundException for unsupported formats', async () => {
      const declarationId = 'declaration-id';
      const format = 'unsupported';
      
      const declaration = {
        id: declarationId,
        type: DeclarationType.TVA,
        period: '2025-06',
      };

      mockTaxService.findById.mockResolvedValue(declaration);

      const res = {
        setHeader: jest.fn(),
        json: jest.fn(),
      };

      await expect(controller.download(declarationId, format, res as any)).rejects.toThrow(NotFoundException);
    });
  });
});
