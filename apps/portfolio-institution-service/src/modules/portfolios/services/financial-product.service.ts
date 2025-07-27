import { Injectable, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { FinancialProduct, ProductStatus, ProductType } from '../entities/financial-product.entity';
import { CreateFinancialProductDto, UpdateFinancialProductDto, ProductFilterDto } from '../dtos/financial-product.dto';

@Injectable()
export class FinancialProductService {
  constructor(
    @InjectRepository(FinancialProduct)
    private productRepository: Repository<FinancialProduct>,
  ) {}

  async create(createProductDto: CreateFinancialProductDto): Promise<FinancialProduct> {
    // Generate a unique code for the product
    const code = `FP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const product = this.productRepository.create({
      ...createProductDto,
      code,
      status: ProductStatus.ACTIVE
    });

    return await this.productRepository.save(product);
  }

  async findAll(
    filters: ProductFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{
    products: FinancialProduct[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const queryBuilder = this.productRepository.createQueryBuilder('fp');

    if (filters.portfolio_id) {
      queryBuilder.andWhere('fp.portfolio_id = :portfolioId', { portfolioId: filters.portfolio_id });
    }

    if (filters.status) {
      queryBuilder.andWhere('fp.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('fp.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere('(fp.name LIKE :search OR fp.code LIKE :search)', { 
        search: `%${filters.search}%` 
      });
    }

    if (filters.min_interest_rate) {
      queryBuilder.andWhere('fp.base_interest_rate >= :minRate', { minRate: filters.min_interest_rate });
    }

    if (filters.max_interest_rate) {
      queryBuilder.andWhere('fp.base_interest_rate <= :maxRate', { maxRate: filters.max_interest_rate });
    }

    const [products, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .orderBy('fp.created_at', 'DESC')
      .getManyAndCount();

    return {
      products,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<FinancialProduct> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Financial product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateFinancialProductDto): Promise<FinancialProduct> {
    const product = await this.findById(id);
  
    // Validate update data
    const errors = await validate(updateProductDto);
    if (errors.length > 0) {
      const errorMessages = errors.map(err => Object.values(err.constraints || {}).join(', ')).join('; ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }
  
    // Update product properties
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.findById(id);
    
    // Set status to inactive instead of deleting
    product.status = ProductStatus.INACTIVE;
    await this.productRepository.save(product);

    return {
      success: true,
      message: 'Financial product deactivated successfully',
    };
  }
}