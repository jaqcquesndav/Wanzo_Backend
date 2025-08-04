import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Subscription, SubscriptionPlan } from './entities/subscription.entity';
import { TokenPackage } from '../tokens/entities/token.entity';
import { TokenUsage } from '../tokens/entities/token-usage.entity';
import { TokenPurchase } from '../tokens/entities/token-purchase.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SubscriptionService } from './services/subscription.service';
import { FeatureAccessService } from './services/feature-access.service';
import { PricingDataSyncService } from './services/pricing-data-sync.service';
import { SubscriptionController } from './controllers/subscription.controller';
import { PricingController } from './controllers/pricing.controller';
import { AdminPricingController } from './controllers/admin-pricing.controller';
import { CommercialController } from './controllers/commercial.controller';
import { FinancialInstitutionController } from './controllers/financial-institution.controller';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { CustomerExtractorMiddleware } from './middleware/customer-extractor.middleware';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription, 
      SubscriptionPlan, 
      TokenPackage,
      TokenUsage,
      TokenPurchase,
      Customer
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
    KafkaModule,
  ],
  controllers: [
    SubscriptionController,
    PricingController,
    AdminPricingController,
    CommercialController,
    FinancialInstitutionController,
  ],
  providers: [
    SubscriptionService,
    FeatureAccessService,
    PricingDataSyncService,
    FeatureAccessGuard,
    CustomerExtractorMiddleware,
  ],
  exports: [
    SubscriptionService,
    FeatureAccessService,
    PricingDataSyncService,
    FeatureAccessGuard,
    CustomerExtractorMiddleware,
  ],
})
export class SubscriptionsModule {}
