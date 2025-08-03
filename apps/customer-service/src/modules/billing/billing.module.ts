import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './services/billing.service';
import { BillingController } from './controllers/billing.controller';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Payment, User]),
    KafkaModule,
    AuthModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
