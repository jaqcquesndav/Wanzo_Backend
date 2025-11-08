import { Body, Controller, Get, Param, Post, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SubscriptionPaymentService } from '../services/subscription-payment.service';
import { InitiateSubscriptionPaymentDto } from '../dto/initiate-subscription-payment.dto';
import { SerdiPayCallbackDto } from '../dto/serdipay-callback.dto';

@ApiTags('subscription-payments')
@Controller('subscriptions/payments')
@ApiBearerAuth()
export class SubscriptionPaymentsController {
  constructor(private readonly subscriptionPaymentService: SubscriptionPaymentService) {}

  @Post('initiate')
  @ApiOperation({ 
    summary: 'Initiate subscription payment via mobile money',
    description: 'Initiates a mobile money payment for a subscription plan using SerdiPay. The payment amount and plan details are validated before processing.'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully',
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', description: 'Internal transaction ID' },
        providerTransactionId: { type: 'string', description: 'SerdiPay transaction ID' },
        sessionId: { type: 'string', description: 'SerdiPay session ID' },
        status: { type: 'string', enum: ['pending', 'success', 'failed'] },
        httpStatus: { type: 'number', description: 'HTTP status from provider' },
        message: { type: 'string', description: 'Provider response message' },
        plan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            tokensIncluded: { type: 'number' },
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid plan, customer, or amount mismatch'
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found or not available for customer'
  })
  async initiateSubscriptionPayment(@Body() dto: InitiateSubscriptionPaymentDto) {
    return this.subscriptionPaymentService.initiateSubscriptionPayment(dto);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'SerdiPay callback for subscription payments',
    description: 'Webhook endpoint for SerdiPay to notify payment status updates. Automatically creates or renews subscriptions on successful payments.'
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Callback processed' }
      }
    }
  })
  async handleCallback(@Body() payload: SerdiPayCallbackDto) {
    await this.subscriptionPaymentService.handleSubscriptionPaymentCallback(payload);
    return { 
      ok: true, 
      message: 'Subscription payment callback processed' 
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ 
    summary: 'Get subscription payments for a customer',
    description: 'Retrieves all subscription payment transactions for a specific customer'
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer UUID',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscription payments',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'string' },
          currency: { type: 'string' },
          status: { type: 'string' },
          planId: { type: 'string' },
          subscriptionId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          meta: { type: 'object' }
        }
      }
    }
  })
  async getCustomerSubscriptionPayments(@Param('customerId') customerId: string) {
    return this.subscriptionPaymentService.getSubscriptionPayments(customerId);
  }

  @Get(':transactionId')
  @ApiOperation({ 
    summary: 'Get subscription payment by transaction ID',
    description: 'Retrieves details of a specific subscription payment transaction'
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction UUID',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription payment details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        providerTransactionId: { type: 'string' },
        sessionId: { type: 'string' },
        amount: { type: 'string' },
        currency: { type: 'string' },
        clientPhone: { type: 'string' },
        telecom: { type: 'string' },
        status: { type: 'string' },
        paymentType: { type: 'string', example: 'subscription' },
        customerId: { type: 'string' },
        planId: { type: 'string' },
        subscriptionId: { type: 'string' },
        meta: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription payment not found'
  })
  async getSubscriptionPayment(@Param('transactionId') transactionId: string) {
    return this.subscriptionPaymentService.getSubscriptionPayment(transactionId);
  }

  @Get('customer/:customerId/status')
  @ApiOperation({ 
    summary: 'Get customer subscription payment status summary',
    description: 'Returns a summary of payment statuses for a customer'
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer UUID',
    type: 'string'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Limit number of transactions to analyze (default: 10)'
  })
  async getCustomerPaymentStatus(
    @Param('customerId') customerId: string,
    @Query('limit') limit: number = 10
  ) {
    const payments = await this.subscriptionPaymentService.getSubscriptionPayments(customerId);
    const recentPayments = payments.slice(0, limit);
    
    const summary = {
      totalPayments: payments.length,
      recentPayments: recentPayments.length,
      statusBreakdown: {
        pending: recentPayments.filter(p => p.status === 'pending').length,
        success: recentPayments.filter(p => p.status === 'success').length,
        failed: recentPayments.filter(p => p.status === 'failed').length,
      },
      lastSuccessfulPayment: recentPayments.find(p => p.status === 'success'),
      lastFailedPayment: recentPayments.find(p => p.status === 'failed'),
      totalAmountPaid: recentPayments
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    };

    return summary;
  }
}