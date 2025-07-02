import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { InstitutionService } from '../services/institution.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('institutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionService: InstitutionService) {}

  @ApiOperation({ summary: 'Get all financial institutions' })
  @ApiResponse({ status: 200, description: 'Returns all financial institutions' })
  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.institutionService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get a financial institution by ID' })
  @ApiResponse({ status: 200, description: 'Returns the financial institution' })
  @ApiResponse({ status: 404, description: 'Financial institution not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const institution = await this.institutionService.findById(id);
    if (!institution) {
      throw new HttpException('Financial institution not found', HttpStatus.NOT_FOUND);
    }
    return institution;
  }

  @ApiOperation({ summary: 'Create a new financial institution' })
  @ApiResponse({ status: 201, description: 'Financial institution created successfully' })
  @Post()
  async create(@Body() createInstitutionDto: any) {
    return this.institutionService.create(createInstitutionDto);
  }

  @ApiOperation({ summary: 'Update a financial institution' })
  @ApiResponse({ status: 200, description: 'Financial institution updated successfully' })
  @ApiResponse({ status: 404, description: 'Financial institution not found' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateInstitutionDto: any) {
    return this.institutionService.update(id, updateInstitutionDto);
  }

  @ApiOperation({ summary: 'Delete a financial institution' })
  @ApiResponse({ status: 200, description: 'Financial institution deleted successfully' })
  @ApiResponse({ status: 404, description: 'Financial institution not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.institutionService.remove(id);
  }

  @ApiOperation({ summary: 'Validate a financial institution' })
  @ApiResponse({ status: 200, description: 'Financial institution validated successfully' })
  @ApiResponse({ status: 404, description: 'Financial institution not found' })
  @Put(':id/validate')
  async validate(@Param('id') id: string) {
    return this.institutionService.validate(id);
  }

  @ApiOperation({ summary: 'Suspend a financial institution' })
  @ApiResponse({ status: 200, description: 'Financial institution suspended successfully' })
  @ApiResponse({ status: 404, description: 'Financial institution not found' })
  @Put(':id/suspend')
  async suspend(@Param('id') id: string, @Body() suspensionDto: { reason: string }) {
    return this.institutionService.suspend(id, suspensionDto.reason);
  }

  @ApiOperation({ summary: 'Get institution-specific financial data' })
  @ApiResponse({ status: 200, description: 'Returns institution-specific financial data' })
  @ApiResponse({ status: 404, description: 'Financial institution not found' })
  @Get(':id/financial-data')
  async getFinancialData(@Param('id') id: string) {
    return this.institutionService.getFinancialData(id);
  }
}
