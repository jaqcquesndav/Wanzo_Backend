import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { Portfolio, RiskProfile } from '../entities/portfolio.entity';
import { FinancialProduct } from '../entities/financial-product.entity';
import { FundingRequest } from '../entities/funding-request.entity';
import { Contract } from '../entities/contract.entity';
import { CreatePortfolioDto } from '../dtos/portfolio.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPortfolioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockProductRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockFundingRequestRepository = {
    count: jest.fn(),
  };

  const mockContractRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockPortfolioRepository,
        },
        {
          provide: getRepositoryToken(FinancialProduct),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(FundingRequest),
          useValue: mockFundingRequestRepository,
        },
        {
          provide: getRepositoryToken(Contract),
          useValue: mockContractRepository,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new portfolio', async () => {
      const portfolioDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        target_amount: 1000000,
        manager_id: 'manager123',
        institution_id: 'institution123',
        risk_profile: RiskProfile.MODERATE
      };
      const userId = 'user123';
      const savedPortfolio = { id: 'portfolio123', ...portfolioDto };

      mockPortfolioRepository.create.mockReturnValue(savedPortfolio);
      mockPortfolioRepository.save.mockResolvedValue(savedPortfolio);

      const result = await service.create(portfolioDto, userId);

      expect(mockPortfolioRepository.create).toHaveBeenCalled();
      expect(mockPortfolioRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedPortfolio);
    });
  });

  describe('findAll', () => {
    it('should return an array of portfolios', async () => {
      const portfolios = [{ id: 'portfolio123', name: 'Portfolio 1' }];
      const page = 1;
      const perPage = 10;
      
      mockPortfolioRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([portfolios, 1]);

      const result = await service.findAll({}, page, perPage);

      expect(result).toEqual({
        portfolios,
        total: 1,
        page,
        perPage,
      });
    });
  });

  describe('findById', () => {
    it('should return a portfolio by id', async () => {
      const portfolio = { id: 'portfolio123', name: 'Portfolio 1' };
      
      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);

      const result = await service.findById('portfolio123');

      expect(result).toEqual(portfolio);
    });

    it('should throw NotFoundException if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      const portfolio = { id: 'portfolio123', name: 'Portfolio 1' };
      const updateDto = { name: 'Updated Portfolio' };
      const updatedPortfolio = { ...portfolio, ...updateDto };
      
      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockPortfolioRepository.save.mockResolvedValue(updatedPortfolio);

      const result = await service.update('portfolio123', updateDto);

      expect(result).toEqual(updatedPortfolio);
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException if portfolio has associated entities', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue({ id: 'portfolio123' });
      mockProductRepository.count.mockResolvedValue(1);
      mockFundingRequestRepository.count.mockResolvedValue(0);
      mockContractRepository.count.mockResolvedValue(0);

      await expect(service.delete('portfolio123')).rejects.toThrow(BadRequestException);
    });

    it('should deactivate portfolio if no associated entities', async () => {
      const portfolio = { id: 'portfolio123', status: 'active' };
      const expectedResult = {
        success: true,
        message: 'Portfolio closed successfully',
      };

      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockProductRepository.count.mockResolvedValue(0);
      mockFundingRequestRepository.count.mockResolvedValue(0);
      mockContractRepository.count.mockResolvedValue(0);
      mockPortfolioRepository.save.mockResolvedValue({ ...portfolio, status: 'closed' });

      const result = await service.delete('portfolio123');

      expect(result).toEqual(expectedResult);
      expect(portfolio.status).toBe('closed');
    });
  });

  describe('getWithProducts', () => {
    it('should return portfolio with its products', async () => {
      const portfolio = { id: 'portfolio123', name: 'Portfolio 1' };
      const products = [
        { id: 'product-1', name: 'Product 1' },
        { id: 'product-2', name: 'Product 2' },
      ];

      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockProductRepository.find.mockResolvedValue(products);

      const result = await service.getWithProducts('portfolio123');

      expect(result).toEqual({
        portfolio,
        products,
      });
    });
  });
});
