import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreditRequestService } from '../../../src/modules/portfolios/services/credit-request.service';
import { CreditRequest, CreditRequestStatus, Periodicity, ScheduleType } from '../../../src/modules/portfolios/entities/credit-request.entity';
import { CreateCreditRequestDto, UpdateCreditRequestDto, CreditRequestFilterDto } from '../../../src/modules/portfolios/dtos/credit-request.dto';

describe('CreditRequestService', () => {
  let service: CreditRequestService;
  let creditRequestRepository: Repository<CreditRequest>;

  const mockCreditRequest: CreditRequest = {
    id: '1',
    memberId: 'mem-001',
    productId: 'prod-001',
    receptionDate: new Date('2023-07-15'),
    requestAmount: 50000,
    periodicity: Periodicity.MONTHLY,
    interestRate: 8.5,
    reason: 'Expansion des activités commerciales',
    scheduleType: ScheduleType.CONSTANT,
    schedulesCount: 12,
    deferredPaymentsCount: 0,
    financingPurpose: 'Achat de stocks et aménagement de local',
    creditManagerId: 'mgr-001',
    isGroup: false,
    status: CreditRequestStatus.PENDING,
    portfolioId: 'portfolio-1',
    currency: 'XOF',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepositoryFactory = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditRequestService,
        {
          provide: getRepositoryToken(CreditRequest),
          useValue: mockRepositoryFactory(),
        },
      ],
    }).compile();

    service = module.get<CreditRequestService>(CreditRequestService);
    creditRequestRepository = module.get<Repository<CreditRequest>>(getRepositoryToken(CreditRequest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new credit request', async () => {
      const createCreditRequestDto: CreateCreditRequestDto = {
        memberId: 'mem-001',
        productId: 'prod-001',
        receptionDate: '2023-07-15',
        requestAmount: 50000,
        periodicity: Periodicity.MONTHLY,
        interestRate: 8.5,
        reason: 'Expansion des activités commerciales',
        scheduleType: ScheduleType.CONSTANT,
        schedulesCount: 12,
        financingPurpose: 'Achat de stocks et aménagement de local',
        creditManagerId: 'mgr-001',
        portfolioId: 'portfolio-1',
      };

      const userId = 'user-123';

      creditRequestRepository.create = jest.fn().mockReturnValue(mockCreditRequest);
      creditRequestRepository.save = jest.fn().mockResolvedValue(mockCreditRequest);

      const result = await service.create(createCreditRequestDto, userId);

      expect(creditRequestRepository.create).toHaveBeenCalledWith({
        ...createCreditRequestDto,
        receptionDate: new Date(createCreditRequestDto.receptionDate),
      });
      expect(creditRequestRepository.save).toHaveBeenCalledWith(mockCreditRequest);
      expect(result).toEqual(mockCreditRequest);
    });
  });

  describe('findById', () => {
    it('should return a credit request by id', async () => {
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(mockCreditRequest);

      const result = await service.findById('1');

      expect(creditRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['portfolio'],
      });
      expect(result).toEqual(mockCreditRequest);
    });

    it('should throw NotFoundException when credit request not found', async () => {
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
      expect(creditRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '999' },
        relations: ['portfolio'],
      });
    });
  });

  describe('update', () => {
    it('should update a credit request', async () => {
      const updateCreditRequestDto: UpdateCreditRequestDto = {
        requestAmount: 75000,
        interestRate: 9.0,
      };

      creditRequestRepository.findOne = jest.fn().mockResolvedValue(mockCreditRequest);
      creditRequestRepository.save = jest.fn().mockResolvedValue({
        ...mockCreditRequest,
        ...updateCreditRequestDto,
      });

      const result = await service.update('1', updateCreditRequestDto);

      expect(creditRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['portfolio'],
      });
      expect(creditRequestRepository.save).toHaveBeenCalled();
      expect(result.requestAmount).toBe(updateCreditRequestDto.requestAmount);
      expect(result.interestRate).toBe(updateCreditRequestDto.interestRate);
    });

    it('should throw NotFoundException when credit request not found', async () => {
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(null);

      const updateCreditRequestDto: UpdateCreditRequestDto = {
        requestAmount: 75000,
      };

      await expect(service.update('999', updateCreditRequestDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve a pending credit request', async () => {
      const pendingCreditRequest = { ...mockCreditRequest, status: CreditRequestStatus.PENDING };
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(pendingCreditRequest);
      creditRequestRepository.save = jest.fn().mockResolvedValue({
        ...pendingCreditRequest,
        status: CreditRequestStatus.APPROVED,
      });

      const approvalData = { notes: 'Approved after review' };
      const result = await service.approve('1', approvalData);

      expect(creditRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['portfolio'],
      });
      expect(creditRequestRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(CreditRequestStatus.APPROVED);
    });

    it('should throw ConflictException if credit request cannot be approved', async () => {
      const approvedCreditRequest = { ...mockCreditRequest, status: CreditRequestStatus.APPROVED };
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(approvedCreditRequest);

      const approvalData = { notes: 'Already approved' };

      await expect(service.approve('1', approvalData)).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('should reject a pending credit request', async () => {
      const pendingCreditRequest = { ...mockCreditRequest, status: CreditRequestStatus.PENDING };
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(pendingCreditRequest);
      creditRequestRepository.save = jest.fn().mockResolvedValue({
        ...pendingCreditRequest,
        status: CreditRequestStatus.REJECTED,
      });

      const rejectionData = { reason: 'Insufficient documentation', notes: 'Missing financial statements' };
      const result = await service.reject('1', rejectionData);

      expect(creditRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['portfolio'],
      });
      expect(creditRequestRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(CreditRequestStatus.REJECTED);
    });

    it('should throw ConflictException if credit request cannot be rejected', async () => {
      const disbursedCreditRequest = { ...mockCreditRequest, status: CreditRequestStatus.DISBURSED };
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(disbursedCreditRequest);

      const rejectionData = { reason: 'Cannot reject disbursed request' };

      await expect(service.reject('1', rejectionData)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a draft credit request', async () => {
      const draftCreditRequest = { ...mockCreditRequest, status: CreditRequestStatus.DRAFT };
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(draftCreditRequest);
      creditRequestRepository.remove = jest.fn().mockResolvedValue(draftCreditRequest);

      const result = await service.delete('1');

      expect(creditRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['portfolio'],
      });
      expect(creditRequestRepository.remove).toHaveBeenCalledWith(draftCreditRequest);
      expect(result.message).toBe('Credit request deleted successfully');
    });

    it('should throw ConflictException if trying to delete approved credit request', async () => {
      const approvedCreditRequest = { ...mockCreditRequest, status: CreditRequestStatus.APPROVED };
      creditRequestRepository.findOne = jest.fn().mockResolvedValue(approvedCreditRequest);

      await expect(service.delete('1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated credit requests with filters', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockCreditRequest], 1]),
      };

      creditRequestRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const filters: CreditRequestFilterDto = {
        status: CreditRequestStatus.PENDING,
        portfolioId: 'portfolio-1',
      };

      const result = await service.findAll(filters, 1, 10);

      expect(creditRequestRepository.createQueryBuilder).toHaveBeenCalledWith('creditRequest');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('creditRequest.portfolioId = :portfolioId', { portfolioId: 'portfolio-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('creditRequest.status = :status', { status: CreditRequestStatus.PENDING });
      expect(result.creditRequests).toEqual([mockCreditRequest]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });
  });
});
