import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LedgerService } from '../services/ledger.service';
import { AccountBalanceQueryDto, AccountMovementsQueryDto, TrialBalanceQueryDto, ExportLedgerQueryDto, ExportBalanceSheetQueryDto, SearchLedgerQueryDto } from '../dtos/ledger.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('accounts/:accountId/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountBalance(
    @Param('accountId') accountId: string,
    @Query() query: AccountBalanceQueryDto,
    @Req() req: Request
  ) {
    try {
      const balance = await this.ledgerService.getAccountBalance(accountId, query);
      return {
        success: true,
        data: balance
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account balance'
      };
    }
  }

  @Get('accounts/:accountId/movements')
  @ApiOperation({ summary: 'Get account movements' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account movements retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountMovements(
    @Param('accountId') accountId: string,
    @Query() query: AccountMovementsQueryDto,
    @Req() req: Request
  ) {
    try {
      const movements = await this.ledgerService.getAccountMovements(accountId, query);
      return {
        success: true,
        data: movements
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account movements'
      };
    }
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance' })
  @ApiResponse({ status: 200, description: 'Trial balance retrieved successfully' })
  async getTrialBalance(
    @Query() query: TrialBalanceQueryDto,
    @Req() req: Request
  ) {
    try {
      const trialBalance = await this.ledgerService.getTrialBalance(query);
      return {
        success: true,
        data: trialBalance
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trial balance'
      };
    }
  }

  @Get('general-ledger')
  @ApiOperation({ summary: 'Get general ledger' })
  @ApiResponse({ status: 200, description: 'General ledger retrieved successfully' })
  async getGeneralLedger(
    @Query() query: TrialBalanceQueryDto,
    @Req() req: Request
  ) {
    try {
      const generalLedger = await this.ledgerService.getGeneralLedger(query);
      return {
        success: true,
        data: generalLedger
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get general ledger'
      };
    }
  }

  @Get('accounts/:accountId')
  @ApiOperation({ summary: 'Get account movements (alternative endpoint)' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account movements retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountMovementsAlt(
    @Param('accountId') accountId: string,
    @Query() query: AccountMovementsQueryDto,
    @Req() req: Request
  ) {
    try {
      const movements = await this.ledgerService.getAccountMovements(accountId, query);
      return {
        success: true,
        data: movements
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account movements'
      };
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Export general ledger' })
  @ApiResponse({ status: 200, description: 'Ledger exported successfully' })
  async exportLedger(
    @Query() query: ExportLedgerQueryDto,
    @Req() req: Request
  ) {
    try {
      const exportResult = await this.ledgerService.exportLedger(query);
      return exportResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export ledger'
      };
    }
  }

  @Get('export-balance')
  @ApiOperation({ summary: 'Export balance sheet' })
  @ApiResponse({ status: 200, description: 'Balance sheet exported successfully' })
  async exportBalanceSheet(
    @Query() query: ExportBalanceSheetQueryDto,
    @Req() req: Request
  ) {
    try {
      const exportResult = await this.ledgerService.exportBalanceSheet(query);
      return exportResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export balance sheet'
      };
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search ledger entries' })
  @ApiResponse({ status: 200, description: 'Ledger search completed successfully' })
  async searchLedger(
    @Query() query: SearchLedgerQueryDto,
    @Req() req: Request
  ) {
    try {
      const searchResults = await this.ledgerService.searchLedger(query);
      return {
        success: true,
        data: searchResults
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search ledger'
      };
    }
  }
}
