import { Controller, Get, Query, Param, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportingService } from './services/reporting.service';
import { AuthGuard } from '@nestjs/passport'; // Assuming JWT or similar auth
import { CompanyId } from '../../common/decorators/company-id.decorator'; // Custom decorator to get companyId
import { AccountingStandard } from '../../common/enums/accounting.enum';
import { CompanyService } from '../company/services/company.service';

@Controller('reporting')
// @UseGuards(AuthGuard('jwt')) // Secure endpoints
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly companyService: CompanyService, // To fetch company details
  ) {}

  @Get('general-ledger')
  async getGeneralLedger(
    @CompanyId() companyId: string,
    @Query('fiscalYearId') fiscalYearId: string,
    @Query('accountId') accountId?: string, // Optional: filter by specific account
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }
    if (!fiscalYearId) {
      throw new BadRequestException('Fiscal Year ID is required.');
    }    if (!accountId) {
      throw new BadRequestException('Account ID is required.');
    }

    return this.reportingService.getGeneralLedgerForAccount(
      companyId,
      fiscalYearId,
      accountId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    );
  }

  @Get('trial-balance')
  async getTrialBalance(
    @CompanyId() companyId: string,
    @Query('fiscalYearId') fiscalYearId: string,
    @Query('asOfDate') asOfDate?: string, // Balance as of a specific date
  ) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }
    if (!fiscalYearId) {
      throw new BadRequestException('Fiscal Year ID is required.');
    }
    // TODO: Validate fiscalYearId belongs to companyId
    // TODO: Validate asOfDate format if provided

    return this.reportingService.getTrialBalance(
      companyId,
      fiscalYearId,
      asOfDate ? new Date(asOfDate) : undefined
    );
  }

  @Get('financial-statements/:statementType')
  async getFinancialStatement(
    @CompanyId() companyId: string,
    @Param('statementType') statementType: 'balance-sheet' | 'income-statement' | 'cash-flow-statement',
    @Query('fiscalYearId') fiscalYearId: string,
    @Query('asOfDate') asOfDate?: string, // For balance sheet
    @Query('periodStartDate') periodStartDate?: string, // For income statement & cash flow
    @Query('periodEndDate') periodEndDate?: string, // For income statement & cash flow
  ) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }
    if (!fiscalYearId) {
      throw new BadRequestException('Fiscal Year ID is required.');
    }
    // TODO: Validate fiscalYearId belongs to companyId

    const company = await this.companyService.findById(companyId);    
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }
    
    // Prioritize direct accountingStandard property, then check in metadata if not found
    const accountingStandard = company.accountingStandard || (company.metadata?.accountingStandard as AccountingStandard) || AccountingStandard.SYSCOHADA;

    let reportDate = asOfDate ? new Date(asOfDate) : new Date();
    let startDate = periodStartDate ? new Date(periodStartDate) : undefined;
    let endDate = periodEndDate ? new Date(periodEndDate) : undefined;

    // Basic validation for dates based on statement type
    if (statementType === 'balance-sheet' && !asOfDate) {
        // Use end of fiscal year if asOfDate is not provided for balance sheet
        // This requires fetching fiscal year details. For now, defaults to today or requires asOfDate.
        // Consider making asOfDate mandatory or deriving it from fiscalYearId if not provided.
    }
    if ((statementType === 'income-statement' || statementType === 'cash-flow-statement') && (!startDate || !endDate)) {
      // throw new BadRequestException('Period start and end dates are required for income/cash flow statements.');
      // Or default to the fiscal year period. For now, this will be handled in the service.
    }

    // Bien que notre service n'implémente pas encore cette méthode, 
    // nous allons simplement retourner un objet vide pour l'instant
    // TODO: Implémenter cette méthode dans le service
    return {
      companyId,
      fiscalYearId,
      statementType,
      accountingStandard,
      generatedAt: new Date(),
      message: "Cette fonctionnalité est en cours de développement."
    };
  }
}
