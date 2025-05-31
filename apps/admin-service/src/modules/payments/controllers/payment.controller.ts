import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, PaymentMethodDto } from '../dtos/payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('payments')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payments')
  @ApiOperation({ 
    summary: 'Create payment',
    description: 'Create a new payment transaction'
  })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Req() req: any) {
    const payment = await this.paymentService.createPayment(
      req.user.companyId,
      createPaymentDto,
    );
    return {
      success: true,
      payment,
    };
  }

  @Get('payments')
  @ApiOperation({ 
    summary: 'Get payments',
    description: 'Retrieve a paginated list of payments'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPayments(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Req() req: any,
  ) {
    const result = await this.paymentService.getPayments(
      req.user.companyId,
      +page,
      +perPage,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string, @Req() req: any) {
    const payment = await this.paymentService.getPayment(req.user.companyId, id);
    return {
      success: true,
      payment,
    };
  }

  @Post('payment-methods')
  @ApiOperation({ 
    summary: 'Add payment method',
    description: 'Add a new payment method for the company'
  })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async addPaymentMethod(@Body() paymentMethodDto: PaymentMethodDto, @Req() req: any) {
    const paymentMethod = await this.paymentService.addPaymentMethod(
      req.user.companyId,
      paymentMethodDto,
    );
    return {
      success: true,
      paymentMethod,
    };
  }

  @Get('payment-methods')
  @ApiOperation({ 
    summary: 'Get payment methods',
    description: 'Retrieve all active payment methods for the company'
  })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  async getPaymentMethods(@Req() req: any) {
    const paymentMethods = await this.paymentService.getPaymentMethods(req.user.companyId);
    return {
      success: true,
      paymentMethods,
    };
  }
}