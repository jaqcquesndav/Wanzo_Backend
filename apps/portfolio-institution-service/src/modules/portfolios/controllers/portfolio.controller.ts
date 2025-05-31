import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PortfolioService } from '../services/portfolio.service';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioFilterDto } from '../dtos/portfolio.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('portfolios')
@Controller('portfolios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createPortfolioDto: CreatePortfolioDto, @Req() req: any) {
    const portfolio = await this.portfolioService.create(createPortfolioDto, req.user.id);
    return {
      success: true,
      portfolio,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all portfolios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['traditional_finance', 'leasing', 'investment'] })
  @ApiQuery({ name: 'risk_profile', required: false, enum: ['low', 'moderate', 'aggressive'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Portfolios retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: PortfolioFilterDto,
    @Req() req: any,
  ) {
    // If user is not admin, force filtering by their institution
    if (req.user.role !== 'admin') {
      filters.institutionId = req.user.institutionId;
    }

    const result = await this.portfolioService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('traditional')
  @ApiOperation({ summary: 'Get all traditional finance portfolios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Traditional portfolios retrieved successfully' })
  async findAllTraditional(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
  ) {
    const result = await this.portfolioService.findAllTraditional(+page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('leasing')
  @ApiOperation({ summary: 'Get all leasing portfolios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Leasing portfolios retrieved successfully' })
  async findAllLeasing(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
  ) {
    const result = await this.portfolioService.findAllLeasing(+page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('investment')
  @ApiOperation({ summary: 'Get all investment portfolios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Investment portfolios retrieved successfully' })
  async findAllInvestment(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
  ) {
    const result = await this.portfolioService.findAllInvestment(+page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio by ID' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findById(id);
    return {
      success: true,
      portfolio,
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
      ...result,
    };
  }

  @Get(':id/equipment')
  @ApiOperation({ summary: 'Get portfolio with its equipment catalog' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio and equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getWithEquipment(@Param('id') id: string) {
    const result = await this.portfolioService.getWithEquipment(id);
    return {
      success: true,
      ...result,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio updated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ) {
    const portfolio = await this.portfolioService.update(id, updatePortfolioDto);
    return {
      success: true,
      portfolio,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async remove(@Param('id') id: string) {
    return await this.portfolioService.delete(id);
  }
}