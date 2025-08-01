import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { SubscriptionTier } from '../subscriptions/entities/subscription-tier.entity';
import { Invoice } from '../subscriptions/entities/invoice.entity';
import { PaymentMethod } from '../subscriptions/entities/payment-method.entity';
import { PaymentProof } from '../subscriptions/entities/payment-proof.entity';
import { EntitiesModule } from './entities.module';

/**
 * SharedModule extends EntitiesModule to provide centralized entity repositories
 * and prevent circular dependencies between modules.
 */
@Module({
  imports: [
    EntitiesModule,
    TypeOrmModule.forFeature([
      UserSubscription,
      SubscriptionTier,
      Invoice,
      PaymentMethod,
      PaymentProof,
    ]),
  ],
  exports: [EntitiesModule, TypeOrmModule],
})
export class SharedModule {}
