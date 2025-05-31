import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioService } from './portfolio.service';
import { Portfolio, PortfolioType, RiskProfile } from '../entities/portfolio.entity';
import { FinancialProduct } from '../entities/financial-product.entity';
import { Equipment } from '../entities/equipment.entity';
import { CreatePortfolioDto } from '../dtos/portfolio.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepository: Repository<Portfolio>;
  let productRepository: Repository<FinancialProduct>;
  let equipmentRepository: Repository<Equipment>;

  const mockPortfolioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockProductRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockEquipmentRepository = {
    count: jest.fn(),
    find: jest.fn(),
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
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    portfolioRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    productRepository = module.get<Repository<FinancialProduct>>(getRepositoryToken(FinancialProduct));
    equipmentRepository = module.get<Repository<Equipment>>(getRepositoryToken(Equipment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPortfolioDto: CreatePortfolioDto = {
      name: 'Test Portfolio',
      type: PortfolioType.TRADITIONAL,
      targetAmount: 1000000,
      targetReturn: 10,
      targetSectors: ['Technology', 'Finance'],
      riskProfile: RiskProfile.MODERATE,
      metrics: {
        netValue: 0,
        averageReturn: 0,
        riskPortfolio: 0,
        sharpeRatio: 0,
        volatility: 0,
        alpha: 0,
        beta: 0,
      },
    };

    it('should create a portfolio successfully', async () => {
      const userId = 'user-123';
      const portfolio = { id: 'portfolio-123', ...createPortfolioDto };

      mockPortfolioRepository.create.mockReturnValue(portfolio);
      mockPortfolioRepository.save.mockResolvedValue(portfolio);

      const result = await service.create(createPortfolioDto, userId);

      expect(result).toEqual(portfolio);
      expect(mockPortfolioRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createPortfolioDto.name,
          type: createPortfolioDto.type,
          createdBy: userId,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated portfolios', async () => {
      const portfolios = [
        { id: 'portfolio-1', name: 'Portfolio 1' },
        { id: 'portfolio-2', name: 'Portfolio 2' },
      ];

      mockPortfolioRepository.findAndCount.mockResolvedValue([portfolios, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        portfolios,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        type: PortfolioType.TRADITIONAL,
        riskProfile: RiskProfile.MODERATE,
      };

      await service.findAll(filters, 1, 10);

      expect(mockPortfolioRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a portfolio if found', async () => {
      const portfolio = { id: 'portfolio-123', name: 'Test Portfolio' };
      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);

      const result = await service.findById('portfolio-123');

      expect(result).toEqual(portfolio);
    });

    it('should throw NotFoundException if portfolio not found', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update portfolio successfully', async () => {
      const portfolio = {
        id: 'portfolio-123',
        name: 'Original Name',
        type: PortfolioType.TRADITIONAL,
      };

      const updateDto = {
        name: 'Updated Name',
        targetReturn: 15,
      };

      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockPortfolioRepository.save.mockResolvedValue({ ...portfolio, ...updateDto });

      const result = await service.update('portfolio-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(mockPortfolioRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });
  });

  describe('delete', () => {
    it('should deactivate portfolio if no associated products/equipment', async () => {
      const portfolio = {
        id: 'portfolio-123',
        name: 'Test Portfolio',
        active: true,
      };

      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockProductRepository.count.mockResolvedValue(0);
      mockEquipmentRepository.count.mockResolvedValue(0);
      mockPortfolioRepository.save.mockResolvedValue({ ...portfolio, active: false });

      const result = await service.delete('portfolio-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Portfolio deactivated successfully');
    });

    it('should throw BadRequestException if portfolio has associated items', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue({ id: 'portfolio-123' });
      mockProductRepository.count.mockResolvedValue(1);
      mockEquipmentRepository.count.mockResolvedValue(0);

      await expect(service.delete('portfolio-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWithProducts', () => {
    it('should return portfolio with its products', async () => {
      const portfolio = { id: 'portfolio-123', name: 'Test Portfolio' };
      const products = [
        { id: 'product-1', name: 'Product 1' },
        { id: 'product-2', name: 'Product 2' },
      ];

      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockProductRepository.find.mockResolvedValue(products);

      const result = await service.getWithProducts('portfolio-123');

      expect(result).toEqual({
        portfolio,
        products,
      });
    });
  });

  describe('getWithEquipment', () => {
    it('should return portfolio with its equipment', async () => {
      const portfolio = { id: 'portfolio-123', name: 'Test Portfolio' };
      const equipment = [
        { id: 'equipment-1', name: 'Equipment 1' },
        { id: 'equipment-2', name: 'Equipment 2' },
      ];

      mockPortfolioRepository.findOne.mockResolvedValue(portfolio);
      mockEquipmentRepository.find.mockResolvedValue(equipment);

      const result = await service.getWithEquipment('portfolio-123');

      expect(result).toEqual({
        portfolio,
        equipment,
      });
    });
  });
});