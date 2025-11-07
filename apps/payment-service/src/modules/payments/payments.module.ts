import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import { SerdiPayController } from './controllers/serdipay.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { PaymentsService } from './services/payments.service';
import { SerdiPayProvider } from './providers/serdipay.provider';
import { PaymentTransaction } from './entities/payment-transaction.entity';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([PaymentTransaction]),
    ClientsModule,
  ],
  controllers: [SerdiPayController, TransactionsController],
  providers: [PaymentsService, SerdiPayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
