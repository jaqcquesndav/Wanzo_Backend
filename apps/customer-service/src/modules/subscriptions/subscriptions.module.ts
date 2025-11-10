import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { Subscription, SubscriptionPlan } from './entities/subscription.entity';
import { TokenPackage } from '../tokens/entities/token.entity';
import { TokenUsage } from '../tokens/entities/token-usage.entity';
import { TokenPurchase } from '../tokens/entities/token-purchase.entity';
import { Customer } from '../customers/entities/customer.entity';
import { SubscriptionService } from './services/subscription.service';
import { FeatureAccessService } from './services/feature-access.service';
import { DatabaseFeatureAccessService } from './services/database-feature-access.service';
import { PricingDataSyncService } from './services/pricing-data-sync.service';
import { SubscriptionMobilePaymentService } from './services/subscription-payment.service';
import { PaymentEventListenerService } from './services/payment-event-listener.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { PaymentServiceIntegration } from './services/payment-service-integration.service';
import { PaymentOrchestratorService } from './services/payment-orchestrator.service';
import { SubscriptionKafkaService } from './services/subscription-kafka.service';
import { StripePaymentKafkaProducer } from './services/stripe-payment-kafka-producer.service';
import { TokenManagementService } from './services/token-management.service';
import { PromoCodeService } from './services/promo-code.service';
import { AccessControlService } from './services/access-control.service';
import { SubscriptionController } from './controllers/subscription.controller';
import { PricingController } from './controllers/pricing.controller';
import { AdminPricingController } from './controllers/admin-pricing.controller';
import { AdminSubscriptionController } from './controllers/admin-subscription.controller';
import { CommercialController } from './controllers/commercial.controller';
import { FinancialInstitutionController } from './controllers/financial-institution.controller';
import { SubscriptionPaymentController } from './controllers/subscription-payment.controller';
import { StripeSubscriptionPaymentController } from './controllers/stripe-subscription-payment.controller';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { CustomerExtractorMiddleware } from './middleware/customer-extractor.middleware';
import { KafkaModule } from '../kafka/kafka.module';
import {
  FeatureUsageTracking, 
  CustomerFeatureLimit, 
  CustomerTokenBalance, 
  TokenTransaction 
} from './entities/usage-tracking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription, 
      SubscriptionPlan, 
      TokenPackage,
      TokenUsage,
      TokenPurchase,
      Customer,
      FeatureUsageTracking,
      CustomerFeatureLimit,
      CustomerTokenBalance,
      TokenTransaction
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    forwardRef(() => KafkaModule),
  ],
  controllers: [
    SubscriptionController,
    PricingController,
    AdminPricingController,
    AdminSubscriptionController,
    CommercialController,
    FinancialInstitutionController,
    SubscriptionPaymentController,
    StripeSubscriptionPaymentController,
  ],
  providers: [
    SubscriptionService,
    // NOUVEAUX SERVICES UNIFIÉS
    PaymentOrchestratorService,
    SubscriptionKafkaService,
    // SERVICES EXISTANTS CONSERVÉS
    FeatureAccessService,
    DatabaseFeatureAccessService,
    AccessControlService,
    TokenManagementService,
    PromoCodeService,
    PricingDataSyncService,
    SubscriptionMobilePaymentService,
    PaymentEventListenerService,
    StripePaymentService,
    StripePaymentKafkaProducer,
    PaymentServiceIntegration,
    FeatureAccessGuard,
    CustomerExtractorMiddleware,
  ],
  exports: [
    SubscriptionService,
    // NOUVEAUX SERVICES PRINCIPAUX
    PaymentOrchestratorService,
    SubscriptionKafkaService,
    // SERVICES EXISTANTS
    FeatureAccessService,
    PricingDataSyncService,
    SubscriptionMobilePaymentService,
    PaymentEventListenerService,
    StripePaymentService,
    PaymentServiceIntegration,
    FeatureAccessGuard,
    CustomerExtractorMiddleware,
  ],
})
export class SubscriptionsModule {}
