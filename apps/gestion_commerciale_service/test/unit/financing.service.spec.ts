import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { FinancingService } from '../../src/modules/financing/financing.service';
import { FinancingRecord, FinancingRequestStatus, FinancingType } from '../../src/modules/financing/entities/financing-record.entity';
import { CreateFinancingRecordDto } from '../../src/modules/financing/dto/create-financing-record.dto';
import { UpdateFinancingRecordDto } from '../../src/modules/financing/dto/update-financing-record.dto';
import { User, UserRole } from '../../src/modules/auth/entities/user.entity';

describe('FinancingService', () => {
  let service: FinancingService;
  let repository: Repository<FinancingRecord>;

  const mockFinancingRecordRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
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
      providers: [
        FinancingService,
        {
          provide: getRepositoryToken(FinancingRecord),
          useValue: mockFinancingRecordRepository,
        },
      ],
    }).compile();

    service = module.get<FinancingService>(FinancingService);
    repository = module.get<Repository<FinancingRecord>>(getRepositoryToken(FinancingRecord));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
        documents: [
          {
            type: 'contract',
            url: 'https://example.com/contract.pdf',
            name: 'Loan Contract',
          },
        ],
      };

      const mockFinancingRecord = {
        id: 'financing-123',
        ...createFinancingRecordDto,
        userId: mockUser.id,
        status: FinancingRequestStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFinancingRecordRepository.create.mockReturnValue(mockFinancingRecord);
      mockFinancingRecordRepository.save.mockResolvedValue(mockFinancingRecord);

      const result = await service.create(createFinancingRecordDto, mockUser);

      expect(mockFinancingRecordRepository.create).toHaveBeenCalledWith({
        ...createFinancingRecordDto,
        userId: mockUser.id,
      });
      expect(mockFinancingRecordRepository.save).toHaveBeenCalledWith(mockFinancingRecord);
      expect(result).toEqual(mockFinancingRecord);
    });
  });

  describe('findAll', () => {
    it('should return paginated financing records for user', async () => {
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

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockFinancingRecords, 2]),
      };

      mockFinancingRecordRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({
        page: 1,
        limit: 10,
      }, mockUser);

      expect(result).toEqual({
        data: mockFinancingRecords,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should filter financing records by type', async () => {
      const mockFinancingRecords = [
        {
          id: 'financing-1',
          type: FinancingType.BUSINESS_LOAN,
          amount: 500000,
          status: FinancingRequestStatus.SUBMITTED,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockFinancingRecords, 1]),
      };

      mockFinancingRecordRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        type: FinancingType.BUSINESS_LOAN,
      }, mockUser);

      expect(result.data).toEqual(mockFinancingRecords);
      expect(result.total).toBe(1);
    });

    it('should filter financing records by status', async () => {
      const mockFinancingRecords = [
        {
          id: 'financing-1',
          type: FinancingType.BUSINESS_LOAN,
          status: FinancingRequestStatus.APPROVED,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockFinancingRecords, 1]),
      };

      mockFinancingRecordRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        status: FinancingRequestStatus.APPROVED,
      }, mockUser);

      expect(result.data).toEqual(mockFinancingRecords);
    });
  });

  describe('findOne', () => {
    it('should return a financing record by id for the user', async () => {
      const mockFinancingRecord = {
        id: 'financing-123',
        type: FinancingType.BUSINESS_LOAN,
        amount: 500000,
        status: FinancingRequestStatus.SUBMITTED,
        userId: mockUser.id,
      };

      mockFinancingRecordRepository.findOne.mockResolvedValue(mockFinancingRecord);

      const result = await service.findOne('financing-123', mockUser);

      expect(mockFinancingRecordRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'financing-123', userId: mockUser.id },
      });
      expect(result).toEqual(mockFinancingRecord);
    });

    it('should throw NotFoundException when record not found', async () => {
      mockFinancingRecordRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a financing record', async () => {
      const updateFinancingRecordDto: UpdateFinancingRecordDto = {
        amount: 600000,
        status: FinancingRequestStatus.APPROVED,
        notes: 'Updated notes',
      };

      const existingRecord = {
        id: 'financing-123',
        type: FinancingType.BUSINESS_LOAN,
        amount: 500000,
        status: FinancingRequestStatus.SUBMITTED,
        userId: mockUser.id,
      };

      const updatedRecord = {
        ...existingRecord,
        ...updateFinancingRecordDto,
      };

      mockFinancingRecordRepository.findOne.mockResolvedValue(existingRecord);
      mockFinancingRecordRepository.update.mockResolvedValue({ affected: 1 });
      mockFinancingRecordRepository.findOne.mockResolvedValueOnce(existingRecord).mockResolvedValueOnce(updatedRecord);

      const result = await service.update('financing-123', updateFinancingRecordDto, mockUser);

      expect(mockFinancingRecordRepository.update).toHaveBeenCalledWith('financing-123', {
        amount: 600000,
        status: FinancingRequestStatus.APPROVED,
        notes: 'Updated notes',
      });
      expect(result).toEqual(updatedRecord);
    });

    it('should throw NotFoundException when record not found', async () => {
      mockFinancingRecordRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {}, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a financing record', async () => {
      const mockRecord = {
        id: 'financing-123',
        type: FinancingType.BUSINESS_LOAN,
        userId: mockUser.id,
      };

      mockFinancingRecordRepository.findOne.mockResolvedValue(mockRecord);
      mockFinancingRecordRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('financing-123', mockUser);

      expect(mockFinancingRecordRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'financing-123', userId: mockUser.id },
      });
      expect(mockFinancingRecordRepository.delete).toHaveBeenCalledWith({
        id: 'financing-123',
        userId: mockUser.id,
      });
    });

    it('should throw NotFoundException when record not found', async () => {
      mockFinancingRecordRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when delete operation affects no rows', async () => {
      const mockRecord = {
        id: 'financing-123',
        type: FinancingType.BUSINESS_LOAN,
        userId: mockUser.id,
      };

      mockFinancingRecordRepository.findOne.mockResolvedValue(mockRecord);
      mockFinancingRecordRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('financing-123', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});
