import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TreasuryService } from '../services/treasury.service';
import { CreateTreasuryAccountDto, UpdateTreasuryAccountDto, CreateTransactionDto, UpdateTransactionStatusDto, TransactionFilterDto, ReconcileAccountDto } from '../dtos/treasury.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('treasury')
@Controller('treasury')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post('accounts')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new treasury account' })
  @ApiResponse({ status: 201, description: 'Treasury account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() createAccountDto: CreateTreasuryAccountDto, @Req() req: any) {
    return await this.treasuryService.createAccount(createAccountDto, req.user.id);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all treasury accounts' })
  @ApiResponse({ status: 200, description: 'Treasury accounts retrieved successfully' })
  async findAllAccounts() {
    const accounts = await this.treasuryService.findAllAccounts();
    return { accounts };
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get treasury account details' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Treasury account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Treasury account not found' })
  async findAccountById(@Param('id') id: string) {
    return await this.treasuryService.findAccountById(id);
  }

  @Put('accounts/:id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update treasury account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Treasury account updated successfully' })
  @ApiResponse({ status: 404, description: 'Treasury account not found' })
  async updateAccount(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateTreasuryAccountDto,
  ) {
    return await this.treasuryService.updateAccount(id, updateAccountDto);
  }

  @Get('accounts/:accountId/transactions')
  @ApiOperation({ summary: 'List transactions for an account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'type', required: false, description: 'Transaction type (debit or credit)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountTransactions(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const filter: TransactionFilterDto = {
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await this.treasuryService.findAllTransactions(filter, +page, +pageSize);
    
    return {
      transactions: result.transactions,
      pagination: {
        page: result.page,
        pageSize: result.perPage,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / result.perPage),
      }
    };
  }

  @Post('transactions')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new treasury transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Req() req: any) {
    return await this.treasuryService.createTransaction(createTransactionDto, req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all treasury transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'fiscalYear', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['RECEIPT', 'PAYMENT', 'TRANSFER'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'completed', 'cancelled', 'rejected'] })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async findAllTransactions(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query() filters: TransactionFilterDto,
  ) {
    const result = await this.treasuryService.findAllTransactions(filters, +page, +pageSize);
    
    return {
      transactions: result.transactions,
      pagination: {
        page: result.page,
        pageSize: result.perPage,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / result.perPage),
      }
    };
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findTransactionById(@Param('id') id: string) {
    return await this.treasuryService.findTransactionById(id);
  }

  @Put('transactions/:id/status')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction status updated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async updateTransactionStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTransactionStatusDto,
    @Req() req: any,
  ) {
    return await this.treasuryService.updateTransactionStatus(id, updateStatusDto, req.user.id);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get overall treasury balance' })
  @ApiQuery({ name: 'type', required: false, description: 'Account type (all or bank)' })
  @ApiResponse({ status: 200, description: 'Treasury balance retrieved successfully' })
  async getTreasuryBalance(@Query('type') type = 'all') {
    return await this.treasuryService.getTreasuryBalance(type);
  }

  @Post('reconcile/:accountId')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Reconcile an account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 202, description: 'Reconciliation started' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @HttpCode(HttpStatus.ACCEPTED)
  async reconcileAccount(
    @Param('accountId') accountId: string,
    @Body() reconcileDto: ReconcileAccountDto,
    @Req() req: any,
  ) {
    return await this.treasuryService.reconcileAccount(accountId, reconcileDto, req.user.id);
  }
}