import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CompanyService } from '../services/company.service';
import { CreateCompanyDto, UpdateCompanyDto } from '../dtos/company.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ActivityService } from '../../activities/services/activity.service';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly activityService: ActivityService
  ) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
  ) {
    const result = await this.companyService.findAll(+page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    // Si l'utilisateur est un superadmin, vérifier qu'il appartient à cette entreprise
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin && req.user.companyId !== id) {
      throw new UnauthorizedException('You are not authorized to view this company');
    }
    
    const company = await this.companyService.findById(id);
    return {
      success: true,
      company,
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() req: any
  ) {
    const company = await this.companyService.create(createCompanyDto, req.user.id);
    
    // Log activity
    await this.activityService.logUserActivity(
      req.user.id,
      'COMPANY_CREATED',
      `Company ${company.name} was created`,
      { companyId: company.id }
    );
    
    return {
      success: true,
      company,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() req: any
  ) {
    const company = await this.companyService.update(id, updateCompanyDto);
    
    // Log activity
    await this.activityService.logUserActivity(
      req.user.id,
      'COMPANY_UPDATED',
      `Company ${company.name} was updated`,
      { companyId: company.id }
    );
    
    return {
      success: true,
      company,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.companyService.delete(id);
    
    // Log activity
    await this.activityService.logUserActivity(
      req.user.id,
      'COMPANY_DELETED',
      `Company was deleted`,
      { companyId: id }
    );
    
    return result;
  }
}