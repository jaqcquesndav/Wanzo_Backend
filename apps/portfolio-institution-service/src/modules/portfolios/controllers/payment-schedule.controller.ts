import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PaymentScheduleService, ScheduleGenerationParams } from '../services/payment-schedule.service';

@ApiTags('payment-schedules')
@Controller('portfolios/traditional/payment-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentScheduleController {
  constructor(private readonly paymentScheduleService: PaymentScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment schedules' })
  @ApiResponse({ status: 200, description: 'Payment schedules retrieved successfully' })
  async findAll() {
    const schedules = await this.paymentScheduleService.findAll();
    return {
      success: true,
      data: schedules,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment schedule by ID' })
  @ApiResponse({ status: 200, description: 'Payment schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment schedule not found' })
  async findOne(@Param('id') id: string) {
    const schedule = await this.paymentScheduleService.findOne(id);
    return {
      success: true,
      data: schedule,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new payment schedule' })
  @ApiResponse({ status: 201, description: 'Payment schedule created successfully' })
  async create(@Body() createData: any) {
    const schedule = await this.paymentScheduleService.create(createData);
    return {
      success: true,
      data: schedule,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update payment schedule' })
  @ApiResponse({ status: 200, description: 'Payment schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment schedule not found' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    const schedule = await this.paymentScheduleService.update(id, updateData);
    return {
      success: true,
      data: schedule,
    };
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate a payment schedule' })
  @ApiResponse({ status: 200, description: 'Payment schedule simulated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid simulation parameters' })
  async simulate(@Body() params: ScheduleGenerationParams) {
    const schedule = this.paymentScheduleService.generateSchedule(params);
    
    return {
      success: true,
      data: schedule,
    };
  }
}
