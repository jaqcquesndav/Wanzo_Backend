import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PortfolioService } from '../../../src/modules/portfolios/services/portfolio.service';
import { Portfolio, PortfolioStatus, RiskProfile, PortfolioType } from '../../../src/modules/portfolios/entities/portfolio.entity';
import { FinancialProduct } from '../../../src/modules/portfolios/entities/financial-product.entity';
import { FundingRequest } from '../../../src/modules/portfolios/entities/funding-request.entity';
import { Contract } from '../../../src/modules/portfolios/entities/contract.entity';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioFilterDto } from '../../../src/modules/portfolios/dtos/portfolio.dto';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepository: Repository<Portfolio>;
  let productRepository: Repository<FinancialProduct>;
  let fundingRequestRepository: Repository<FundingRequest>;
  let contractRepository: Repository<Contract>;

  const mockPortfolio: Portfolio = {
    id: '1',
    reference: 'TRP-2025-001',
    name: 'Test Portfolio',
    description: 'Test Description',
    manager_id: 'mgr-123',
    institution_id: 'inst-456',
    type: PortfolioType.TRADITIONAL,
    status: PortfolioStatus.ACTIVE,
    target_amount: 100000,
    target_return: 12,
    target_sectors: ['Commerce', 'Services'],
    risk_profile: RiskProfile.MODERATE,
    products: [],
    currency: 'XOF',
    created_at: new Date(),
    updated_at: new Date(),
    createdBy: 'user-123'
  };

  const mockRepositoryFactory = (entityClass: any) => ({
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
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockRepositoryFactory(Portfolio),
        },
        {
          provide: getRepositoryToken(FinancialProduct),
          useValue: mockRepositoryFactory(FinancialProduct),
        },
        {
          provide: getRepositoryToken(FundingRequest),
          useValue: mockRepositoryFactory(FundingRequest),
        },
        {
          provide: getRepositoryToken(Contract),
          useValue: mockRepositoryFactory(Contract),
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    portfolioRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    productRepository = module.get<Repository<FinancialProduct>>(getRepositoryToken(FinancialProduct));
    fundingRequestRepository = module.get<Repository<FundingRequest>>(getRepositoryToken(FundingRequest));
    contractRepository = module.get<Repository<Contract>>(getRepositoryToken(Contract));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new portfolio', async () => {
      const createPortfolioDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        description: 'Test Description',
        manager_id: 'mgr-123',
        institution_id: 'inst-456',
        target_amount: 100000,
        target_return: 12,
        target_sectors: ['Commerce', 'Services'],
        risk_profile: RiskProfile.MODERATE,
        currency: 'XOF',
      };

      const userId = 'user-123';

      portfolioRepository.create = jest.fn().mockReturnValue(mockPortfolio);
      portfolioRepository.save = jest.fn().mockResolvedValue(mockPortfolio);

      const result = await service.create(createPortfolioDto, userId);

      expect(portfolioRepository.create).toHaveBeenCalledWith({
        ...createPortfolioDto,
        reference: expect.stringMatching(/^TRP-\d{4}-\d{3}$/),
        status: PortfolioStatus.ACTIVE,
        createdBy: userId,
      });
      expect(portfolioRepository.save).toHaveBeenCalledWith(mockPortfolio);
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('findById', () => {
    it('should return a portfolio by id', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(mockPortfolio);

      const result = await service.findById('1');

      expect(portfolioRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockPortfolio);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
      expect(portfolioRepository.findOne).toHaveBeenCalledWith({ where: { id: '999' } });
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      const updatePortfolioDto: UpdatePortfolioDto = {
        name: 'Updated Portfolio',
        target_amount: 200000,
      };

      portfolioRepository.findOne = jest.fn().mockResolvedValue(mockPortfolio);
      portfolioRepository.save = jest.fn().mockResolvedValue({
        ...mockPortfolio,
        ...updatePortfolioDto,
      });

      const result = await service.update('1', updatePortfolioDto);

      expect(portfolioRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(portfolioRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updatePortfolioDto.name);
      expect(result.target_amount).toBe(updatePortfolioDto.target_amount);
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(null);

      const updatePortfolioDto: UpdatePortfolioDto = {
        name: 'Updated Portfolio',
      };

      await expect(service.update('999', updatePortfolioDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    it('should close a portfolio when no active entities', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(mockPortfolio);
      contractRepository.count = jest.fn().mockResolvedValue(0);
      fundingRequestRepository.count = jest.fn().mockResolvedValue(0);
      portfolioRepository.save = jest.fn().mockResolvedValue({
        ...mockPortfolio,
        status: PortfolioStatus.CLOSED,
      });

      const closeData = { closureReason: 'Test closure' };
      const result = await service.close('1', closeData);

      expect(contractRepository.count).toHaveBeenCalled();
      expect(fundingRequestRepository.count).toHaveBeenCalled();
      expect(portfolioRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(PortfolioStatus.CLOSED);
    });

    it('should throw BadRequestException if portfolio already closed', async () => {
      const closedPortfolio = { ...mockPortfolio, status: PortfolioStatus.CLOSED };
      portfolioRepository.findOne = jest.fn().mockResolvedValue(closedPortfolio);

      const closeData = { closureReason: 'Test closure' };

      await expect(service.close('1', closeData)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if there are active contracts', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(mockPortfolio);
      contractRepository.count = jest.fn().mockResolvedValue(1); // Active contracts exist
      fundingRequestRepository.count = jest.fn().mockResolvedValue(0);

      const closeData = { closureReason: 'Test closure' };

      await expect(service.close('1', closeData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should close portfolio instead of deleting when no associated entities', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(mockPortfolio);
      productRepository.count = jest.fn().mockResolvedValue(0);
      fundingRequestRepository.count = jest.fn().mockResolvedValue(0);
      contractRepository.count = jest.fn().mockResolvedValue(0);
      portfolioRepository.save = jest.fn().mockResolvedValue({
        ...mockPortfolio,
        status: PortfolioStatus.CLOSED,
      });

      const result = await service.delete('1');

      expect(productRepository.count).toHaveBeenCalled();
      expect(fundingRequestRepository.count).toHaveBeenCalled();
      expect(contractRepository.count).toHaveBeenCalled();
      expect(portfolioRepository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Portfolio closed successfully');
    });

    it('should throw BadRequestException if portfolio has associated entities', async () => {
      portfolioRepository.findOne = jest.fn().mockResolvedValue(mockPortfolio);
      productRepository.count = jest.fn().mockResolvedValue(1); // Has associated products

      await expect(service.delete('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated portfolios', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockPortfolio], 1]),
      };

      portfolioRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const filters: PortfolioFilterDto = {
        status: PortfolioStatus.ACTIVE,
      };

      const result = await service.findAll(filters, 1, 10);

      expect(portfolioRepository.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('p.status = :status', { status: PortfolioStatus.ACTIVE });
      expect(result.portfolios).toEqual([mockPortfolio]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });
  });
});
