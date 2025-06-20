import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, HttpStatus, HttpCode, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TaxService } from '../services/tax.service';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationDto, UpdateTaxDeclarationStatusDto, TaxFilterDto } from '../dtos/tax.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Response } from 'express';
import { DeclarationType, DeclarationStatus, DeclarationPeriodicity } from '../entities/tax-declaration.entity';

@ApiTags('taxes')
@Controller('declarations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new tax declaration' })
  @ApiResponse({ status: 201, description: 'Tax declaration created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaxDeclarationDto: CreateTaxDeclarationDto, @Req() req: any) {
    createTaxDeclarationDto.companyId = req.user.companyId;
    return await this.taxService.create(createTaxDeclarationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tax declarations' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of items per page (default: 20)' })
  @ApiQuery({ name: 'type', required: false, enum: DeclarationType, description: 'Filter by declaration type' })
  @ApiQuery({ name: 'status', required: false, enum: DeclarationStatus, description: 'Filter by declaration status' })
  @ApiQuery({ name: 'period', required: false, description: 'Filter by period (YYYY-MM format)' })
  @ApiResponse({ status: 200, description: 'Tax declarations retrieved successfully' })
  async findAll(@Query() queryFilters: TaxFilterDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const page = queryFilters.page ? +queryFilters.page : 1;
    const pageSize = queryFilters.pageSize ? +queryFilters.pageSize : 20;

    const filters: TaxFilterDto = {
      ...queryFilters,
      companyId,
      page,
      pageSize,
    };

    const { declarations, total } = await this.taxService.findAll(filters);
    
    return {
      data: declarations,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  @Get('summary/:fiscalYear')
  @ApiOperation({ summary: 'Get tax summary for fiscal year' })
  @ApiParam({ name: 'fiscalYear', description: 'Fiscal year ID' })
  @ApiResponse({ status: 200, description: 'Tax summary retrieved successfully' })
  async getTaxSummary(@Param('fiscalYear') fiscalYearId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return await this.taxService.getTaxSummary(fiscalYearId, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax declaration by ID' })
  @ApiParam({ name: 'id', description: 'Declaration ID' })
  @ApiResponse({ status: 200, description: 'Tax declaration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tax declaration not found' })
  async findOne(@Param('id') id: string) {
    return await this.taxService.findById(id);
  }

  @Put(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update tax declaration' })
  @ApiParam({ name: 'id', description: 'Declaration ID' })
  @ApiResponse({ status: 200, description: 'Tax declaration updated successfully' })
  @ApiResponse({ status: 404, description: 'Tax declaration not found' })
  @ApiResponse({ status: 409, description: 'Cannot modify a submitted declaration' })
  async update(
    @Param('id') id: string,
    @Body() updateTaxDeclarationDto: UpdateTaxDeclarationDto,
    @Req() req: any,
  ) {
    return await this.taxService.update(id, updateTaxDeclarationDto, req.user.id);
  }

  @Post(':id/submit')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Submit tax declaration for official filing' })
  @ApiParam({ name: 'id', description: 'Declaration ID' })
  @ApiResponse({ status: 200, description: 'Tax declaration submitted successfully' })
  @ApiResponse({ status: 404, description: 'Tax declaration not found' })
  @ApiResponse({ status: 409, description: 'Cannot submit a declaration that is not in draft status' })
  async submit(@Param('id') id: string, @Req() req: any) {
    const updateStatusDto = new UpdateTaxDeclarationStatusDto();
    updateStatusDto.status = DeclarationStatus.SUBMITTED;
    return await this.taxService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download tax declaration in the specified format' })
  @ApiParam({ name: 'id', description: 'Declaration ID' })
  @ApiQuery({ name: 'format', required: true, enum: ['pdf', 'excel'], description: 'The format to download' })
  @ApiResponse({ status: 200, description: 'Tax declaration downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Tax declaration not found' })
  async download(@Param('id') id: string, @Query('format') format: string, @Res() res: Response) {
    const declaration = await this.taxService.findById(id);
    
    // This is a placeholder implementation
    // In a real implementation, you would generate the requested file format
    // and stream it back to the client
    if (format !== 'pdf' && format !== 'excel') {
      throw new NotFoundException('Unsupported format. Use "pdf" or "excel".');
    }
    
    // Placeholder for actual file generation logic
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=declaration-${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    
    // For now, just return JSON with a message since we're not actually generating files
    res.json({
      message: `Download of declaration ${id} in ${format} format would happen here`,
      declaration: declaration
    });
  }
}
