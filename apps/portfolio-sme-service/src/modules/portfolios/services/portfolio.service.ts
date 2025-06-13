import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Portfolio, PortfolioType, RiskProfile } from '../entities/portfolio.entity'; // Added RiskProfile import
import { FinancialProduct } from '../entities/financial-product.entity';
import { Equipment } from '../entities/equipment.entity';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioFilterDto } from '../dtos/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(FinancialProduct)
    private productRepository: Repository<FinancialProduct>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto, userId: string): Promise<Portfolio> {
    const kiotaId = `KIOTA-PORT-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      kiotaId,
      createdBy: userId,
    });

    return await this.portfolioRepository.save(portfolio);
  }

  async findAll(
    filters: PortfolioFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{
    portfolios: Portfolio[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.riskProfile) {
      where.riskProfile = filters.riskProfile;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [portfolios, total] = await this.portfolioRepository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      portfolios,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({ where: { id } });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }
    return portfolio;
  }

  async update(id: string, updatePortfolioDto: UpdatePortfolioDto): Promise<Portfolio> {
    const portfolio = await this.findById(id);
    Object.assign(portfolio, updatePortfolioDto);
    return await this.portfolioRepository.save(portfolio);
  }

  async createDefaultPortfolioForOrganization(organizationId: string, userId: string, organizationName: string): Promise<Portfolio> {
    const kiotaId = `KIOTA-PORT-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
    
    const defaultPortfolioData: Partial<Portfolio> = {
      name: `Default Portfolio for ${organizationName}`,
      type: PortfolioType.TRADITIONAL, // Or any other default type
      riskProfile: RiskProfile.MODERATE, // Corrected to use RiskProfile enum
      companyId: organizationId,
      kiotaId,
      createdBy: userId,
      active: true,
      // Add any other necessary default fields for a portfolio
      // For example, initializing metrics or other fields if necessary
      targetAmount: 0, // Default target amount
      targetReturn: 0, // Default target return
      targetSectors: [], // Default target sectors
      metrics: { // Default metrics
        netValue: 0,
        averageReturn: 0,
        riskPortfolio: 0,
        sharpeRatio: 0,
        volatility: 0,
        alpha: 0,
        beta: 0,
      }
    };

    const portfolio = this.portfolioRepository.create(defaultPortfolioData as Portfolio); // Added 'as Portfolio' for type assertion if create expects full entity
    return await this.portfolioRepository.save(portfolio);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const portfolio = await this.findById(id);

    // Vérifier s'il y a des produits ou équipements associés
    const [productsCount, equipmentCount] = await Promise.all([
      this.productRepository.count({ where: { portfolioId: id } }),
      this.equipmentRepository.count({ where: { portfolioId: id } }),
    ]);

    if (productsCount > 0 || equipmentCount > 0) {
      throw new BadRequestException('Cannot delete portfolio with associated products or equipment');
    }

    // Désactiver le portefeuille au lieu de le supprimer
    portfolio.active = false;
    await this.portfolioRepository.save(portfolio);

    return {
      success: true,
      message: 'Portfolio deactivated successfully',
    };
  }

  async getWithProducts(id: string): Promise<{
    portfolio: Portfolio;
    products: FinancialProduct[];
  }> {
    const portfolio = await this.findById(id);
    const products = await this.productRepository.find({
      where: { portfolioId: id, active: true },
    });

    return {
      portfolio,
      products,
    };
  }

  async getWithEquipment(id: string): Promise<{
    portfolio: Portfolio;
    equipment: Equipment[];
  }> {
    const portfolio = await this.findById(id);
    const equipment = await this.equipmentRepository.find({
      where: { portfolioId: id, availability: true },
    });

    return {
      portfolio,
      equipment,
    };
  }

  async findAllTraditional(
    page = 1,
    perPage = 10,
  ): Promise<{
    portfolios: Portfolio[];
    total: number;
    page: number;
    perPage: number;
  }> {
    return this.findAll(
      { type: PortfolioType.TRADITIONAL },
      page,
      perPage,
    );
  }

  async findAllLeasing(
    page = 1,
    perPage = 10,
  ): Promise<{
    portfolios: Portfolio[];
    total: number;
    page: number;
    perPage: number;
  }> {
    return this.findAll(
      { type: PortfolioType.LEASING },
      page,
      perPage,
    );
  }

  async findAllInvestment(
    page = 1,
    perPage = 10,
  ): Promise<{
    portfolios: Portfolio[];
    total: number;
    page: number;
    perPage: number;
  }> {
    return this.findAll(
      { type: PortfolioType.INVESTMENT },
      page,
      perPage,
    );
  }
}