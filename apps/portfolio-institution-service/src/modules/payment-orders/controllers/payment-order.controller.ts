import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Req,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentOrderService } from '../services/payment-order.service';
import { 
  CreatePaymentOrderDto, 
  UpdatePaymentOrderDto, 
  UpdatePaymentOrderStatusDto 
} from '../dtos';
import { PaymentOrder, PaymentOrderStatus, TraditionalFundingType } from '../entities/payment-order.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentOrderController {
  constructor(private readonly paymentOrderService: PaymentOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment orders' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all payment orders with pagination',
    type: [PaymentOrder],
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: 'number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: 'number' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status', enum: PaymentOrderStatus })
  @ApiQuery({ name: 'fundingType', required: false, description: 'Filter by funding type', enum: TraditionalFundingType })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Filter by portfolio ID' })
  @ApiQuery({ name: 'contractReference', required: false, description: 'Filter by contract reference' })
  async findAll(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: PaymentOrderStatus,
    @Query('fundingType') fundingType?: TraditionalFundingType,
    @Query('portfolioId') portfolioId?: string,
    @Query('contractReference') contractReference?: string,
  ) {
    const filters: any = {};
    
    if (status) filters.status = status;
    if (fundingType) filters.fundingType = fundingType;
    if (portfolioId) filters.portfolioId = portfolioId;
    if (contractReference) filters.contractReference = contractReference;
    
    const result = await this.paymentOrderService.findAll(
      req.user.institutionId,
      filters,
      page,
      limit,
    );
    
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment order by ID' })
  @ApiParam({ name: 'id', description: 'Payment order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the payment order',
    type: PaymentOrder,
  })
  @ApiResponse({ status: 404, description: 'Payment order not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const paymentOrder = await this.paymentOrderService.findById(
      id,
      req.user.institutionId,
    );
    
    return {
      success: true,
      data: paymentOrder,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment order' })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment order created successfully',
    type: PaymentOrder,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createPaymentOrderDto: CreatePaymentOrderDto,
    @Req() req: any,
  ) {
    const paymentOrder = await this.paymentOrderService.create(
      createPaymentOrderDto,
      req.user.institutionId,
      req.user.sub,
    );
    
    return {
      success: true,
      data: paymentOrder,
      message: 'Payment order created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment order' })
  @ApiParam({ name: 'id', description: 'Payment order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment order updated successfully',
    type: PaymentOrder,
  })
  @ApiResponse({ status: 404, description: 'Payment order not found' })
  @ApiResponse({ status: 400, description: 'Cannot update order with current status' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentOrderDto: UpdatePaymentOrderDto,
    @Req() req: any,
  ) {
    const paymentOrder = await this.paymentOrderService.update(
      id,
      updatePaymentOrderDto,
      req.user.institutionId,
      req.user.sub,
    );
    
    return {
      success: true,
      data: paymentOrder,
      message: 'Payment order updated successfully',
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update payment order status' })
  @ApiParam({ name: 'id', description: 'Payment order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment order status updated successfully',
    type: PaymentOrder,
  })
  @ApiResponse({ status: 404, description: 'Payment order not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdatePaymentOrderStatusDto,
    @Req() req: any,
  ) {
    const paymentOrder = await this.paymentOrderService.updateStatus(
      id,
      updateStatusDto,
      req.user.institutionId,
      req.user.sub,
    );
    
    return {
      success: true,
      data: paymentOrder,
      message: 'Payment order status updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment order' })
  @ApiParam({ name: 'id', description: 'Payment order ID' })
  @ApiResponse({ status: 200, description: 'Payment order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment order not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete order with current status' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    await this.paymentOrderService.delete(id, req.user.institutionId);
    
    return {
      success: true,
      message: 'Payment order deleted successfully',
    };
  }
}