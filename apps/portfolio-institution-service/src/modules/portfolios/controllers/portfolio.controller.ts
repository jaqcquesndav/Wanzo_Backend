import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PortfolioService } from '../services/portfolio.service';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioFilterDto } from '../dtos/portfolio.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('portfolios')
@Controller('portfolios/traditional')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new traditional portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createPortfolioDto: CreatePortfolioDto, @Req() req: any) {
    const portfolio = await this.portfolioService.create(createPortfolioDto, req.user.id);
    return {
      success: true,
      data: portfolio,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all traditional portfolios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'closed', 'suspended'] })
  @ApiQuery({ name: 'manager', required: false })
  @ApiQuery({ name: 'client', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'name', 'totalAmount'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Portfolios retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query() filters: PortfolioFilterDto,
    @Req() req: any,
  ) {
    const result = await this.portfolioService.findAll(filters, +page, +limit);
    return {
      success: true,
      data: result.portfolios,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.perPage,
        totalPages: Math.ceil(result.total / result.perPage)
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get traditional portfolio by ID' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findById(id);
    return {
      success: true,
      data: portfolio,
    };
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get portfolio with its financial products' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio and products retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getWithProducts(@Param('id') id: string) {
    const result = await this.portfolioService.getWithProducts(id);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update traditional portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio updated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(@Param('id') id: string, @Body() updatePortfolioDto: UpdatePortfolioDto) {
    const portfolio = await this.portfolioService.update(id, updatePortfolioDto);
    return {
      success: true,
      data: portfolio,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete traditional portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete portfolio with associated entities' })
  async remove(@Param('id') id: string) {
    const result = await this.portfolioService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post(':id/close')
  @Roles('admin')
  @ApiOperation({ summary: 'Close traditional portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio closed successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 400, description: 'Portfolio cannot be closed' })
  async close(@Param('id') id: string, @Body() closeData: { closureReason?: string; closureNotes?: string }) {
    const result = await this.portfolioService.close(id, closeData);
    return {
      success: true,
      data: result,
    };
  }
}