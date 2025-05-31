import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentProof } from './entities/payment-proof.entity';
import { User } from '../auth/entities/user.entity'; // Corrected path
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionTier,
      UserSubscription,
      Invoice,
      PaymentMethod,
      PaymentProof,
      User, // Register User repository if used by SubscriptionsService
    ]),
    AuthModule, // Add AuthModule here
    // forwardRef(() => AuthModule), // If AuthModule provides services needed here, or vice-versa for circular deps
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService, TypeOrmModule], // Export TypeOrmModule if entities are used elsewhere
})
export class SubscriptionsModule {}
