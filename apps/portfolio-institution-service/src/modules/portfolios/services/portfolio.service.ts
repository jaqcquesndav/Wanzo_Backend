import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Portfolio, PortfolioStatus } from '../entities/portfolio.entity';
import { FinancialProduct, ProductStatus } from '../entities/financial-product.entity';
import { FundingRequest, FundingRequestStatus } from '../entities/funding-request.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioFilterDto } from '../dtos/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(FinancialProduct)
    private productRepository: Repository<FinancialProduct>,
    @InjectRepository(FundingRequest)
    private fundingRequestRepository: Repository<FundingRequest>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto, userId: string): Promise<Portfolio> {
    // Generate a unique reference number
    const reference = `TRP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      reference,
      status: PortfolioStatus.ACTIVE,
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
    const queryBuilder = this.portfolioRepository.createQueryBuilder('p');

    if (filters.status) {
      queryBuilder.andWhere('p.status = :status', { status: filters.status });
    }

    if (filters.manager) {
      queryBuilder.andWhere('p.managerId = :manager', { manager: filters.manager });
    }

    if (filters.client) {
      queryBuilder.andWhere('p.clientId = :client', { client: filters.client });
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('p.createdAt BETWEEN :dateFrom AND :dateTo', { 
        dateFrom: new Date(filters.dateFrom), 
        dateTo: new Date(filters.dateTo) 
      });
    } else if (filters.dateFrom) {
      queryBuilder.andWhere('p.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    } else if (filters.dateTo) {
      queryBuilder.andWhere('p.createdAt <= :dateTo', { dateTo: new Date(filters.dateTo) });
    }

    if (filters.search) {
      queryBuilder.andWhere('(p.name LIKE :search OR p.reference LIKE :search)', { 
        search: `%${filters.search}%` 
      });
    }

    if (filters.sortBy && filters.sortOrder) {
      queryBuilder.orderBy(`p.${filters.sortBy}`, filters.sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('p.createdAt', 'DESC');
    }

    const [portfolios, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

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

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const portfolio = await this.findById(id);

    // Check if there are any associated entities
    const [productsCount, fundingRequestsCount, contractsCount] = await Promise.all([
      this.productRepository.count({ where: { portfolio_id: id } }),
      this.fundingRequestRepository.count({ where: { portfolio_id: id } }),
      this.contractRepository.count({ where: { portfolio_id: id } }),
    ]);

    if (productsCount > 0 || fundingRequestsCount > 0 || contractsCount > 0) {
      throw new BadRequestException('Cannot delete portfolio with associated products, funding requests, or contracts');
    }

    // Change status to closed instead of deleting
    portfolio.status = PortfolioStatus.CLOSED;
    await this.portfolioRepository.save(portfolio);

    return {
      success: true,
      message: 'Portfolio closed successfully',
    };
  }

  async getWithProducts(id: string): Promise<{
    portfolio: Portfolio;
    products: FinancialProduct[];
  }> {
    const portfolio = await this.findById(id);
    const products = await this.productRepository.find({
      where: { portfolio_id: id, status: ProductStatus.ACTIVE },
    });

    return {
      portfolio,
      products,
    };
  }

  async close(id: string, closeData: { closureReason?: string; closureNotes?: string }): Promise<Portfolio> {
    const portfolio = await this.findById(id);

    if (portfolio.status === PortfolioStatus.CLOSED) {
      throw new BadRequestException('Portfolio is already closed');
    }

    // Check if there are active contracts or funding requests
    const activeContracts = await this.contractRepository.count({
      where: { portfolio_id: id, status: ContractStatus.ACTIVE }
    });

    const activeFundingRequests = await this.fundingRequestRepository.count({
      where: { portfolio_id: id, status: FundingRequestStatus.APPROVED }
    });

    if (activeContracts > 0 || activeFundingRequests > 0) {
      throw new BadRequestException('Cannot close portfolio with active contracts or funding requests');
    }

    portfolio.status = PortfolioStatus.CLOSED;
    portfolio.updated_at = new Date();

    return await this.portfolioRepository.save(portfolio);
  }
}