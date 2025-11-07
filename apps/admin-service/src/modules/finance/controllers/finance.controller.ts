import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FinanceService } from '../services/finance.service';
import {
  SubscriptionPlanDto,
  ListSubscriptionsQueryDto, PaginatedSubscriptionsDto, SubscriptionDto, CreateSubscriptionDto, UpdateSubscriptionDto, CancelSubscriptionDto, CancelSubscriptionResponseDto,
  ListInvoicesQueryDto, PaginatedInvoicesDto, InvoiceDto, CreateInvoiceDto, UpdateInvoiceDto, SendInvoiceReminderResponseDto,
  ListPaymentsQueryDto, PaginatedPaymentsDto, PaymentDto, RecordManualPaymentDto, VerifyPaymentDto, VerifyPaymentResponseDto,
  ListTransactionsQueryDto, PaginatedTransactionsDto, TransactionDto, CreateTransactionDto,
  TokenPackageDto,
  ListTokenTransactionsQueryDto, PaginatedTokenTransactionsDto,
  GetTokenBalanceQueryDto, TokenBalanceDto,
  GetFinancialSummaryQueryDto, FinancialSummaryDto
} from '../dtos/finance.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { Request } from 'express';
import { TokenType } from '../../../shared/enums';

@ApiTags('Finance & Subscriptions')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // 1. Subscription Plan Endpoints
  @Get('subscriptions/plans')
  @ApiOperation({ summary: 'List all available subscription plans' })
  @ApiResponse({ status: 200, description: 'A list of subscription plans.', type: [SubscriptionPlanDto] })
  @Roles(Role.Admin)
  async getSubscriptionPlans(@Query() query: any = {}): Promise<SubscriptionPlanDto[]> {
    return this.financeService.listSubscriptionPlans(query);
  }

  // 2. Subscription Endpoints
  @Get('subscriptions')
  @ApiOperation({ summary: 'List all subscriptions with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'A paginated list of subscriptions.', type: PaginatedSubscriptionsDto })
  @Roles(Role.Admin)
  async listSubscriptions(@Query() query: ListSubscriptionsQueryDto): Promise<PaginatedSubscriptionsDto> {
    return this.financeService.listSubscriptions(query);
  }
  @Get('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Get a specific subscription by ID' })
  @ApiResponse({ status: 200, description: 'The subscription details.', type: SubscriptionDto })
  @Roles(Role.Admin)
  async getSubscriptionById(@Param('subscriptionId', ParseUUIDPipe) subscriptionId: string): Promise<SubscriptionDto> {
    return this.financeService.getSubscriptionById(subscriptionId);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a new subscription for a customer' })
  @ApiResponse({ status: 201, description: 'The newly created subscription.', type: SubscriptionDto })
  @Roles(Role.Admin)
  async createSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    return this.financeService.createSubscription(createSubscriptionDto);
  }

  @Put('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Update an existing subscription' })
  @ApiResponse({ status: 200, description: 'The updated subscription.', type: SubscriptionDto })
  @Roles(Role.Admin)
  async updateSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDto> {
    return this.financeService.updateSubscription(subscriptionId, updateSubscriptionDto);
  }
  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel an active subscription' })
  @ApiResponse({ status: 200, description: 'The canceled subscription details.', type: CancelSubscriptionResponseDto })
  @Roles(Role.Admin)
  async cancelSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ): Promise<SubscriptionDto> {
    return this.financeService.cancelSubscription(subscriptionId, cancelSubscriptionDto);
  }

  // 3. Invoice Endpoints
  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'A paginated list of invoices.', type: PaginatedInvoicesDto })
  @Roles(Role.Admin)
  async listInvoices(@Query() query: ListInvoicesQueryDto): Promise<PaginatedInvoicesDto> {
    return this.financeService.listInvoices(query);
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Get a specific invoice by ID' })
  @ApiResponse({ status: 200, description: 'The invoice details.', type: InvoiceDto })
  @Roles(Role.Admin)
  async getInvoiceById(@Param('invoiceId', ParseUUIDPipe) invoiceId: string): Promise<InvoiceDto> {
    return this.financeService.getInvoiceById(invoiceId);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'The newly created invoice.', type: InvoiceDto })
  @Roles(Role.Admin)
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto): Promise<InvoiceDto> {
    return this.financeService.createInvoice(createInvoiceDto);
  }

  @Put('invoices/:invoiceId')
  @ApiOperation({ summary: 'Update an existing invoice' })
  @ApiResponse({ status: 200, description: 'The updated invoice.', type: InvoiceDto })
  @Roles(Role.Admin)
  async updateInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceDto> {
    return this.financeService.updateInvoice(invoiceId, updateInvoiceDto);
  }

  @Delete('invoices/:invoiceId')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 204, description: 'Invoice successfully deleted.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.Admin)
  async deleteInvoice(@Param('invoiceId', ParseUUIDPipe) invoiceId: string): Promise<void> {
    return this.financeService.deleteInvoice(invoiceId);
  }

  @Post('invoices/:invoiceId/send-reminder')
  @ApiOperation({ summary: 'Send a reminder for an unpaid invoice' })
  @ApiResponse({ status: 200, description: 'Reminder sent successfully.', type: SendInvoiceReminderResponseDto })
  @Roles(Role.Admin)
  async sendInvoiceReminder(@Param('invoiceId', ParseUUIDPipe) invoiceId: string): Promise<SendInvoiceReminderResponseDto> {
    return this.financeService.sendInvoiceReminder(invoiceId);
  }

  // 4. Payment Endpoints
  @Get('payments')
  @ApiOperation({ summary: 'List all payments with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'A paginated list of payments.', type: PaginatedPaymentsDto })
  @Roles(Role.Admin)
  async listPayments(@Query() query: ListPaymentsQueryDto): Promise<PaginatedPaymentsDto> {
    return this.financeService.listPayments(query);
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiResponse({ status: 200, description: 'The payment details.', type: PaymentDto })
  @Roles(Role.Admin)
  async getPaymentById(@Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<PaymentDto> {
    return this.financeService.getPaymentById(paymentId);
  }

  @Post('payments/manual')
  @ApiOperation({ summary: 'Record a manual payment' })
  @ApiResponse({ status: 201, description: 'The newly recorded payment.', type: PaymentDto })
  @Roles(Role.Admin)
  async recordManualPayment(@Body() recordManualPaymentDto: RecordManualPaymentDto, @Req() req: Request): Promise<PaymentDto> {
    const adminUser = req.user as any; // Récupérer l'utilisateur courant depuis la requête
    return this.financeService.recordManualPayment(recordManualPaymentDto, adminUser);
  }

  @Post('payments/verify')
  @ApiOperation({ summary: 'Verify or reject a pending payment' })
  @ApiResponse({ status: 200, description: 'The updated payment details.', type: VerifyPaymentResponseDto })
  @Roles(Role.Admin)
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto, @Req() req: Request): Promise<PaymentDto> {
    const adminUser = req.user as any; // Récupérer l'utilisateur courant depuis la requête
    return this.financeService.verifyPayment(verifyPaymentDto, adminUser);
  }

  // 5. Transaction Endpoints
  @Get('transactions')
  @ApiOperation({ summary: 'List all financial transactions' })
  @ApiResponse({ status: 200, description: 'A paginated list of transactions.', type: PaginatedTransactionsDto })
  @Roles(Role.Admin)
  async listTransactions(@Query() query: ListTransactionsQueryDto): Promise<PaginatedTransactionsDto> {
    // Implémenter cette méthode dans le service
    return { items: [], totalCount: 0, page: 1, totalPages: 0 };
  }

  @Get('transactions/:transactionId')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiResponse({ status: 200, description: 'The transaction details.', type: TransactionDto })
  @Roles(Role.Admin)
  async getTransactionById(@Param('transactionId', ParseUUIDPipe) transactionId: string): Promise<TransactionDto> {
    // Implémenter cette méthode dans le service
    throw new Error('Method not implemented');
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a new transaction record' })
  @ApiResponse({ status: 201, description: 'The newly created transaction.', type: TransactionDto })
  @Roles(Role.Admin)
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {
    // Implémenter cette méthode dans le service
    throw new Error('Method not implemented');
  }

  // 6. Token Endpoints
  @Get('tokens/packages')
  @ApiOperation({ summary: 'List available token packages' })
  @ApiResponse({ status: 200, description: 'A list of token packages.', type: [TokenPackageDto] })
  @Roles(Role.Admin)
  async getTokenPackages(): Promise<TokenPackageDto[]> {
    // Implémenter cette méthode dans le service
    return [];
  }

  @Get('tokens/transactions')
  @ApiOperation({ summary: 'List all token transactions' })
  @ApiResponse({ status: 200, description: 'A paginated list of token transactions.', type: PaginatedTokenTransactionsDto })
  @Roles(Role.Admin)
  async getTokenTransactions(@Query() query: ListTokenTransactionsQueryDto): Promise<PaginatedTokenTransactionsDto> {
    // Implémenter cette méthode dans le service
    return { items: [], totalCount: 0, page: 1, totalPages: 0 };
  }

  @Get('tokens/balance/:customerId')
  @ApiOperation({ summary: 'Get token balance for a customer' })
  @ApiResponse({ status: 200, description: 'The customer token balance(s).' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  @Roles(Role.Admin)
  async getCustomerTokenBalance(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: GetTokenBalanceQueryDto,
  ): Promise<TokenBalanceDto | TokenBalanceDto[]> {    // Implémenter cette méthode dans le service
    return { 
      customerId, 
      tokenType: query.tokenType || TokenType.PURCHASED, 
      balance: 0,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  // 7. Financial Summary Endpoint
  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary statistics' })
  @ApiResponse({ status: 200, description: 'The financial summary.', type: FinancialSummaryDto })
  @Roles(Role.Admin)
  async getFinancialSummary(@Query() query: GetFinancialSummaryQueryDto): Promise<FinancialSummaryDto> {
    return this.financeService.getFinancialSummary(query);
  }
}
