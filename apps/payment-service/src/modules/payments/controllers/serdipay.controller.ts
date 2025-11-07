import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { InitiateSerdiPayDto } from '../dto/initiate-serdipay.dto';
import { SerdiPayCallbackDto } from '../dto/serdipay-callback.dto';

@ApiTags('payments-serdipay')
@Controller('serdipay')
@ApiBearerAuth()
export class SerdiPayController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mobile')
  @ApiOperation({ summary: 'Initiate mobile payment with SerdiPay (AM/OM/MP/AF)' })
  async initiate(@Body() dto: InitiateSerdiPayDto) {
    return this.paymentsService.initiateSerdiPayMobile(dto);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SerdiPay callback endpoint (success/failed)' })
  async callback(@Body() payload: SerdiPayCallbackDto) {
    // For now, just acknowledge. In production, update transaction status.
    await this.paymentsService.handleSerdiPayCallback(payload);
    return { ok: true };
  }
}
