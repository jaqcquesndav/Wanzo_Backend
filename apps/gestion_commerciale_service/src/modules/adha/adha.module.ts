import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhaService } from './adha.service';
import { AdhaController } from './adha.controller';
import { AdhaConversation } from './entities/adha-conversation.entity';
import { AdhaMessage } from './entities/adha-message.entity';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { KafkaProducerModule } from '../events/kafka-producer.module';
import { AdhaAiService } from './services/adha-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdhaConversation, AdhaMessage, User]),
    AuthModule,
    EventsModule, // Importer le module d'événements pour utiliser Kafka
    KafkaProducerModule, // Ajouter le module Kafka producer pour AdhaAiService
  ],
  controllers: [AdhaController],
  providers: [
    AdhaService,
    AdhaAiService, // Ajouter le service AdhaAiService
  ],
})
export class AdhaModule {}
