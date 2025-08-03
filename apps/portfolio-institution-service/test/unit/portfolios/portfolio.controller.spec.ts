import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from '../../../src/modules/portfolios/controllers/portfolio.controller';
import { PortfolioService } from '../../../src/modules/portfolios/services/portfolio.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/modules/auth/guards/roles.guard';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioFilterDto } from '../../../src/modules/portfolios/dtos/portfolio.dto';
import { Portfolio, PortfolioStatus, RiskProfile, PortfolioType } from '../../../src/modules/portfolios/entities/portfolio.entity';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let portfolioService: PortfolioService;

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

  const mockPortfolioService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    close: jest.fn(),
    getWithProducts: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      role: 'admin',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: mockPortfolioService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<PortfolioController>(PortfolioController);
    portfolioService = module.get<PortfolioService>(PortfolioService);
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

      mockPortfolioService.create.mockResolvedValue(mockPortfolio);

      const result = await controller.create(createPortfolioDto, mockRequest);

      expect(portfolioService.create).toHaveBeenCalledWith(createPortfolioDto, mockRequest.user.id);
      expect(result).toEqual({
        success: true,
        data: mockPortfolio,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated portfolios', async () => {
      const filters: PortfolioFilterDto = {
        status: PortfolioStatus.ACTIVE,
      };

      const mockResult = {
        portfolios: [mockPortfolio],
        total: 1,
        page: 1,
        perPage: 10,
      };

      mockPortfolioService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10, filters, mockRequest);

      expect(portfolioService.findAll).toHaveBeenCalledWith(filters, 1, 10);
      expect(result).toEqual({
        success: true,
        data: mockResult.portfolios,
        meta: {
          total: mockResult.total,
          page: mockResult.page,
          limit: mockResult.perPage,
          totalPages: Math.ceil(mockResult.total / mockResult.perPage),
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a portfolio by id', async () => {
      mockPortfolioService.findById.mockResolvedValue(mockPortfolio);

      const result = await controller.findOne('1');

      expect(portfolioService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        success: true,
        data: mockPortfolio,
      });
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      const updatePortfolioDto: UpdatePortfolioDto = {
        name: 'Updated Portfolio',
        target_amount: 200000,
      };

      const updatedPortfolio = { ...mockPortfolio, ...updatePortfolioDto };
      mockPortfolioService.update.mockResolvedValue(updatedPortfolio);

      const result = await controller.update('1', updatePortfolioDto);

      expect(portfolioService.update).toHaveBeenCalledWith('1', updatePortfolioDto);
      expect(result).toEqual({
        success: true,
        data: updatedPortfolio,
      });
    });
  });

  describe('remove', () => {
    it('should delete a portfolio', async () => {
      const deleteResult = { success: true, message: 'Portfolio closed successfully' };
      mockPortfolioService.delete.mockResolvedValue(deleteResult);

      const result = await controller.remove('1');

      expect(portfolioService.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        success: true,
        message: deleteResult.message,
      });
    });
  });

  describe('close', () => {
    it('should close a portfolio', async () => {
      const closeData = { closureReason: 'Objectives reached' };
      const closedPortfolio = { ...mockPortfolio, status: PortfolioStatus.CLOSED };
      mockPortfolioService.close.mockResolvedValue(closedPortfolio);

      const result = await controller.close('1', closeData);

      expect(portfolioService.close).toHaveBeenCalledWith('1', closeData);
      expect(result).toEqual({
        success: true,
        data: closedPortfolio,
      });
    });
  });

  describe('getWithProducts', () => {
    it('should return portfolio with products', async () => {
      const portfolioWithProducts = {
        portfolio: mockPortfolio,
        products: [],
      };

      mockPortfolioService.getWithProducts.mockResolvedValue(portfolioWithProducts);

      const result = await controller.getWithProducts('1');

      expect(portfolioService.getWithProducts).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        success: true,
        data: portfolioWithProducts,
      });
    });
  });
});
