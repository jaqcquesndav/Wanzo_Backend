import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionPaymentEventListener } from '../../services/subscription-payment-event-listener.service';
import { SubscriptionPaymentAnalyticsController } from '../../controllers/subscription-payment-analytics.controller';
import { KafkaPaymentConsumerService } from '../../services/kafka-payment-consumer.service';

/**
 * Module pour les analytics de paiement d'abonnement
 * Centralise l'écoute des événements Kafka et fournit les APIs pour le dashboard admin
 */
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  controllers: [SubscriptionPaymentAnalyticsController],
  providers: [
    SubscriptionPaymentEventListener,
    KafkaPaymentConsumerService,
  ],
  exports: [
    SubscriptionPaymentEventListener,
    KafkaPaymentConsumerService,
  ],
})
export class SubscriptionPaymentAnalyticsModule {}