import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrderController } from './controllers/payment-order.controller';
import { PaymentOrderService } from './services/payment-order.service';
import { PaymentOrder } from './entities/payment-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentOrder]),
  ],
  controllers: [PaymentOrderController],
  providers: [PaymentOrderService],
  exports: [PaymentOrderService],
})
export class PaymentOrderModule {}