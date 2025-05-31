import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinancialStatementsService } from '../services/financial-statements.service';
import { AccountingFramework } from '../dtos/report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('financial-statements')
@Controller('financial-statements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialStatementsController {
  constructor(private readonly financialStatementsService: FinancialStatementsService) {}

  @Get('balance-sheet')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Generate balance sheet' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'as_of_date', required: true })
  @ApiQuery({ name: 'framework', required: false, enum: AccountingFramework })
  @ApiResponse({ status: 200, description: 'Balance sheet generated successfully' })
  async getBalanceSheet(
    @Query('fiscal_year') fiscalYear: string,
    @Query('as_of_date') asOfDate: Date,
    @Query('framework') framework: AccountingFramework = AccountingFramework.SYSCOHADA,
    @Req() req: any,
  ) {
    const balanceSheet = await this.financialStatementsService.generateBalanceSheet(
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
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Generate income statement' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  @ApiQuery({ name: 'framework', required: false, enum: AccountingFramework })
  @ApiResponse({ status: 200, description: 'Income statement generated successfully' })
  async getIncomeStatement(
    @Query('fiscal_year') fiscalYear: string,
    @Query('start_date') startDate: Date,
    @Query('end_date') endDate: Date,
    @Query('framework') framework: AccountingFramework = AccountingFramework.SYSCOHADA,
    @Req() req: any,
  ) {
    const incomeStatement = await this.financialStatementsService.generateIncomeStatement(
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
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Generate cash flow statement' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  @ApiQuery({ name: 'framework', required: false, enum: AccountingFramework })
  @ApiResponse({ status: 200, description: 'Cash flow statement generated successfully' })
  async getCashFlowStatement(
    @Query('fiscal_year') fiscalYear: string,
    @Query('start_date') startDate: Date,
    @Query('end_date') endDate: Date,
    @Query('framework') framework: AccountingFramework = AccountingFramework.SYSCOHADA,
    @Req() req: any,
  ) {
    const cashFlowStatement = await this.financialStatementsService.generateCashFlowStatement(
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

  @Get('general-ledger')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Generate general ledger' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  @ApiResponse({ status: 200, description: 'General ledger generated successfully' })
  async getGeneralLedger(
    @Query('fiscal_year') fiscalYear: string,
    @Query('start_date') startDate: Date,
    @Query('end_date') endDate: Date,
    @Req() req: any,
  ) {
    const generalLedger = await this.financialStatementsService.generateGeneralLedger(
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

  @Get('trial-balance')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Generate trial balance' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'as_of_date', required: true })
  @ApiResponse({ status: 200, description: 'Trial balance generated successfully' })
  async getTrialBalance(
    @Query('fiscal_year') fiscalYear: string,
    @Query('as_of_date') asOfDate: Date,
    @Req() req: any,
  ) {
    const trialBalance = await this.financialStatementsService.generateTrialBalance(
      req.user.companyId,
      fiscalYear,
      asOfDate,
    );

    return {
      success: true,
      trialBalance,
    };
  }
}