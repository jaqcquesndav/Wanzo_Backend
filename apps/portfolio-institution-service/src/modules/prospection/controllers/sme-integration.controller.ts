import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccountingIntegrationService } from '../../integration/accounting-integration.service';
import { CompanyService } from '../services/company.service';

@ApiTags('sme-integration')
@Controller('sme-integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SMEIntegrationController {
  constructor(
    private readonly accountingIntegrationService: AccountingIntegrationService,
    private readonly companyService: CompanyService,
  ) {}

  @Get('authorized-companies')
  @Roles('admin', 'portfolio_manager', 'analyst')
  @ApiOperation({ 
    summary: 'Get list of SMEs that have authorized data sharing',
    description: 'Returns the complete list of SME companies that have given consent for data sharing with portfolio institutions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of authorized SME companies retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        authorizedSMEs: {
          type: 'array',
          items: { type: 'string' }
        },
        total: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async getAuthorizedCompanies() {
    const authorizedSMEs = await this.accountingIntegrationService.getAuthorizedSMEsList();
    return {
      authorizedSMEs,
      total: authorizedSMEs.length,
      timestamp: new Date().toISOString()
    };
  }

  @Get('check-authorization/:smeId')
  @Roles('admin', 'portfolio_manager', 'analyst')
  @ApiOperation({ 
    summary: 'Check data sharing authorization for specific SME',
    description: 'Verifies if a specific SME company has authorized data sharing for portfolio prospection'
  })
  @ApiParam({ name: 'smeId', description: 'SME Company ID to check authorization for' })
  @ApiResponse({ 
    status: 200, 
    description: 'Authorization status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        smeId: { type: 'string' },
        isAuthorized: { type: 'boolean' },
        message: { type: 'string' },
        checkedAt: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'SME not found' })
  async checkAuthorization(@Param('smeId') smeId: string) {
    const isAuthorized = await this.accountingIntegrationService.checkDataSharingAuthorization(smeId);
    return {
      smeId,
      isAuthorized,
      message: isAuthorized 
        ? 'SME has authorized data sharing for portfolio prospection' 
        : 'SME has not authorized data sharing',
      checkedAt: new Date().toISOString()
    };
  }

  @Get('financial-data/:smeId')
  @Roles('admin', 'portfolio_manager', 'analyst')
  @ApiOperation({ 
    summary: 'Get financial data for authorized SME',
    description: 'Retrieves financial data from accounting service for an SME that has authorized data sharing'
  })
  @ApiParam({ name: 'smeId', description: 'SME Company ID to get financial data for' })
  @ApiResponse({ 
    status: 200, 
    description: 'SME financial data retrieved successfully'
  })
  @ApiResponse({ status: 403, description: 'SME has not authorized data sharing' })
  @ApiResponse({ status: 404, description: 'SME not found' })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async getSMEFinancialData(@Param('smeId') smeId: string) {
    const financialData = await this.accountingIntegrationService.getSMEFinancialData(smeId);
    return {
      ...financialData,
      retrievedAt: new Date().toISOString()
    };
  }

  @Get('prospect-data')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Get all authorized SMEs as prospect data',
    description: 'Retrieves comprehensive prospect data for all SMEs that have authorized data sharing'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authorized SME prospect data retrieved successfully'
  })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async getAuthorizedSMEsProspectData() {
    const prospectData = await this.accountingIntegrationService.getAuthorizedSMEsForProspection();
    return {
      prospects: prospectData,
      total: prospectData.length,
      retrievedAt: new Date().toISOString()
    };
  }

  @Post('sync-all')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Sync all authorized SMEs to local prospect database',
    description: 'Synchronizes all SMEs that have authorized data sharing from accounting service to local prospect database'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'SME synchronization completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        synced: { type: 'number' },
        errors: { type: 'number' },
        completedAt: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async syncAllAuthorizedSMEs(@Req() req: any) {
    const result = await this.companyService.syncAuthorizedSMEs(req.user.institutionId, req.user.id);
    return {
      message: 'SME synchronization process completed',
      ...result,
      completedAt: new Date().toISOString()
    };
  }

  @Post('sync/:smeId')
  @Roles('admin', 'portfolio_manager')
  @ApiOperation({ 
    summary: 'Sync specific SME to local prospect database',
    description: 'Synchronizes a specific SME that has authorized data sharing from accounting service to local prospect database'
  })
  @ApiParam({ name: 'smeId', description: 'SME Company ID to synchronize' })
  @ApiResponse({ 
    status: 200, 
    description: 'SME synchronized successfully'
  })
  @ApiResponse({ status: 403, description: 'SME has not authorized data sharing or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'SME not found in accounting service' })
  @ApiResponse({ status: 503, description: 'Accounting service unavailable' })
  async syncSpecificSME(@Param('smeId') smeId: string, @Req() req: any) {
    const company = await this.companyService.syncSpecificSME(smeId, req.user.institutionId, req.user.id);
    return {
      message: 'SME synchronized successfully to local prospect database',
      company,
      syncedAt: new Date().toISOString()
    };
  }
}