import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RiskApiService } from '../services/risk-api.service';

@ApiTags('risk')
@Controller('risk')
export class RiskController {
  constructor(private readonly riskApiService: RiskApiService) {}

  @Get()
  @ApiOperation({ summary: 'Get all risks' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiResponse({ status: 200, description: 'Return all risks' })
  async findAll(@Query('companyId') companyId?: string) {
    return this.riskApiService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get risk by ID' })
  @ApiParam({ name: 'id', description: 'Risk ID' })
  @ApiResponse({ status: 200, description: 'Return risk by ID' })
  async findById(@Param('id') id: string) {
    return this.riskApiService.findById(id);
  }
}
