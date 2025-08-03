import { Test, TestingModule } from '@nestjs/testing';
import { FinancingController } from '../../src/modules/financing/financing.controller';
import { FinancingService } from '../../src/modules/financing/financing.service';
import { FinancingRecord, FinancingRequestStatus, FinancingType } from '../../src/modules/financing/entities/financing-record.entity';
import { CreateFinancingRecordDto } from '../../src/modules/financing/dto/create-financing-record.dto';
import { UpdateFinancingRecordDto } from '../../src/modules/financing/dto/update-financing-record.dto';
import { ListFinancingRecordsDto } from '../../src/modules/financing/dto/list-financing-records.dto';
import { User, UserRole } from '../../src/modules/auth/entities/user.entity';

describe('FinancingController', () => {
  let controller: FinancingController;
  let service: FinancingService;

  const mockFinancingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancingController],
      providers: [
        {
          provide: FinancingService,
          useValue: mockFinancingService,
        },
      ],
    }).compile();

    controller = module.get<FinancingController>(FinancingController);
    service = module.get<FinancingService>(FinancingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new financing record', async () => {
      const createFinancingRecordDto: CreateFinancingRecordDto = {
        type: FinancingType.BUSINESS_LOAN,
        amount: 500000,
        currency: 'CDF',
        term: 12,
        purpose: 'Loan for business expansion',
        businessInformation: {
          name: 'Test Business',
          registrationNumber: 'RCCM/123',
          address: 'Test Address',
          yearsInBusiness: 3,
          numberOfEmployees: 10,
          annualRevenue: 100000,
        },
        financialInformation: {
          monthlyRevenue: 50000,
          monthlyExpenses: 30000,
          existingLoans: [],
        },
      };

      const mockFinancingRecord = {
        id: 'financing-123',
        ...createFinancingRecordDto,
        userId: mockUser.id,
        status: FinancingRequestStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as FinancingRecord;

      mockFinancingService.create.mockResolvedValue(mockFinancingRecord);

      const result = await controller.create(createFinancingRecordDto, mockUser);

      expect(mockFinancingService.create).toHaveBeenCalledWith(createFinancingRecordDto, mockUser);
      expect(result).toEqual({
        success: true,
        data: expect.any(Object), // FinancingRequestResponseDto instance
        message: 'Financing request created successfully',
        statusCode: 201
      });
    });

    it('should handle errors during creation', async () => {
      const createFinancingRecordDto: CreateFinancingRecordDto = {
        type: FinancingType.BUSINESS_LOAN,
        amount: 500000,
        currency: 'CDF',
        term: 12,
        purpose: 'Loan for business expansion',
        businessInformation: {
          name: 'Test Business',
          registrationNumber: 'RCCM/123',
          address: 'Test Address',
          yearsInBusiness: 3,
          numberOfEmployees: 10,
          annualRevenue: 100000,
        },
        financialInformation: {
          monthlyRevenue: 50000,
          monthlyExpenses: 30000,
          existingLoans: [],
        },
      };

      mockFinancingService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createFinancingRecordDto, mockUser)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated list of financing records', async () => {
      const listFinancingRecordsDto: ListFinancingRecordsDto = {
        page: 1,
        limit: 10,
      };

      const mockFinancingRecords = [
        {
          id: 'financing-1',
          type: FinancingType.BUSINESS_LOAN,
          amount: 500000,
          status: FinancingRequestStatus.SUBMITTED,
          userId: mockUser.id,
        },
        {
          id: 'financing-2',
          type: FinancingType.EQUIPMENT_LOAN,
          amount: 300000,
          status: FinancingRequestStatus.APPROVED,
          userId: mockUser.id,
        },
      ];

      const mockResult = {
        data: mockFinancingRecords,
        total: 2,
        page: 1,
        limit: 10,
      };

      mockFinancingService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(listFinancingRecordsDto, mockUser);

      expect(mockFinancingService.findAll).toHaveBeenCalledWith(listFinancingRecordsDto, mockUser);
      expect(result).toEqual({
        success: true,
        data: expect.any(Array), // Array of FinancingRequestResponseDto instances
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        message: 'Financing requests retrieved successfully',
        statusCode: 200
      });
    });

    it('should apply filters when provided', async () => {
      const listFinancingRecordsDto: ListFinancingRecordsDto = {
        page: 1,
        limit: 10,
        type: FinancingType.BUSINESS_LOAN,
        status: FinancingRequestStatus.APPROVED,
        search: 'business expansion',
      };

      const mockFinancingRecords = [
        {
          id: 'financing-1',
          type: FinancingType.BUSINESS_LOAN,
          status: FinancingRequestStatus.APPROVED,
        },
      ];

      const mockResult = {
        data: mockFinancingRecords,
        total: 1,
        page: 1,
        limit: 10,
      };

      mockFinancingService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(listFinancingRecordsDto, mockUser);

      expect(mockFinancingService.findAll).toHaveBeenCalledWith(listFinancingRecordsDto, mockUser);
      expect(result.data).toEqual(mockFinancingRecords);
    });
  });

  describe('findOne', () => {
    it('should return a specific financing record', async () => {
      const financingId = 'financing-123';
      const mockFinancingRecord = {
        id: financingId,
        type: FinancingType.BUSINESS_LOAN,
        amount: 500000,
        status: FinancingRequestStatus.SUBMITTED,
        userId: mockUser.id,
      } as FinancingRecord;

      mockFinancingService.findOne.mockResolvedValue(mockFinancingRecord);

      const result = await controller.findOne(financingId, mockUser);

      expect(mockFinancingService.findOne).toHaveBeenCalledWith(financingId, mockUser);
      expect(result).toEqual({
        success: true,
        data: expect.any(Object), // FinancingRequestResponseDto instance
        message: 'Financing request retrieved successfully',
        statusCode: 200
      });
    });

    it('should handle not found errors', async () => {
      const financingId = 'non-existent-id';

      mockFinancingService.findOne.mockRejectedValue(new Error('Financing record not found'));

      await expect(controller.findOne(financingId, mockUser)).rejects.toThrow('Financing record not found');
    });
  });

  describe('update', () => {
    it('should update a financing record', async () => {
      const financingId = 'financing-123';
      const updateFinancingRecordDto: UpdateFinancingRecordDto = {
        amount: 600000,
        status: FinancingRequestStatus.APPROVED,
        notes: 'Updated notes',
      };

      const mockUpdatedRecord = {
        id: financingId,
        type: FinancingType.BUSINESS_LOAN,
        amount: 600000,
        status: FinancingRequestStatus.APPROVED,
        notes: 'Updated notes',
        userId: mockUser.id,
      } as FinancingRecord;

      mockFinancingService.update.mockResolvedValue(mockUpdatedRecord);

      const result = await controller.update(financingId, updateFinancingRecordDto, mockUser);

      expect(mockFinancingService.update).toHaveBeenCalledWith(financingId, updateFinancingRecordDto, mockUser);
      expect(result).toEqual({
        success: true,
        data: expect.any(Object), // FinancingRequestResponseDto instance
        message: 'Financing request updated successfully',
        statusCode: 200
      });
    });

    it('should handle update errors', async () => {
      const financingId = 'financing-123';
      const updateFinancingRecordDto: UpdateFinancingRecordDto = {
        amount: 600000,
      };

      mockFinancingService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update(financingId, updateFinancingRecordDto, mockUser)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delete a financing record', async () => {
      const financingId = 'financing-123';

      mockFinancingService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(financingId, mockUser);

      expect(mockFinancingService.remove).toHaveBeenCalledWith(financingId, mockUser);
      expect(result).toEqual({
        success: true,
        message: 'Financing request deleted successfully',
        statusCode: 200
      });
    });

    it('should handle deletion errors', async () => {
      const financingId = 'financing-123';

      mockFinancingService.remove.mockRejectedValue(new Error('Deletion failed'));

      await expect(controller.remove(financingId, mockUser)).rejects.toThrow('Deletion failed');
    });
  });
});
