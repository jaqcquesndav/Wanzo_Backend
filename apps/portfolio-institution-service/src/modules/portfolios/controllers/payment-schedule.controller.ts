import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PaymentScheduleService, ScheduleGenerationParams } from '../services/payment-schedule.service';

@ApiTags('payment-schedules')
@Controller('portfolio_inst/portfolios/traditional/payment-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentScheduleController {
  constructor(private readonly paymentScheduleService: PaymentScheduleService) {}

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
