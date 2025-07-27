import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FinancialProductService } from '../services/financial-product.service';
import { CreateFinancialProductDto, UpdateFinancialProductDto, ProductFilterDto } from '../dtos/financial-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ProductStatus } from '../entities/financial-product.entity';

@ApiTags('financial-products')
@Controller('financial-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialProductController {
  constructor(private readonly productService: FinancialProductService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new financial product' })
  @ApiResponse({ status: 201, description: 'Financial product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createProductDto: CreateFinancialProductDto) {
    const product = await this.productService.create(createProductDto);
    return {
      success: true,
      product,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all financial products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'portfolio_id', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'min_interest_rate', required: false, type: Number })
  @ApiQuery({ name: 'max_interest_rate', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Financial products retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: ProductFilterDto,
  ) {
    const result = await this.productService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get financial product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Financial product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Financial product not found' })
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findById(id);
    return {
      success: true,
      product,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update financial product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Financial product updated successfully' })
  @ApiResponse({ status: 404, description: 'Financial product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateFinancialProductDto,
  ) {
    const product = await this.productService.update(id, updateProductDto);
    return {
      success: true,
      product,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete financial product (sets to inactive)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Financial product deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Financial product not found' })
  async remove(@Param('id') id: string) {
    return await this.productService.delete(id);
  }
}