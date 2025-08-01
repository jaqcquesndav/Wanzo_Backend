import { Test, TestingModule } from '@nestjs/testing';
import { BusinessOperationsController } from '../../src/modules/operations/business-operations.controller';
import { BusinessOperationsService } from '../../src/modules/operations/business-operations.service';
import { CreateBusinessOperationDto } from '../../src/modules/operations/dto/create-business-operation.dto';
import { UpdateBusinessOperationDto } from '../../src/modules/operations/dto/update-business-operation.dto';
import { ListBusinessOperationsDto } from '../../src/modules/operations/dto/list-business-operations.dto';
import { OperationStatus, OperationType } from '../../src/modules/operations/entities/business-operation.entity';

describe('BusinessOperationsController', () => {
  let controller: BusinessOperationsController;
  let service: BusinessOperationsService;

  const mockBusinessOperationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getOperationsSummary: jest.fn(),
    exportOperations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessOperationsController],
      providers: [
        {
          provide: BusinessOperationsService,
          useValue: mockBusinessOperationsService,
        },
      ],
    }).compile();

    controller = module.get<BusinessOperationsController>(BusinessOperationsController);
    service = module.get<BusinessOperationsService>(BusinessOperationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new operation', async () => {
      // Arrange
      const user = { id: 'user-123', username: 'testuser', sub: 'user-123' };
      const createDto: CreateBusinessOperationDto = {
        type: OperationType.SALE,
        date: new Date(),
        description: 'Test Operation',
        amountCdf: 1000,
        status: OperationStatus.COMPLETED,
      };

      const createdOperation = {
        id: 'op-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.sub,
      };

      mockBusinessOperationsService.create.mockResolvedValue(createdOperation);

      // Act
      const result = await controller.create(createDto, { user });

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto, user.sub);
      expect(result).toEqual({
        status: 'success',
        data: createdOperation
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated operations', async () => {
      // Arrange
      const query: ListBusinessOperationsDto = {
        page: 1,
        limit: 10,
      };

      const paginatedResult = {
        items: [
          {
            id: 'op-1',
            type: OperationType.SALE,
            description: 'Sale 1',
          },
          {
            id: 'op-2',
            type: OperationType.EXPENSE,
            description: 'Expense 1',
          },
        ],
        totalItems: 2,
        currentPage: 1,
        totalPages: 1,
      };

      mockBusinessOperationsService.findAll.mockResolvedValue(paginatedResult);

      // Act
      const result = await controller.findAll(query);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        status: 'success',
        data: paginatedResult
      });
    });
  });

  describe('findOne', () => {
    it('should return a single operation', async () => {
      // Arrange
      const id = 'op-123';
      const operation = {
        id,
        type: OperationType.SALE,
        description: 'Test Operation',
      };

      mockBusinessOperationsService.findOne.mockResolvedValue(operation);

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        status: 'success',
        data: operation
      });
    });
  });

  describe('update', () => {
    it('should update and return the operation', async () => {
      // Arrange
      const id = 'op-123';
      const updateDto: UpdateBusinessOperationDto = {
        description: 'Updated Description',
        status: OperationStatus.PENDING,
      };

      const updatedOperation = {
        id,
        type: OperationType.SALE,
        description: updateDto.description,
        status: updateDto.status,
      };

      mockBusinessOperationsService.update.mockResolvedValue(updatedOperation);

      // Act
      const result = await controller.update(id, updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual({
        status: 'success',
        data: updatedOperation
      });
    });
  });

  describe('remove', () => {
    it('should call service.remove with correct id', async () => {
      // Arrange
      const id = 'op-123';
      mockBusinessOperationsService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(id);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('getSummary', () => {
    it('should return operations summary by period', async () => {
      // Arrange
      const period = 'month';
      const date = '2025-07-01';

      const summary = {
        period: 'month',
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        summary: {
          totalOperations: 10,
          byType: {
            [OperationType.SALE]: {
              count: 5,
              amountCdf: 10000,
            },
          },
          byStatus: {
            [OperationStatus.COMPLETED]: 8,
            [OperationStatus.PENDING]: 2,
          },
        },
      };

      mockBusinessOperationsService.getOperationsSummary.mockResolvedValue(summary);

      // Act
      const result = await controller.getSummary(period, date);

      // Assert
      expect(service.getOperationsSummary).toHaveBeenCalledWith(period, date);
      expect(result).toEqual({
        status: 'success',
        data: summary
      });
    });
  });
});
