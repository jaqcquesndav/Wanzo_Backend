import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from '../services/accounting.service';
import { AccountingFramework } from '../enums/accounting.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('balance-sheet')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get balance sheet from accounting service' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'as_of_date', required: true })
  @ApiQuery({ name: 'framework', required: false, enum: AccountingFramework })
  @ApiResponse({ status: 200, description: 'Balance sheet retrieved successfully' })
  async getBalanceSheet(
    @Query('fiscal_year') fiscalYear: string,
    @Query('as_of_date') asOfDate: Date,
    @Query('framework') framework: AccountingFramework = AccountingFramework.SYSCOHADA,
    @Req() req: any,
  ) {
    const balanceSheet = await this.accountingService.getBalanceSheet(
      req.user.companyId,
      fiscalYear,
      asOfDate,
      framework,
    );

    return {
      success: true,
      balanceSheet,
    };
  }

  @Get('income-statement')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get income statement from accounting service' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  @ApiQuery({ name: 'framework', required: false, enum: AccountingFramework })
  @ApiResponse({ status: 200, description: 'Income statement retrieved successfully' })
  async getIncomeStatement(
    @Query('fiscal_year') fiscalYear: string,
    @Query('start_date') startDate: Date,
    @Query('end_date') endDate: Date,
    @Query('framework') framework: AccountingFramework = AccountingFramework.SYSCOHADA,
    @Req() req: any,
  ) {
    const incomeStatement = await this.accountingService.getIncomeStatement(
      req.user.companyId,
      fiscalYear,
      startDate,
      endDate,
      framework,
    );

    return {
      success: true,
      incomeStatement,
    };
  }

  @Get('cash-flow')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get cash flow statement from accounting service' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  @ApiQuery({ name: 'framework', required: false, enum: AccountingFramework })
  @ApiResponse({ status: 200, description: 'Cash flow statement retrieved successfully' })
  async getCashFlowStatement(
    @Query('fiscal_year') fiscalYear: string,
    @Query('start_date') startDate: Date,
    @Query('end_date') endDate: Date,
    @Query('framework') framework: AccountingFramework = AccountingFramework.SYSCOHADA,
    @Req() req: any,
  ) {
    const cashFlowStatement = await this.accountingService.getCashFlowStatement(
      req.user.companyId,
      fiscalYear,
      startDate,
      endDate,
      framework,
    );

    return {
      success: true,
      cashFlowStatement,
    };
  }

  @Get('trial-balance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get trial balance from accounting service' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'as_of_date', required: true })
  @ApiResponse({ status: 200, description: 'Trial balance retrieved successfully' })
  async getTrialBalance(
    @Query('fiscal_year') fiscalYear: string,
    @Query('as_of_date') asOfDate: Date,
    @Req() req: any,
  ) {
    const trialBalance = await this.accountingService.getTrialBalance(
      req.user.companyId,
      fiscalYear,
      asOfDate,
    );

    return {
      success: true,
      trialBalance,
    };
  }

  @Get('general-ledger')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get general ledger from accounting service' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  @ApiResponse({ status: 200, description: 'General ledger retrieved successfully' })
  async getGeneralLedger(
    @Query('fiscal_year') fiscalYear: string,
    @Query('start_date') startDate: Date,
    @Query('end_date') endDate: Date,
    @Req() req: any,
  ) {
    const generalLedger = await this.accountingService.getGeneralLedger(
      req.user.companyId,
      fiscalYear,
      startDate,
      endDate,
    );

    return {
      success: true,
      generalLedger,
    };
  }

  @Get('financial-ratios')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get financial ratios' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'as_of_date', required: true })
  @ApiResponse({ status: 200, description: 'Financial ratios calculated successfully' })
  async getFinancialRatios(
    @Query('fiscal_year') fiscalYear: string,
    @Query('as_of_date') asOfDate: Date,
    @Req() req: any,
  ) {
    const ratios = await this.accountingService.getFinancialRatios(
      req.user.companyId,
      fiscalYear,
      asOfDate,
    );

    return {
      success: true,
      ratios,
    };
  }
}