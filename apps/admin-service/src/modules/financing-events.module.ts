import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FinancingPaymentEventListener } from '../services/financing-payment-event-listener.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Configuration des événements
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  providers: [FinancingPaymentEventListener],
  exports: [FinancingPaymentEventListener],
})
export class FinancingEventsModule {}