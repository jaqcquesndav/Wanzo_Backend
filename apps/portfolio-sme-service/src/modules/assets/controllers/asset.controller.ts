import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AssetService } from '../services/asset.service';
import { CreateAssetDto, UpdateAssetDto, AssetFilterDto } from '../dtos/asset.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ValuationType } from '../entities/asset-valuation.entity';

@ApiTags('assets')
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createAssetDto: CreateAssetDto, @Req() req: any) {
    const asset = await this.assetService.create(createAssetDto, req.user.id);
    return {
      success: true,
      asset,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['real_estate', 'vehicle', 'equipment', 'intellectual_property', 'other'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'under_maintenance', 'inactive', 'sold'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: AssetFilterDto,
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') {
      filters.companyId = req.user.companyId;
    }

    const result = await this.assetService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string) {
    const asset = await this.assetService.findById(id);
    return {
      success: true,
      asset,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    const asset = await this.assetService.update(id, updateAssetDto);
    return {
      success: true,
      asset,
    };
  }

  @Post(':id/maintenance')
  @Roles('admin')
  @ApiOperation({ summary: 'Add maintenance record' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Maintenance record added successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async addMaintenanceRecord(
    @Param('id') id: string,
    @Body() record: {
      date: Date;
      type: string;
      description: string;
      cost: number;
      provider: string;
    },
  ) {
    const asset = await this.assetService.addMaintenanceRecord(id, record);
    return {
      success: true,
      asset,
    };
  }

  @Put(':id/insurance')
  @Roles('admin')
  @ApiOperation({ summary: 'Update insurance information' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Insurance information updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async updateInsurance(
    @Param('id') id: string,
    @Body() insuranceInfo: {
      provider: string;
      policyNumber: string;
      coverage: string[];
      startDate: Date;
      endDate: Date;
      cost: number;
    },
  ) {
    const asset = await this.assetService.updateInsurance(id, insuranceInfo);
    return {
      success: true,
      asset,
    };
  }

  @Post(':id/valuations')
  @Roles('admin')
  @ApiOperation({ summary: 'Add asset valuation' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Valuation added successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async addValuation(
    @Param('id') id: string,
    @Body() valuation: {
      type: ValuationType;
      value: number;
      valuationDate: Date;
      appraiser?: string;
      methodology?: Record<string, any>;
      notes?: string;
      validUntil?: Date;
    },
  ) {
    const newValuation = await this.assetService.addValuation(id, {
      ...valuation,
      type: ValuationType.MARKET, // Définit explicitement le type comme MARKET
      methodology: valuation.methodology
        ? {
            approach: valuation.methodology.approach || 'default',
            comparables: valuation.methodology.comparables || [],
            adjustments: valuation.methodology.adjustments || {},
          }
        : undefined,
    });
    return {
      success: true,
      valuation: newValuation,
    };
  }

  @Get(':id/valuations')
  @ApiOperation({ summary: 'Get asset valuation history' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Valuation history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getValuationHistory(@Param('id') id: string) {
    const valuations = await this.assetService.getValuationHistory(id);
    return {
      success: true,
      valuations,
    };
  }

  @Get(':id/depreciation')
  @ApiOperation({ summary: 'Get asset depreciation schedule' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Depreciation schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getDepreciationSchedule(@Param('id') id: string) {
    const schedule = await this.assetService.getDepreciationSchedule(id);
    return {
      success: true,
      schedule,
    };
  }
}