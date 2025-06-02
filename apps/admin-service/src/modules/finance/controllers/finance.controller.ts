import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from '@/modules/finance/services';
import {
  SubscriptionPlanDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanQueryParamsDto,
  CustomerSubscriptionDto,
  CreateCustomerSubscriptionDto,
  UpdateCustomerSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionQueryParamsDto,
  InvoiceDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
  TransactionDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryParamsDto,
  SubscriptionPlansResponseDto,
  SubscriptionPlanResponseDto,
  CustomerSubscriptionsResponseDto,
  CustomerSubscriptionResponseDto,
  InvoicesResponseDto,
  InvoiceResponseDto,
  TransactionsResponseDto,
  TransactionResponseDto,
  RevenueStatisticsDto,
  SubscriptionStatisticsDto,
  FinanceDashboardDto
} from '../dtos';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Subscription Plans
  @Get('subscription-plans')
  async getSubscriptionPlans(
    @Query() queryParams: SubscriptionPlanQueryParamsDto
  ): Promise<SubscriptionPlansResponseDto> {
    const plans = await this.financeService.findAllPlans(queryParams);
    return { data: plans };
  }

  @Get('subscription-plans/:id')
  async getSubscriptionPlan(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.financeService.findOnePlan(id);
    return { data: plan };
  }

  @Post('subscription-plans')
  async createSubscriptionPlan(
    @Body() createDto: CreateSubscriptionPlanDto
  ): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.financeService.createPlan(createDto);
    return { data: plan };
  }

  @Put('subscription-plans/:id')
  async updateSubscriptionPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubscriptionPlanDto
  ): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.financeService.updatePlan(id, updateDto);
    return { data: plan };
  }

  @Delete('subscription-plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscriptionPlan(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this.financeService.removePlan(id);
  }

  // Customer Subscriptions
  @Get('subscriptions')
  async getSubscriptions(
    @Query() queryParams: SubscriptionQueryParamsDto
  ): Promise<CustomerSubscriptionsResponseDto> {
    const { subscriptions, total, page, limit, pages } = await this.financeService.findAllSubscriptions(queryParams);
    
    return {
      data: subscriptions,
      pagination: {
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  @Get('subscriptions/:id')
  async getSubscription(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<CustomerSubscriptionResponseDto> {
    const subscription = await this.financeService.findOneSubscription(id);
    return { data: subscription };
  }

  @Post('subscriptions')
  async createSubscription(
    @Body() createDto: CreateCustomerSubscriptionDto
  ): Promise<CustomerSubscriptionResponseDto> {
    const subscription = await this.financeService.createSubscription(createDto);
    return { data: subscription };
  }

  @Put('subscriptions/:id')
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCustomerSubscriptionDto
  ): Promise<CustomerSubscriptionResponseDto> {
    const subscription = await this.financeService.updateSubscription(id, updateDto);
    return { data: subscription };
  }

  @Put('subscriptions/:id/cancel')
  async cancelSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelSubscriptionDto
  ): Promise<CustomerSubscriptionResponseDto> {
    const subscription = await this.financeService.cancelSubscription(id, cancelDto);
    return { data: subscription };
  }

  // Invoices
  @Get('invoices')
  async getInvoices(
    @Query() queryParams: InvoiceQueryParamsDto
  ): Promise<InvoicesResponseDto> {
    const { invoices, total, page, limit, pages } = await this.financeService.findAllInvoices(queryParams);
    
    return {
      data: invoices,
      pagination: {
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  @Get('invoices/:id')
  async getInvoice(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.financeService.findOneInvoice(id);
    return { data: invoice };
  }

  @Post('invoices')
  async createInvoice(
    @Body() createDto: CreateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.financeService.createInvoice(createDto);
    return { data: invoice };
  }

  @Put('invoices/:id')
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.financeService.updateInvoice(id, updateDto);
    return { data: invoice };
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInvoice(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this.financeService.removeInvoice(id);
  }

  // Transactions
  @Get('transactions')
  async getTransactions(
    @Query() queryParams: TransactionQueryParamsDto
  ): Promise<TransactionsResponseDto> {
    const { transactions, total, page, limit, pages } = await this.financeService.findAllTransactions(queryParams);
    
    return {
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  @Get('transactions/:id')
  async getTransaction(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.findOneTransaction(id);
    return { data: transaction };
  }

  @Post('transactions')
  async createTransaction(
    @Body() createDto: CreateTransactionDto
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.createTransaction(createDto);
    return { data: transaction };
  }

  @Put('transactions/:id')
  async updateTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTransactionDto
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.updateTransaction(id, updateDto);
    return { data: transaction };
  }

  // Statistics and Reports
  @Get('statistics/revenue')
  async getRevenueStatistics(): Promise<{ data: RevenueStatisticsDto }> {
    const statistics = await this.financeService.getRevenueStatistics();
    return { data: statistics };
  }

  @Get('statistics/subscriptions')
  async getSubscriptionStatistics(): Promise<{ data: SubscriptionStatisticsDto }> {
    const statistics = await this.financeService.getSubscriptionStatistics();
    return { data: statistics };
  }

  @Get('dashboard')
  async getFinanceDashboard(): Promise<{ data: FinanceDashboardDto }> {
    const dashboard = await this.financeService.getFinanceDashboard();
    return { data: dashboard };
  }
}
