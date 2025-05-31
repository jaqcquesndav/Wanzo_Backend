import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TreasuryService } from '../services/treasury.service';
import { CreateTreasuryAccountDto, UpdateTreasuryAccountDto, CreateTransactionDto, UpdateTransactionStatusDto, TransactionFilterDto } from '../dtos/treasury.dto';
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
  async createAccount(@Body() createAccountDto: CreateTreasuryAccountDto, @Req() req: any) {
    const account = await this.treasuryService.createAccount(createAccountDto, req.user.id);
    return {
      success: true,
      account,
    };
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all treasury accounts' })
  @ApiResponse({ status: 200, description: 'Treasury accounts retrieved successfully' })
  async findAllAccounts() {
    const accounts = await this.treasuryService.findAllAccounts();
    return {
      success: true,
      accounts,
    };
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get treasury account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Treasury account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Treasury account not found' })
  async findAccountById(@Param('id') id: string) {
    const account = await this.treasuryService.findAccountById(id);
    return {
      success: true,
      account,
    };
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
    const account = await this.treasuryService.updateAccount(id, updateAccountDto);
    return {
      success: true,
      account,
    };
  }

  @Post('transactions')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new treasury transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Req() req: any) {
    const transaction = await this.treasuryService.createTransaction(createTransactionDto, req.user.id);
    return {
      success: true,
      transaction,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all treasury transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['RECEIPT', 'PAYMENT', 'TRANSFER'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'completed', 'cancelled', 'rejected'] })
  @ApiQuery({ name: 'account_id', required: false })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async findAllTransactions(
    @Query('page') page = 1,
    @Query('per_page') perPage = 20,
    @Query() filters: TransactionFilterDto,
  ) {
    const result = await this.treasuryService.findAllTransactions(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findTransactionById(@Param('id') id: string) {
    const transaction = await this.treasuryService.findTransactionById(id);
    return {
      success: true,
      transaction,
    };
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
    const transaction = await this.treasuryService.updateTransactionStatus(id, updateStatusDto, req.user.id);
    return {
      success: true,
      transaction,
    };
  }

  @Get('accounts/:id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiQuery({ name: 'as_of_date', required: false, description: 'Balance as of date' })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountBalance(
    @Param('id') id: string,
    @Query('as_of_date') asOfDate?: Date,
  ) {
    const balance = await this.treasuryService.getAccountBalance(id, asOfDate);
    return {
      success: true,
      balance,
    };
  }
}