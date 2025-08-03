import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { BusinessOperationsService } from '../../src/modules/operations/business-operations.service';
import { BusinessOperation, OperationStatus, OperationType } from '../../src/modules/operations/entities/business-operation.entity';
import { CreateBusinessOperationDto } from '../../src/modules/operations/dto/create-business-operation.dto';
import { UpdateBusinessOperationDto } from '../../src/modules/operations/dto/update-business-operation.dto';
import { ListBusinessOperationsDto } from '../../src/modules/operations/dto/list-business-operations.dto';
import { ExportOperationsDto } from '../../src/modules/operations/dto/export-operations.dto';
import { EventsService } from '../../src/modules/events/events.service';
import { NotFoundException } from '@nestjs/common';

describe('BusinessOperationsService', () => {
  let service: BusinessOperationsService;
  let repository: Repository<BusinessOperation>;

  // Créez des mocks pour le repository
  const mockBusinessOperationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockEventsService = {
    emit: jest.fn(),
    publishBusinessOperationEvent: jest.fn(),
    publishBusinessOperationCreated: jest.fn(),
    publishBusinessOperationUpdated: jest.fn(),
    publishBusinessOperationDeleted: jest.fn(),
  };

  beforeEach(async () => {
    // Réinitialisez les mocks avant chaque test
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessOperationsService,
        {
          provide: getRepositoryToken(BusinessOperation),
          useValue: mockBusinessOperationRepository,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<BusinessOperationsService>(BusinessOperationsService);
    repository = module.get<Repository<BusinessOperation>>(getRepositoryToken(BusinessOperation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new business operation', async () => {
      // Arrange
      const userId = 'user-123';
      const createDto: CreateBusinessOperationDto = {
        type: OperationType.SALE,
        date: new Date(),
        description: 'Test Sale',
        amountCdf: 100,
        amountUsd: 50,
        relatedPartyId: 'customer-456',
        relatedPartyName: 'Test Customer',
        entityId: 'invoice-789',
        status: OperationStatus.COMPLETED,
        notes: 'Test notes',
      };

      const createdOperation = {
        id: 'op-123',
        ...createDto,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock le comportement du repository
      mockBusinessOperationRepository.create.mockReturnValue(createdOperation);
      mockBusinessOperationRepository.save.mockResolvedValue(createdOperation);

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(mockBusinessOperationRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdBy: userId,
      });
      expect(mockBusinessOperationRepository.save).toHaveBeenCalledWith(createdOperation);
      expect(result).toEqual(createdOperation);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const userId = 'user-123';
      const createDto: CreateBusinessOperationDto = {
        type: OperationType.SALE,
        date: new Date(),
        description: 'Test Sale',
        amountCdf: 100,
        amountUsd: 50,
        relatedPartyId: 'customer-456',
        relatedPartyName: 'Test Customer',
        entityId: 'invoice-789',
        status: OperationStatus.COMPLETED,
        notes: 'Test notes',
      };

      const error = new Error('Database error');
      mockBusinessOperationRepository.create.mockReturnValue({});
      mockBusinessOperationRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return paginated operations with filtering', async () => {
      // Arrange
      const queryParams: ListBusinessOperationsDto = {
        type: OperationType.SALE,
        startDate: '2025-01-01',
        endDate: '2025-07-31',
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc',
      };

      const mockOperations = [
        {
          id: 'op-1',
          type: OperationType.SALE,
          date: new Date('2025-05-15'),
          description: 'Sale 1',
          amountCdf: 500,
        },
        {
          id: 'op-2',
          type: OperationType.SALE,
          date: new Date('2025-06-20'),
          description: 'Sale 2',
          amountCdf: 750,
        },
      ];

      mockBusinessOperationRepository.findAndCount.mockResolvedValue([mockOperations, 2]);

      // Act
      const result = await service.findAll(queryParams);

      // Assert
      expect(mockBusinessOperationRepository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        items: mockOperations,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
      });
      
      // Vérifiez que les paramètres de filtrage ont été appliqués correctement
      const findOptions = mockBusinessOperationRepository.findAndCount.mock.calls[0][0];
      expect(findOptions.where.type).toBe(OperationType.SALE);
      expect(findOptions.order).toEqual({ date: 'DESC' });
      expect(findOptions.skip).toBe(0);
      expect(findOptions.take).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return the operation if found', async () => {
      // Arrange
      const id = 'op-123';
      const mockOperation = {
        id,
        type: OperationType.SALE,
        date: new Date(),
        description: 'Test Sale',
      };

      mockBusinessOperationRepository.findOneBy.mockResolvedValue(mockOperation);

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(mockBusinessOperationRepository.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual(mockOperation);
    });

    it('should throw NotFoundException if operation not found', async () => {
      // Arrange
      const id = 'non-existent';
      mockBusinessOperationRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the updated operation', async () => {
      // Arrange
      const id = 'op-123';
      const updateDto: UpdateBusinessOperationDto = {
        description: 'Updated description',
        status: OperationStatus.PENDING,
      };

      const existingOperation = {
        id,
        type: OperationType.SALE,
        date: new Date(),
        description: 'Old description',
        status: OperationStatus.COMPLETED,
      };

      const updatedOperation = {
        ...existingOperation,
        description: updateDto.description,
        status: updateDto.status,
      };

      mockBusinessOperationRepository.findOneBy.mockResolvedValue(existingOperation);
      mockBusinessOperationRepository.save.mockResolvedValue(updatedOperation);

      // Act
      const result = await service.update(id, updateDto);

      // Assert
      expect(mockBusinessOperationRepository.findOneBy).toHaveBeenCalledWith({ id });
      expect(mockBusinessOperationRepository.save).toHaveBeenCalledWith({
        ...existingOperation,
        ...updateDto,
      });
      expect(result).toEqual(updatedOperation);
    });

    it('should throw NotFoundException if operation to update is not found', async () => {
      // Arrange
      const id = 'non-existent';
      const updateDto: UpdateBusinessOperationDto = { description: 'Updated description' };
      
      mockBusinessOperationRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the operation if found', async () => {
      // Arrange
      const id = 'op-123';
      const mockOperation = { id, type: OperationType.SALE };
      
      mockBusinessOperationRepository.findOneBy.mockResolvedValue(mockOperation);
      mockBusinessOperationRepository.remove.mockResolvedValue({});

      // Act
      await service.remove(id);

      // Assert
      expect(mockBusinessOperationRepository.findOneBy).toHaveBeenCalledWith({ id });
      expect(mockBusinessOperationRepository.remove).toHaveBeenCalledWith(mockOperation);
    });

    it('should throw NotFoundException if operation to remove is not found', async () => {
      // Arrange
      const id = 'non-existent';
      mockBusinessOperationRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOperationsSummary', () => {
    it('should return a summary for a month period', async () => {
      // Arrange
      const period = 'month';
      const date = '2025-07-01';
      
      // Mocking operations for the month of July 2025
      const mockOperations = [
        { id: 'op-1', type: OperationType.SALE, status: OperationStatus.COMPLETED, amountCdf: 1000, amountUsd: 100 },
        { id: 'op-2', type: OperationType.SALE, status: OperationStatus.COMPLETED, amountCdf: 2000, amountUsd: 200 },
        { id: 'op-3', type: OperationType.EXPENSE, status: OperationStatus.COMPLETED, amountCdf: 1500, amountUsd: 150 },
        { id: 'op-4', type: OperationType.INVENTORY, status: OperationStatus.PENDING, amountCdf: 500, productCount: 10 },
      ];
      
      mockBusinessOperationRepository.find.mockResolvedValue(mockOperations);

      // Act
      const result = await service.getOperationsSummary(period, date);

      // Assert
      expect(mockBusinessOperationRepository.find).toHaveBeenCalledWith({
        where: {
          date: Between(expect.any(Date), expect.any(Date)),
        },
      });
      
      expect(result).toMatchObject({
        period: 'month',
        summary: {
          totalOperations: 4,
          byType: {
            [OperationType.SALE]: {
              count: 2,
              amountCdf: 3000,
              amountUsd: 300,
            },
            [OperationType.EXPENSE]: {
              count: 1,
              amountCdf: 1500,
              amountUsd: 150,
            },
            [OperationType.INVENTORY]: {
              count: 1,
              amountCdf: 500,
              productCount: 10,
            },
          },
          byStatus: {
            [OperationStatus.COMPLETED]: 3,
            [OperationStatus.PENDING]: 1,
          },
        },
      });
    });
  });
});
