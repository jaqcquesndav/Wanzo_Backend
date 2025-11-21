import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import { TransactionsController } from './controllers/transactions.controller';
import { SubscriptionPaymentsController } from './controllers/subscription-payments.controller';
import { SerdiPayFinancingController } from './controllers/serdipay-financing.controller';
import { SubscriptionPaymentService } from './services/subscription-payment.service';
import { SubscriptionPaymentEventsService } from './services/subscription-payment-events.service';
import { PaymentRequestListenerService } from './services/payment-request-listener.service';
import { CreditPaymentConsumerService } from './services/credit-payment-consumer.service';
import { SerdiPayService } from './services/serdipay.service';
import { SerdiPayProvider } from './providers/serdipay.provider';
import { PaymentTransaction } from './entities/payment-transaction.entity';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([PaymentTransaction]),
    ClientsModule,
  ],
  controllers: [
    TransactionsController, 
    SubscriptionPaymentsController,
    SerdiPayFinancingController
  ],
  providers: [
    SubscriptionPaymentService,
    SubscriptionPaymentEventsService,
    PaymentRequestListenerService,
    CreditPaymentConsumerService,
    SerdiPayService,
    SerdiPayProvider
  ],
  exports: [
    SubscriptionPaymentService,
    SubscriptionPaymentEventsService,
    PaymentRequestListenerService,
    SerdiPayService
  ],
})
export class PaymentsModule {}
