import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FiscalYearsService } from '../services/fiscal-years.service';
import { FiscalYear, FiscalYearStatus } from '../entities/fiscal-year.entity';
import { CreateFiscalYearDto } from '../dtos/create-fiscal-year.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { AuditFiscalYearDto } from '@/modules/fiscal-years/dtos/audit-fiscal-year.dto';
import { ImportFiscalYearDto } from '../dtos/import-fiscal-year.dto';

@ApiTags('fiscal-years')
@Controller('fiscal-years')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FiscalYearsController {
  constructor(private readonly fiscalYearsService: FiscalYearsService) {}
  
  @Post('import')
  @ApiOperation({ summary: 'Import a fiscal year from a file' })
  @ApiBody({
    description: 'Fiscal year data to import',
    type: ImportFiscalYearDto,
  })
  @ApiResponse({ status: 202, description: 'The import process has been started.' })
  @ApiResponse({ status: 400, description: 'Invalid data format.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async importFiscalYear(
    @Body() importFiscalYearDto: ImportFiscalYearDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    this.fiscalYearsService.importFiscalYear(
      importFiscalYearDto,
      req.user.companyId,
      req.user.id
    );
    
    return {
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'The import process has been started. You will be notified upon completion.',
      data: {
        taskId: `import_${Date.now()}` 
      }
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all fiscal years' })
  @ApiResponse({ status: 200, description: 'Return all fiscal years', type: [FiscalYear] })
  @ApiQuery({ name: 'status', required: false, enum: FiscalYearStatus, description: 'Filter by status (open, closed, audited)' })
  async findAll(
    @Request() req: ExpressRequest & { user: { companyId: string } },
    @Query('status') status?: FiscalYearStatus
  ): Promise<any> {
    const fiscalYears = await this.fiscalYearsService.findAll(req.user.companyId, status);
    return {
      success: true,
      data: fiscalYears
    };
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific fiscal year' })
  @ApiResponse({ status: 200, description: 'Return the fiscal year', type: FiscalYear })
  @ApiResponse({ status: 404, description: 'Fiscal year not found' })
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const fiscalYear = await this.fiscalYearsService.findOne(id, req.user.companyId);
    return {
      success: true,
      data: fiscalYear
    };
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new fiscal year' })
  @ApiResponse({ status: 201, description: 'The fiscal year has been created', type: FiscalYear })
  async create(@Body() createFiscalYearDto: CreateFiscalYearDto, @Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const fiscalYear = await this.fiscalYearsService.create(
      createFiscalYearDto, 
      req.user.companyId,
      req.user.id
    );
    return {
      success: true,
      data: fiscalYear
    };
  }
    @Post(':id/close')
  @ApiOperation({ summary: 'Close a fiscal year' })
  @ApiResponse({ status: 200, description: 'The fiscal year has been closed' })
  @ApiResponse({ status: 404, description: 'Fiscal year not found' })
  async closeFiscalYear(
    @Param('id') id: string, 
    @Body() closeData: { force?: boolean },
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const result = await this.fiscalYearsService.closeFiscalYear(
      id, 
      req.user.companyId,
      req.user.id,
      closeData?.force || false
    );
    return {
      success: true,
      data: {
        checks: result.checks,
        message: "Exercice clôturé avec succès"
      }
    };
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a closed fiscal year' })
  @ApiResponse({ status: 200, description: 'The fiscal year has been reopened', type: FiscalYear })
  @ApiResponse({ status: 404, description: 'Fiscal year not found' })
  async reopenFiscalYear(
    @Param('id') id: string, 
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const fiscalYear = await this.fiscalYearsService.reopenFiscalYear(
      id, 
      req.user.companyId,
      req.user.id
    );
    return {
      success: true,
      data: fiscalYear
    };
  }

  @Post(':id/audit')
  @ApiOperation({ summary: 'Mark a fiscal year as audited' })
  @ApiResponse({ status: 200, description: 'The fiscal year has been marked as audited' })
  @ApiResponse({ status: 404, description: 'Fiscal year not found' })
  async auditFiscalYear(
    @Param('id') id: string, 
    @Body() auditFiscalYearDto: AuditFiscalYearDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    await this.fiscalYearsService.auditFiscalYear(
      id, 
      auditFiscalYearDto,
      req.user.companyId,
      req.user.id
    );
    return {
      success: true,
      message: "Audit validé avec succès"
    };
  }
  
  @Put(':id')
  @ApiOperation({ summary: 'Update a fiscal year' })
  @ApiResponse({ status: 200, description: 'The fiscal year has been updated' })
  @ApiResponse({ status: 404, description: 'Fiscal year not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: { code: string },
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const fiscalYear = await this.fiscalYearsService.updateFiscalYear(
      id,
      updateData,
      req.user.companyId,
      req.user.id
    );
    return {
      success: true,
      data: fiscalYear
    };
  }
}
