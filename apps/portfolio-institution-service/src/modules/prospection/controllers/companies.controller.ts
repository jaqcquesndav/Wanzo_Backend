import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ProspectionFiltersDto, GeolocationDto, ProspectionStatsDto } from '../dtos/prospection.dto';
import { ProspectionService } from '../services/prospection.service';
import { CompanySyncService } from '../../company-profile/services/company-sync.service';

@ApiTags('prospection')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(
    private readonly prospectionService: ProspectionService,
    private readonly companySyncService: CompanySyncService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all prospects with filters' })
  @ApiQuery({ name: 'sector', required: false, description: 'Filter by business sector' })
  @ApiQuery({ name: 'size', required: false, enum: ['small', 'medium', 'large'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'pending', 'contacted', 'qualified', 'rejected'] })
  @ApiQuery({ name: 'minCreditScore', required: false, type: Number, description: 'Minimum credit score' })
  @ApiQuery({ name: 'maxCreditScore', required: false, type: Number, description: 'Maximum credit score' })
  @ApiQuery({ name: 'financialRating', required: false, description: 'Filter by financial rating' })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search by name or sector' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Prospects retrieved successfully' })
  async findAll(@Query() filters: ProspectionFiltersDto, @Req() req: any) {
    return await this.prospectionService.findProspects(filters, req.user.institutionId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get prospection statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: ProspectionStatsDto })
  async getStats(@Req() req: any) {
    return await this.prospectionService.getProspectionStats(req.user.institutionId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find prospects by geographic proximity' })
  @ApiQuery({ name: 'latitude', required: true, type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'longitude', required: true, type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Search radius in kilometers (default: 50)' })
  @ApiResponse({ status: 200, description: 'Nearby prospects retrieved successfully' })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radiusKm') radiusKm: number = 50,
    @Query() filters: ProspectionFiltersDto,
  ) {
    return await this.prospectionService.findNearbyProspects(
      Number(latitude),
      Number(longitude),
      Number(radiusKm),
      filters
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prospect details by ID' })
  @ApiParam({ name: 'id', description: 'Prospect/Company ID' })
  @ApiResponse({ status: 200, description: 'Prospect details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prospect not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return await this.prospectionService.getProspectDetails(id, req.user.institutionId);
  }



  @Post(':id/sync')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Manually sync prospect data from accounting service',
    description: 'Forces a synchronization of prospect data from accounting service'
  })
  @ApiParam({ name: 'id', description: 'Prospect/Company ID to sync' })
  @ApiResponse({ status: 200, description: 'Prospect synchronized successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Prospect not found' })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async syncProspect(@Param('id') id: string, @Req() req: any) {
    const profile = await this.companySyncService.syncFromAccounting(id, true);
    return {
      message: 'Prospect data synchronized successfully from accounting service',
      prospect: this.prospectionService['toProspectDto'](profile)
    };
  }

  @Post(':id/sync-complete')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Complete sync from all sources (accounting + customer)',
    description: 'Synchronizes prospect data from both accounting and customer services'
  })
  @ApiParam({ name: 'id', description: 'Prospect/Company ID to sync' })
  @ApiResponse({ status: 200, description: 'Complete synchronization successful' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async syncProspectComplete(@Param('id') id: string) {
    return await this.companySyncService.syncComplete(id, true);
  }
}