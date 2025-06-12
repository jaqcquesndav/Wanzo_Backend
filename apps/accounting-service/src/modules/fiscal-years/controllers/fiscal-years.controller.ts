import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FiscalYearsService } from '../services/fiscal-years.service';
import { FiscalYear } from '../entities/fiscal-year.entity';
import { CreateFiscalYearDto } from '../dtos/create-fiscal-year.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('fiscal-years')
@Controller('fiscal-years')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FiscalYearsController {
  constructor(private readonly fiscalYearsService: FiscalYearsService) {}
  @Get()
  @ApiOperation({ summary: 'Get all fiscal years' })
  @ApiResponse({ status: 200, description: 'Return all fiscal years', type: [FiscalYear] })
  async findAll(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const fiscalYears = await this.fiscalYearsService.findAll(req.user.companyId);
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
  @Put(':id/close')
  @ApiOperation({ summary: 'Close a fiscal year' })
  @ApiResponse({ status: 200, description: 'The fiscal year has been closed', type: FiscalYear })
  @ApiResponse({ status: 404, description: 'Fiscal year not found' })
  async closeFiscalYear(@Param('id') id: string, @Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const fiscalYear = await this.fiscalYearsService.closeFiscalYear(
      id, 
      req.user.companyId,
      req.user.id
    );
    return {
      success: true,
      data: fiscalYear
    };
  }
}
