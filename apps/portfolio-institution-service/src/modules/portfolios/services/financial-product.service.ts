import { Injectable, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator'; // Assurez-vous que cette importation est présente
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { FinancialProduct } from '../entities/financial-product.entity';
import { CreateFinancialProductDto, UpdateFinancialProductDto, ProductFilterDto } from '../dtos/financial-product.dto';

@Injectable()
export class FinancialProductService {
  constructor(
    @InjectRepository(FinancialProduct)
    private productRepository: Repository<FinancialProduct>,
  ) {}

  async create(createProductDto: CreateFinancialProductDto): Promise<FinancialProduct> {
    const kiotaId = `KIOTA-FP-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const product = this.productRepository.create({
      ...createProductDto,
      kiotaId,
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
    const where: any = {};

    if (filters.portfolioId) {
      where.portfolioId = filters.portfolioId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      relations: ['portfolio'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

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
      relations: ['portfolio'],
    });

    if (!product) {
      throw new NotFoundException(`Financial product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateFinancialProductDto): Promise<FinancialProduct> {
    const product = await this.findById(id);
  
    // Valider les données de updateProductDto
    const errors = await validate(updateProductDto);
    if (errors.length > 0) {
      const errorMessages = errors.map(err => Object.values(err.constraints || {}).join(', ')).join('; ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }
  
    // Mettre à jour les propriétés du produit
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.findById(id);
    
    // Deactivate the product instead of deleting it
    product.active = false;
    await this.productRepository.save(product);

    return {
      success: true,
      message: 'Financial product deactivated successfully',
    };
  }
}