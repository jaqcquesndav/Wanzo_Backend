import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OperationService } from './operation.service';
import { Operation, OperationType, OperationStatus } from '../entities/operation.entity';
import { WorkflowService } from './workflow.service';
import { CreateOperationDto } from '../dtos/operation.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OperationService', () => {
  let service: OperationService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockWorkflowService = {
    createInitialWorkflow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationService,
        {
          provide: getRepositoryToken(Operation),
          useValue: mockRepository,
        },
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    service = module.get<OperationService>(OperationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOperationDto: CreateOperationDto = {
      type: OperationType.CREDIT,
      portfolioId: 'portfolio-123',
      productId: 'product-123',
      dateEmission: new Date(),
      rateOrYield: 5.5,
      quantity: 1,
      duration: 12,
      description: 'Test operation',
      requestedAmount: 10000,
    };

    it('should create a credit operation successfully', async () => {
      const operation = { id: 'operation-123', ...createOperationDto };

      mockRepository.create.mockReturnValue(operation);
      mockRepository.save.mockResolvedValue(operation);
      mockWorkflowService.createInitialWorkflow.mockResolvedValue({ id: 'workflow-123' });

      const result = await service.create(createOperationDto, 'user-123');

      expect(result).toEqual(operation);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: createOperationDto.type,
          status: OperationStatus.PENDING,
          createdBy: 'user-123',
        }),
      );
      expect(mockWorkflowService.createInitialWorkflow).toHaveBeenCalled();
    });

    it('should validate required fields for credit operations', async () => {
      const invalidDto = {
        ...createOperationDto,
        requestedAmount: undefined,
        productId: undefined,
      };

      await expect(service.create(invalidDto, 'user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated operations', async () => {
      const operations = [
        { id: 'operation-1', type: OperationType.CREDIT },
        { id: 'operation-2', type: OperationType.LEASING },
      ];

      mockRepository.findAndCount.mockResolvedValue([operations, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        operations,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        type: OperationType.CREDIT,
        status: OperationStatus.PENDING,
        portfolioId: 'portfolio-123',
      };

      await service.findAll(filters, 1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters),
          relations: ['workflow', 'workflow.steps'],
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return an operation if found', async () => {
      const operation = {
        id: 'operation-123',
        type: OperationType.CREDIT,
        workflow: { id: 'workflow-123' },
      };

      mockRepository.findOne.mockResolvedValue(operation);

      const result = await service.findById('operation-123');

      expect(result).toEqual(operation);
    });

    it('should throw NotFoundException if operation not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update operation successfully', async () => {
      const operation = {
        id: 'operation-123',
        status: OperationStatus.PENDING,
      };

      const updateDto = {
        status: OperationStatus.ACTIVE,
        rateOrYield: 6.0,
      };

      mockRepository.findOne.mockResolvedValue(operation);
      mockRepository.save.mockResolvedValue({ ...operation, ...updateDto });

      const result = await service.update('operation-123', updateDto);

      expect(result.status).toBe(OperationStatus.ACTIVE);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });

    it('should validate status transitions', async () => {
      const operation = {
        id: 'operation-123',
        status: OperationStatus.COMPLETED,
      };

      mockRepository.findOne.mockResolvedValue(operation);

      await expect(
        service.update('operation-123', { status: OperationStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete pending operation', async () => {
      const operation = {
        id: 'operation-123',
        status: OperationStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(operation);
      mockRepository.remove.mockResolvedValue(operation);

      const result = await service.delete('operation-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Operation deleted successfully');
    });

    it('should not allow deletion of non-pending operations', async () => {
      const operation = {
        id: 'operation-123',
        status: OperationStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(operation);

      await expect(service.delete('operation-123')).rejects.toThrow(BadRequestException);
    });
  });
});