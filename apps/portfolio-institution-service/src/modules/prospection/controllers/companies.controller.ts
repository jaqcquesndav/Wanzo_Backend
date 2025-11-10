import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CompanyFiltersDto } from '../dtos/company.dto';
import { CompanyService } from '../services/company.service';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies with filters' })
  @ApiQuery({ name: 'sector', required: false, description: 'Filter by business sector' })
  @ApiQuery({ name: 'size', required: false, enum: ['small', 'medium', 'large'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'pending', 'rejected', 'funded', 'contacted'] })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search by name or sector' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async findAll(@Query() filters: CompanyFiltersDto, @Req() req: any) {
    return await this.companyService.findAll(filters, req.user.institutionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company details by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return await this.companyService.findOne(id, req.user.institutionId);
  }



  @Post('sync-authorized-smes')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Sync authorized SMEs from accounting service',
    description: 'Synchronizes all SMEs that have authorized data sharing from the accounting service for prospection purposes'
  })
  @ApiResponse({ status: 200, description: 'SMEs synchronized successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async syncAuthorizedSMEs(@Req() req: any) {
    const result = await this.companyService.syncAuthorizedSMEs(req.user.institutionId, req.user.id);
    return {
      message: 'SME synchronization completed',
      ...result
    };
  }

  @Post('sync-sme/:smeId')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Sync specific SME from accounting service',
    description: 'Synchronizes a specific SME that has authorized data sharing from the accounting service'
  })
  @ApiParam({ name: 'smeId', description: 'SME ID from accounting service' })
  @ApiResponse({ status: 200, description: 'SME synchronized successfully' })
  @ApiResponse({ status: 403, description: 'SME has not authorized data sharing or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'SME not found in accounting service' })
  async syncSpecificSME(@Param('smeId') smeId: string, @Req() req: any) {
    const company = await this.companyService.syncSpecificSME(smeId, req.user.institutionId, req.user.id);
    return {
      message: 'SME synchronized successfully',
      company
    };
  }

  @Get('authorized-smes/list')
  @ApiOperation({ 
    summary: 'Get list of SMEs that have authorized data sharing',
    description: 'Returns the list of SME IDs that have given consent for data sharing'
  })
  @ApiResponse({ status: 200, description: 'Authorized SMEs list retrieved successfully' })
  async getAuthorizedSMEsList() {
    const authorizedSMEs = await this.companyService.getAuthorizedSMEsList();
    return {
      authorizedSMEs,
      total: authorizedSMEs.length
    };
  }

  @Get('check-authorization/:smeId')
  @ApiOperation({ 
    summary: 'Check if SME has authorized data sharing',
    description: 'Verifies if a specific SME has given consent for data sharing'
  })
  @ApiParam({ name: 'smeId', description: 'SME ID to check' })
  @ApiResponse({ status: 200, description: 'Authorization status retrieved successfully' })
  async checkSMEAuthorization(@Param('smeId') smeId: string) {
    const isAuthorized = await this.companyService.checkSMEDataSharingAuthorization(smeId);
    return {
      smeId,
      isAuthorized,
      message: isAuthorized ? 'SME has authorized data sharing' : 'SME has not authorized data sharing'
    };
  }

  @Get('with-data-sharing')
  @ApiOperation({ 
    summary: 'Get companies with data sharing authorization status',
    description: 'Returns companies with their data sharing authorization status'
  })
  @ApiQuery({ name: 'sector', required: false, description: 'Filter by business sector' })
  @ApiQuery({ name: 'size', required: false, enum: ['small', 'medium', 'large'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'pending', 'rejected', 'funded', 'contacted'] })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search by name or sector' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Companies with data sharing status retrieved successfully' })
  async findAllWithDataSharing(@Query() filters: CompanyFiltersDto, @Req() req: any) {
    return await this.companyService.findAllWithDataSharingFilter(filters, req.user.institutionId);
  }
}