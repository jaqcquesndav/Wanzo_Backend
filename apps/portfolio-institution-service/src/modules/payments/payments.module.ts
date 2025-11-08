import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { UnifiedPaymentService } from './unified-payment.service';
import { UnifiedPaymentController } from './unified-payment.controller';
import { FinancingPaymentEventService } from './financing-payment-events.service';

// Entités importées
import { Contract } from '../portfolios/entities/contract.entity';
import { PaymentSchedule } from '../portfolios/entities/payment-schedule.entity';
import { Repayment } from '../portfolios/entities/repayment.entity';
import { Disbursement } from '../virements/entities/disbursement.entity';
import { PaymentOrder } from '../payment-orders/entities/payment-order.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      PaymentSchedule,
      Repayment,
      Disbursement,
      PaymentOrder,
      Portfolio
    ]),
    HttpModule,
    EventEmitterModule
  ],
  controllers: [UnifiedPaymentController],
  providers: [
    UnifiedPaymentService,
    FinancingPaymentEventService
  ],
  exports: [
    UnifiedPaymentService,
    FinancingPaymentEventService
  ]
})
export class PaymentsModule {}