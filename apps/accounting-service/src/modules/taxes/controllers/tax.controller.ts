import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TaxService } from '../services/tax.service';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationStatusDto, TaxDeclarationFilterDto } from '../dtos/tax.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('taxes')
@Controller('taxes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('declarations')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new tax declaration' })
  @ApiResponse({ status: 201, description: 'Tax declaration created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createTaxDeclarationDto: CreateTaxDeclarationDto, @Req() req: any) {
    const declaration = await this.taxService.create(createTaxDeclarationDto, req.user.id);
    return {
      success: true,
      declaration,
    };
  }

  @Get('declarations')
  @ApiOperation({ summary: 'Get all tax declarations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['TVA', 'IS', 'IPR', 'CNSS', 'INPP', 'ONEM', 'OTHER'] })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'pending', 'submitted', 'paid', 'rejected', 'cancelled'] })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'periodicity', required: false, enum: ['monthly', 'quarterly', 'annual'] })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Tax declarations retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 20,
    @Query() filters: TaxDeclarationFilterDto,
  ) {
    const result = await this.taxService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('declarations/:id')
  @ApiOperation({ summary: 'Get tax declaration by ID' })
  @ApiParam({ name: 'id', description: 'Declaration ID' })
  @ApiResponse({ status: 200, description: 'Tax declaration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tax declaration not found' })
  async findOne(@Param('id') id: string) {
    const declaration = await this.taxService.findById(id);
    return {
      success: true,
      declaration,
    };
  }

  @Put('declarations/:id/status')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update tax declaration status' })
  @ApiParam({ name: 'id', description: 'Declaration ID' })
  @ApiResponse({ status: 200, description: 'Tax declaration status updated successfully' })
  @ApiResponse({ status: 404, description: 'Tax declaration not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaxDeclarationStatusDto,
    @Req() req: any,
  ) {
    const declaration = await this.taxService.updateStatus(id, updateStatusDto, req.user.id);
    return {
      success: true,
      declaration,
    };
  }

  @Get('summary/:fiscalYear')
  @ApiOperation({ summary: 'Get tax summary for fiscal year' })
  @ApiParam({ name: 'fiscalYear', description: 'Fiscal year' })
  @ApiResponse({ status: 200, description: 'Tax summary retrieved successfully' })
  async getTaxSummary(@Param('fiscalYear') fiscalYear: string) {
    const summary = await this.taxService.getTaxSummary(fiscalYear);
    return {
      success: true,
      summary,
    };
  }
}