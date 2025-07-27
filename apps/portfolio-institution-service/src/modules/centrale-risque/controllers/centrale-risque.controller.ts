import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CentraleRisqueService } from '../services/centrale-risque.service';

@ApiTags('centrale-risque')
@Controller('centrale-risque')
export class CentraleRisqueController {
  constructor(private readonly centraleRisqueService: CentraleRisqueService) {}

  @Get('credit-risks')
  @ApiOperation({ summary: 'Get all credit risks' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'institutionId', required: false, description: 'Filter by institution ID' })
  @ApiResponse({ status: 200, description: 'Return all credit risks' })
  async findAllCreditRisks(
    @Query('companyId') companyId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.centraleRisqueService.findAllCreditRisks(companyId, institutionId);
  }

  @Get('credit-risks/:id')
  @ApiOperation({ summary: 'Get credit risk by ID' })
  @ApiParam({ name: 'id', description: 'Credit risk ID' })
  @ApiResponse({ status: 200, description: 'Return credit risk by ID' })
  async findCreditRiskById(@Param('id') id: string) {
    return this.centraleRisqueService.findCreditRiskById(id);
  }

  @Get('payment-incidents')
  @ApiOperation({ summary: 'Get all payment incidents' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'institutionId', required: false, description: 'Filter by institution ID' })
  @ApiResponse({ status: 200, description: 'Return all payment incidents' })
  async findAllPaymentIncidents(
    @Query('companyId') companyId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.centraleRisqueService.findAllPaymentIncidents(companyId, institutionId);
  }

  @Get('credit-score-history')
  @ApiOperation({ summary: 'Get credit score history' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'institutionId', required: false, description: 'Filter by institution ID' })
  @ApiResponse({ status: 200, description: 'Return credit score history' })
  async findCreditScoreHistory(
    @Query('companyId') companyId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.centraleRisqueService.findCreditScoreHistory(companyId, institutionId);
  }

  @Get('collaterals')
  @ApiOperation({ summary: 'Get all collaterals' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'institutionId', required: false, description: 'Filter by institution ID' })
  @ApiResponse({ status: 200, description: 'Return all collaterals' })
  async findAllCollaterals(
    @Query('companyId') companyId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.centraleRisqueService.findAllCollaterals(companyId, institutionId);
  }

  @Get('company-loans')
  @ApiOperation({ summary: 'Get all company loans' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'institutionId', required: false, description: 'Filter by institution ID' })
  @ApiResponse({ status: 200, description: 'Return all company loans' })
  async findAllCompanyLoans(
    @Query('companyId') companyId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.centraleRisqueService.findAllCompanyLoans(companyId, institutionId);
  }

  @Get('financial-transactions')
  @ApiOperation({ summary: 'Get all financial transactions' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'institutionId', required: false, description: 'Filter by institution ID' })
  @ApiResponse({ status: 200, description: 'Return all financial transactions' })
  async findAllFinancialTransactions(
    @Query('companyId') companyId?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.centraleRisqueService.findAllFinancialTransactions(companyId, institutionId);
  }

  @Get('risk-summary')
  @ApiOperation({ summary: 'Get risk summary for a company' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Return risk summary for company' })
  async getRiskSummary(@Query('companyId') companyId: string) {
    return this.centraleRisqueService.getRiskSummary(companyId);
  }
}
